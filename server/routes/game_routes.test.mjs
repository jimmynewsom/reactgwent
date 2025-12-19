import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import { jest } from '@jest/globals';

describe('Game routes (comprehensive tests)', () => {
  const testSecret = 'test_secret_key_12345';
  let GameRouter;

  beforeEach(async () => {
    process.env.JWT_SECRET = testSecret;

    // Mock server.mjs functions used by the router so tests don't hit DB
    await jest.unstable_mockModule('../server.mjs', () => ({
      updateWinsAndLosses: jest.fn(),
      checkGamesThisMonth: jest.fn().mockResolvedValue(0),
      incrementGamesThisMonth: jest.fn()
    }));

    // import the router after mocking
    GameRouter = (await import('./game_routes.mjs')).default;
  });

  function createAppWithIo() {
    const mockIo = { use: jest.fn(), on: jest.fn(), to: jest.fn(() => ({ emit: jest.fn() })) };
    const app = express();
    app.use(express.json());
    app.use('/gwent', GameRouter(mockIo));
    return { app, mockIo };
  }

  test('createGame: success and then inProgress true', async () => {
    const { app } = createAppWithIo();
    const user = 'creator1';
    const token = jwt.sign(user, testSecret);

    // create game
    await request(app).get('/gwent/createGame').set('authorization', token).expect(200);

    // check in progress for user
    const res = await request(app).get('/gwent/checkUserHasGameInProgress').set('authorization', token).expect(200);
    expect(res.body).toEqual({ inProgress: true });
  });

  test('createGame: duplicate creation is rejected', async () => {
    const { app } = createAppWithIo();
    const user = 'creator2';
    const token = jwt.sign(user, testSecret);

    await request(app).get('/gwent/createGame').set('authorization', token).expect(200);
    const res = await request(app).get('/gwent/createGame').set('authorization', token).expect(400);
    expect(res.body).toHaveProperty('error');
  });

  test('createGame: reject when max games exceeded', async () => {
    const { app } = createAppWithIo();
    // create MAX_GAMES + 1 games
    const max = 5;
    for (let i = 0; i < max; i++) {
      const t = jwt.sign('u' + i, testSecret);
      await request(app).get('/gwent/createGame').set('authorization', t).expect(200);
    }
    // next should fail with 503
    const tnext = jwt.sign('extraUser', testSecret);
    const res = await request(app).get('/gwent/createGame').set('authorization', tnext).expect(503);
    expect(res.body).toHaveProperty('error');
  });

  test('joinGame: success, not found, and full', async () => {
    const { app } = createAppWithIo();

    const host = 'host1';
    const hostToken = jwt.sign(host, testSecret);
    await request(app).get('/gwent/createGame').set('authorization', hostToken).expect(200);

    // join success
    const joinToken = jwt.sign('joiner1', testSecret);
    await request(app).get(`/gwent/joinGame/${host}`).set('authorization', joinToken).expect(200);

    // joining a non-existent host
    const resNotFound = await request(app).get('/gwent/joinGame/nonexistent').set('authorization', jwt.sign('someone', testSecret)).expect(400);
    expect(resNotFound.body).toHaveProperty('error');

    // joining a full game (try joining again)
    const resFull = await request(app).get(`/gwent/joinGame/${host}`).set('authorization', jwt.sign('thirdPlayer', testSecret)).expect(400);
    expect(resFull.body).toHaveProperty('error');
  });

  test('resetGames: only allowed for authorized user', async () => {
    const { app } = createAppWithIo();
    // create a game as someone else
    const user = 'tempUser';
    await request(app).get('/gwent/createGame').set('authorization', jwt.sign(user, testSecret)).expect(200);

    // unauthorized reset
    await request(app).get('/gwent/resetGames').set('authorization', jwt.sign('notjimmy', testSecret)).expect(400);

    // authorized reset
    await request(app).get('/gwent/resetGames').set('authorization', jwt.sign('jimmynewsom', testSecret)).expect(200);

    // ensure games cleared: check getGameList is empty
    const res = await request(app).get('/gwent/getGameList').set('authorization', jwt.sign('someone', testSecret)).expect(200);
    expect(res.body).toEqual([]);
  });

  test('getGameList returns players arrays', async () => {
    const { app } = createAppWithIo();
    const a = jwt.sign('pA', testSecret);
    const b = jwt.sign('pB', testSecret);

    // create two single-player games
    await request(app).get('/gwent/createGame').set('authorization', a).expect(200);
    await request(app).get('/gwent/createGame').set('authorization', b).expect(200);

    const res = await request(app).get('/gwent/getGameList').set('authorization', a).expect(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(2);
  });
});
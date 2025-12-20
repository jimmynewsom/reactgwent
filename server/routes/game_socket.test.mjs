import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import { jest } from '@jest/globals';
import { Gwent, defaultDeck } from '../gwent/gwent.mjs';

describe('Game socket flows (ready_for_game / play_card / pass)', () => {
  const testSecret = 'test_secret_key_12345';
  let GameRouter;

  beforeEach(async () => {
    process.env.JWT_SECRET = testSecret;

    await jest.unstable_mockModule('../server.mjs', () => ({
      updateWinsAndLosses: jest.fn(),
      checkGamesThisMonth: jest.fn().mockResolvedValue(0),
      incrementGamesThisMonth: jest.fn()
    }));

    GameRouter = (await import('./game_routes.mjs')).default;
  });

  function createAppAndMockIo() {
    const recorded = [];
    const handlers = {};
    const mockIo = {
      use: jest.fn(),
      on: (event, handler) => { handlers[event] = handler; },
      to: (target) => ({ emit: (event, payload) => recorded.push({ target, event, payload }) })
    };

    const app = express();
    app.use(express.json());
    app.use('/gwent', GameRouter(mockIo));

    return { app, mockIo, handlers, recorded };
  }

  test('ready_for_game leads to deck_validation_passed and redirect when both ready', async () => {
    const { app, handlers, recorded } = createAppAndMockIo();

    const host = 'socketHost';
    const guest = 'socketGuest';
    const hostToken = jwt.sign(host, testSecret);
    const guestToken = jwt.sign(guest, testSecret);

    // create and join via HTTP
    await request(app).get('/gwent/createGame').set('authorization', hostToken).expect(200);
    await request(app).get(`/gwent/joinGame/${host}`).set('authorization', guestToken).expect(200);

    // simulate sockets connecting
    const hostSocket = {
      username: host,
      id: 'host-socket-id',
      join: jest.fn(),
      handshake: { auth: {} },
      handlers: {},
      on: function(event, cb) { this.handlers[event] = cb; }
    };

    const guestSocket = {
      username: guest,
      id: 'guest-socket-id',
      join: jest.fn(),
      handshake: { auth: {} },
      handlers: {},
      on: function(event, cb) { this.handlers[event] = cb; }
    };

    // call connection handler
    handlers.connection(hostSocket);
    handlers.connection(guestSocket);

    // both should have ready_for_game handlers
    const hostReady = hostSocket.handlers['ready_for_game'];
    const guestReady = guestSocket.handlers['ready_for_game'];
    expect(typeof hostReady).toBe('function');
    expect(typeof guestReady).toBe('function');

    // use a simple valid deck (defaultDeck import would be large, use minimal valid structure)
    const simpleDeck = { faction: 'Northern Realms', leaderName: 'Foltest King of Temeria', cards: { 'Dethmold': 1, 'Trebuchet': 2, 'Ballista': 2, 'Ves': 1, 'Keira Metz': 1, 'Sile de Tansarville': 1, 'Prince Stennis': 1, 'Dun Banner Medic': 1, 'Sabrina Glevissig': 1, 'Sheldon Skaggs': 1, 'Blue Stripes Commando': 2, 'Poor Fucking Infantry': 2, 'Redanian Foot Soldier': 1, 'Kaedweni Siege Expert': 3, 'Yarpen Zigrin': 1, 'Siegfried of Denesle': 1 } };

    // host ready -> should get either deck_validation_passed (if ready for game step) OR a redirect to deckbuilder (if join caused redirect state)
    hostReady(simpleDeck);
    const hasDeckValidation = recorded.some(r => r.event === 'deck_validation_passed' && r.target === 'host-socket-id');
    const hasRedirectToDeckbuilder = recorded.some(r => r.event === 'redirect' && r.target === host && r.payload === `/deckbuilder/${host}`);
    expect(hasDeckValidation || hasRedirectToDeckbuilder).toBe(true);

    // guest ready -> now both ready -> expect redirect emitted to room named after host
    guestReady(simpleDeck);
    expect(recorded).toContainEqual(expect.objectContaining({ target: host, event: 'redirect', payload: '/gwent' }));

    // after both ready, request_game_update should emit a game_update to requester
    const reqUpdate = hostSocket.handlers['request_game_update'];
    expect(typeof reqUpdate).toBe('function');
    reqUpdate();
    expect(recorded.some(r => r.event === 'game_update' && r.target === 'host-socket-id')).toBe(true);
  });

  test('play_card emits game_update to both players and pass handles game_over and stats update', async () => {
    const { app, handlers, recorded } = createAppAndMockIo();

    const host = 'sHost';
    const guest = 'sGuest';
    const hostToken = jwt.sign(host, testSecret);
    const guestToken = jwt.sign(guest, testSecret);

    // create and join
    await request(app).get('/gwent/createGame').set('authorization', hostToken).expect(200);
    await request(app).get(`/gwent/joinGame/${host}`).set('authorization', guestToken).expect(200);

    const hostSocket = { username: host, id: 'hostsid', join: jest.fn(), handshake: { auth: {} }, handlers: {}, on: function(e, c){ this.handlers[e]=c; } };
    const guestSocket = { username: guest, id: 'guestsid', join: jest.fn(), handshake: { auth: {} }, handlers: {}, on: function(e, c){ this.handlers[e]=c; } };

    handlers.connection(hostSocket);
    handlers.connection(guestSocket);

    // ready both to start game (use a simple valid deck)
    // use the canonical default deck which is valid
    hostSocket.handlers['ready_for_game']( defaultDeck );
    guestSocket.handlers['ready_for_game']( defaultDeck );

    // play_card from host
    hostSocket.handlers['play_card'](0);
    // expect game_update to be emitted to both socket ids
    expect(recorded.some(r => r.event === 'game_update' && r.target === 'hostsid')).toBe(true);
    expect(recorded.some(r => r.event === 'game_update' && r.target === 'guestsid')).toBe(true);

    // mock Gwent.pass to force a game over
    const passSpy = jest.spyOn(Gwent.prototype, 'pass').mockImplementation(() => 1);

    // call pass -> should emit game_over, call updateWinsAndLosses and incrementGamesThisMonth
    guestSocket.handlers['pass']();

    expect(recorded.some(r => r.event === 'game_over')).toBe(true);

    const serverMod = await import('../server.mjs');
    expect(serverMod.updateWinsAndLosses).toHaveBeenCalled();
    expect(serverMod.incrementGamesThisMonth).toHaveBeenCalled();

    passSpy.mockRestore();
  });
});

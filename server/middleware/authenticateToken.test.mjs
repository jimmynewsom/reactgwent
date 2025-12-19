import jwt from 'jsonwebtoken';
import { jest } from '@jest/globals';
import verifyToken, { verifyWebsocketToken } from './authenticateToken.mjs';

describe('authenticateToken middleware (HTTP)', () => {
  const testSecret = 'test_secret_key_12345';

  beforeEach(() => {
    process.env.JWT_SECRET = testSecret;
  });

  test('valid token sets req.username and calls next', (done) => {
    const username = 'httpUser';
    const token = jwt.sign(username, testSecret);
    const req = { headers: { authorization: token } };
    const res = { sendStatus: jest.fn() };
    const next = jest.fn();

    verifyToken(req, res, next);

    // allow async verify callback to run
    setTimeout(() => {
      expect(next).toHaveBeenCalled();
      expect(req.username).toBe(username);
      expect(res.sendStatus).not.toHaveBeenCalledWith(403);
      done();
    }, 20);
  });

  test('missing token sends 403 and does not call next', (done) => {
    const req = { headers: {} };
    const res = { sendStatus: jest.fn() };
    const next = jest.fn();

    verifyToken(req, res, next);

    setTimeout(() => {
      expect(res.sendStatus).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
      done();
    }, 20);
  });

  test('invalid token sends 403 and does not call next', (done) => {
    const req = { headers: { authorization: 'invalid.token.here' } };
    const res = { sendStatus: jest.fn() };
    const next = jest.fn();

    verifyToken(req, res, next);

    setTimeout(() => {
      expect(res.sendStatus).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
      done();
    }, 20);
  });
});

describe('verifyWebsocketToken (websocket)', () => {
  const testSecret = 'test_secret_key_12345';

  beforeEach(() => {
    process.env.JWT_SECRET = testSecret;
  });

  test('valid token sets socket.username and calls next without error', (done) => {
    const username = 'wsUser';
    const token = jwt.sign(username, testSecret);
    const mockSocket = {
      handshake: { auth: { Authorization: token } },
      username: null
    };

    const nextSpy = jest.fn();
    verifyWebsocketToken(mockSocket, nextSpy);

    setTimeout(() => {
      expect(nextSpy).toHaveBeenCalledWith();
      expect(mockSocket.username).toBe(username);
      done();
    }, 20);
  });

  test('missing token calls next with error', (done) => {
    const mockSocket = { handshake: { auth: {} }, username: null };
    const nextSpy = jest.fn();

    verifyWebsocketToken(mockSocket, nextSpy);

    setTimeout(() => {
      expect(nextSpy).toHaveBeenCalledWith(expect.any(Error));
      done();
    }, 20);
  });

  test('invalid token calls next with error', (done) => {
    const mockSocket = { handshake: { auth: { Authorization: 'invalid.token.here' } }, username: null };
    const nextSpy = jest.fn();

    verifyWebsocketToken(mockSocket, nextSpy);

    setTimeout(() => {
      expect(nextSpy).toHaveBeenCalledWith(expect.any(Error));
      done();
    }, 20);
  });
});

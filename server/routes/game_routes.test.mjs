//import request from 'supertest';
import express from 'express';
import { verifyWebsocketToken } from '../middleware/authenticateToken.mjs';
import jwt from 'jsonwebtoken';
import { jest } from '@jest/globals';

// Mock Express app for testing
const app = express();
app.use(express.json());

describe('Authentication Tests', () => {
  const testSecret = 'test_secret_key_12345';
  process.env.JWT_SECRET = testSecret;

  describe('JWT Token Generation', () => {
    test('Valid token is generated for login', (done) => {
      const username = 'testuser';
      jwt.sign(username, testSecret, function(error, token) {
        expect(token).toBeDefined();
        expect(token).not.toBeNull();
        expect(typeof token).toBe('string');
        done();
      });
    });

    test('Token can be verified', (done) => {
      const username = 'testuser';
      jwt.sign(username, testSecret, function(error, token) {
        jwt.verify(token, testSecret, (verifyError, decoded) => {
          expect(verifyError).toBeNull();
          expect(decoded).toBe(username);
          done();
        });
      });
    });

    test('Invalid token fails verification', (done) => {
      const invalidToken = 'invalid.token.here';
      jwt.verify(invalidToken, testSecret, (error, decoded) => {
        expect(error).toBeDefined();
        expect(decoded).toBeUndefined();
        done();
      });
    });

    test('Token from different secret fails verification', (done) => {
      const username = 'testuser';
      const wrongSecret = 'different_secret';
      
      jwt.sign(username, testSecret, function(error, token) {
        jwt.verify(token, wrongSecret, (verifyError, decoded) => {
          expect(verifyError).toBeDefined();
          done();
        });
      });
    });
  });

  describe('WebSocket Token Verification', () => {
    test('Valid token passes verification', (done) => {
      const username = 'testuser';
      jwt.sign(username, testSecret, function(error, token) {
        const mockSocket = {
          handshake: {
            auth: {
              Authorization: token
            }
          },
          username: null
        };

        const nextSpy = jest.fn();
        verifyWebsocketToken(mockSocket, nextSpy);

        // Give async operation time to complete
        setTimeout(() => {
          expect(nextSpy).toHaveBeenCalledWith();
          expect(mockSocket.username).toBe(username);
          done();
        }, 50);
      });
    });

    test('Missing token fails verification', (done) => {
      const mockSocket = {
        handshake: {
          auth: {}
        },
        username: null
      };

      const nextSpy = jest.fn();
      verifyWebsocketToken(mockSocket, nextSpy);

      setTimeout(() => {
        expect(nextSpy).toHaveBeenCalledWith(expect.any(Error));
        done();
      }, 50);
    });

    test('Invalid token fails verification', (done) => {
      const mockSocket = {
        handshake: {
          auth: {
            Authorization: 'invalid.token.here'
          }
        },
        username: null
      };

      const nextSpy = jest.fn();
      verifyWebsocketToken(mockSocket, nextSpy);

      setTimeout(() => {
        expect(nextSpy).toHaveBeenCalledWith(expect.any(Error));
        done();
      }, 50);
    });
  });
});
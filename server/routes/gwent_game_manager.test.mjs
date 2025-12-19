import { jest } from '@jest/globals';

describe('GwentGameManager (spec - TDD)', () => {
  test.todo('createGame should create a new game and return success');
  test.todo('createGame should reject duplicate creation by same user');
  test.todo('createGame should enforce MAX_GAMES and return 503 or error');
  test.todo('joinGame should add a player when space is available');
  test.todo('joinGame should reject joining non-existent game');
  test.todo('joinGame should reject joining a full game');
  test.todo('getGameList should return a list of player arrays');
  test.todo('resetGames should only succeed for authorized user and clear games');
});
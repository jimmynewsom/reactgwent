import { cardMap, defaultDeck } from '../gwent/gwent.mjs';
import { jest } from '@jest/globals';

let MultiplayerGwent;

describe('MultiplayerGwent unit tests', () => {
  beforeAll(async () => {
    await jest.unstable_mockModule('../server.mjs', () => ({
      updateWinsAndLosses: jest.fn(),
      checkGamesThisMonth: jest.fn().mockResolvedValue(0),
      incrementGamesThisMonth: jest.fn()
    }));
    const mod = await import('./game_routes.mjs');
    MultiplayerGwent = mod.MultiplayerGwent;
  });

  test('constructor sets player1 and initial state', () => {
    const mg = new MultiplayerGwent('hostA');
    expect(mg.player1.playerName).toBe('hostA');
    expect(mg.status).toBe('waiting for player two');
    expect(mg.getPlayerIndex('hostA')).toBe(0);
  });

  test('addPlayerTwo sets player2 and index map', () => {
    const mg = new MultiplayerGwent('hostB');
    mg.addPlayerTwo('guestB');
    expect(mg.player2.playerName).toBe('guestB');
    expect(mg.getPlayerIndex('guestB')).toBe(1);
  });

  test('setDecks and startGame creates a Gwent game and game state serializes', () => {
    const mg = new MultiplayerGwent('hostC');
    mg.addPlayerTwo('guestC');

    // Build simple decks from defaultDeck
    const deckFromDefault = [];
    for (let name in defaultDeck.cards) {
      for (let i = 0; i < defaultDeck.cards[name]; i++) {
        deckFromDefault.push(cardMap.get(name));
      }
    }

    mg.setDeck1(deckFromDefault);
    mg.setDeck2(deckFromDefault);
    mg.startGame();

    expect(mg.game).toBeDefined();

    const state0 = mg.getGameState(0);
    expect(state0).toHaveProperty('playerIndex', 0);
    expect(state0).toHaveProperty('playersTurn');
    expect(state0).toHaveProperty('board');
    expect(state0.player).toHaveProperty('hand');
    expect(state0.opponent).toHaveProperty('hand');
  });
});
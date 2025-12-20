import { GwentGameInstance, GwentGameManager } from './gwent_game_manager.mjs';
import { cardMap, defaultDeck } from '../gwent/gwent.mjs';
import { jest } from '@jest/globals';

let buildDeckFromDefault = () => {
  const deckFromDefault = [];
  for (let name in defaultDeck.cards) {
    for (let i = 0; i < defaultDeck.cards[name]; i++) {
      deckFromDefault.push(cardMap.get(name));
    }
  }
  return deckFromDefault;
};

describe('GwentGameInstance', () => {
  test('basic lifecycle', () => {
    const inst = new GwentGameInstance('host1');
    expect(inst.player1Name).toBe('host1');
    inst.addPlayerTwo('guest1');
    expect(inst.isFull()).toBe(true);

    const deck = buildDeckFromDefault();
    inst.setDeck1(deck);
    inst.setDeck2(deck);
    inst.startGame();
    expect(inst.game).toBeDefined();

    const state0 = inst.getGameState(0);
    expect(state0).toHaveProperty('playerIndex', 0);
  });

  test('addPlayerTwo throws when already full', () => {
    const inst = new GwentGameInstance('hostX');
    inst.addPlayerTwo('g1');
    expect(() => inst.addPlayerTwo('g2')).toThrow();
  });
});

describe('GwentGameManager', () => {
  test('createGame & getGameList & duplicate prevention', () => {
    const mgr = new GwentGameManager(3);
    const r1 = mgr.createGame('a');
    expect(r1.ok).toBe(true);
    const r2 = mgr.createGame('a');
    expect(r2.ok).toBe(false);

    const list = mgr.getGameList();
    expect(list.length).toBe(1);
    expect(list[0]).toEqual(['a']);
  });

  test('max games enforcement', () => {
    const mgr = new GwentGameManager(2);
    expect(mgr.createGame('u1').ok).toBe(true);
    expect(mgr.createGame('u2').ok).toBe(true);
    const r = mgr.createGame('u3');
    expect(r.ok).toBe(false);
    expect(r.code).toBe(503);
  });

  test('joinGame success and failure cases', () => {
    const mgr = new GwentGameManager(3);
    mgr.createGame('hosth');
    const rjoin = mgr.joinGame('hosth', 'p1');
    expect(rjoin.ok).toBe(true);

    // second join should fail (full)
    const rjoin2 = mgr.joinGame('hosth', 'p2');
    expect(rjoin2.ok).toBe(false);

    // joining a non-existent host
    const r3 = mgr.joinGame('nohost', 'someone');
    expect(r3.ok).toBe(false);
    expect(r3.code).toBe(400);
  });

  test('resetGames authorization', () => {
    const mgr = new GwentGameManager(3);
    mgr.createGame('aa');
    expect(mgr.getGameList().length).toBe(1);
    const rfail = mgr.resetGames('notjimmy');
    expect(rfail.ok).toBe(false);
    const r = mgr.resetGames('jimmynewsom');
    expect(r.ok).toBe(true);
    expect(mgr.getGameList().length).toBe(0);
  });
});

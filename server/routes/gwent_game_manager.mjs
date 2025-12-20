import { Player, Gwent } from '../gwent/gwent.mjs';

class GwentGameInstance {
  constructor(hostName){
    this.player1Name = hostName;
    this.player1 = new Player(hostName);
    this.player2Name = undefined;
    this.player2 = undefined;
    this.status = 'waiting for player two';
    this.playerIndexMap = new Map();
    this.playerIndexMap.set(hostName, 0);

    this.deck1 = undefined;
    this.deck2 = undefined;

    this.player1socketid = undefined;
    this.player2socketid = undefined;
    this.game = undefined;
  }

  addPlayerTwo(player2Name){
    if(this.player2)
      throw new Error('game is already full');
    this.player2Name = player2Name;
    this.player2 = new Player(player2Name);
    this.playerIndexMap.set(player2Name, 1);
  }

  isFull(){
    return !!this.player2;
  }

  setStatus(status){ this.status = status; }

  setDeck1(deck){ this.deck1 = deck; }

  setDeck2(deck){ this.deck2 = deck; }
  
  setPlayerSocketId(playerName, socketId){
    if(playerName === this.player1Name) this.player1socketid = socketId;
    else if(playerName === this.player2Name) this.player2socketid = socketId;
  }

  startGame(){
    if(!this.player1 || !this.player2) throw new Error('both players must be present');
    if(!this.deck1 || !this.deck2) throw new Error('both decks must be set');
    this.game = new Gwent(this.player1, this.player2, this.deck1, this.deck2);
    this.status = 'gameInProgress';
  }

  getPlayerIndex(playerName){
    return this.playerIndexMap.get(playerName);
  }

  getGameState(playerIndex){
    if(!this.game) throw new Error('game has not started');
    const gameState = {
      playerIndex: playerIndex,
      playersTurn: this.game.playersTurn,
      round: this.game.round,
      board: this.game.board,
      player: this.game.players[playerIndex].player,
      opponent: this.game.players[(playerIndex + 1) % 2].player,
    };

    gameState.player.hand = this.game.players[playerIndex].hand;
    gameState.player.deckSize = this.game.players[playerIndex].deck.length;
    gameState.opponent.hand = { length: this.game.players[(playerIndex + 1) % 2].hand.length };
    gameState.opponent.deckSize = this.game.players[(playerIndex + 1) % 2].deck.length;
    gameState.tightBondsMaps = [Object.fromEntries(gameState.board.tightBondsMaps[0].entries()),
                                Object.fromEntries(gameState.board.tightBondsMaps[1].entries())];

    return gameState;
  }
}

class GwentGameManager {
  constructor(maxGames = 5){
    this.MAX_GAMES = maxGames;
    this.games = [];
    this.userGameMap = new Map();
  }

  createGame(hostName){
    if(this.userGameMap.has(hostName)) return { ok: false, code: 400, message: 'you already have a game in progress' };
    if(this.games.length >= this.MAX_GAMES) return { ok: false, code: 503, message: 'max games reached' };

    const inst = new GwentGameInstance(hostName);
    this.games.push(inst);
    this.userGameMap.set(hostName, inst);
    return { ok: true, game: inst };
  }

  joinGame(targetHost, playerName){
    if(this.userGameMap.has(playerName)) return { ok: false, code: 400, message: 'you already have a game in progress' };
    if(!this.userGameMap.has(targetHost)) return { ok: false, code: 400, message: 'game not found' };

    const game = this.userGameMap.get(targetHost);
    if(game.isFull()) return { ok: false, code: 400, message: 'game is full' };

    game.addPlayerTwo(playerName);
    game.setStatus('redirect to deckbuilder');
    this.userGameMap.set(playerName, game);
    return { ok: true, game };
  }

  getGameList(){
    const list = [];
    for(const g of this.games){
      if(g.player2) list.push([g.player1.playerName, g.player2.playerName]);
      else list.push([g.player1.playerName]);
    }
    return list;
  }

  checkUserHasGameInProgress(userName){
    return this.userGameMap.has(userName);
  }

  removeGame(game){
    if(!game) return;
    this.userGameMap.delete(game.player1.playerName);
    if(game.player2Name) this.userGameMap.delete(game.player2Name);
    const idx = this.games.indexOf(game);
    if(idx > -1) this.games.splice(idx, 1);
  }

  resetGames(authorizedUser){
    if(authorizedUser !== 'jimmynewsom') return { ok: false, code: 400, message: 'not authorized' };
    this.games = [];
    this.userGameMap = new Map();
    return { ok: true };
  }

  getGameForUser(userName){
    return this.userGameMap.get(userName);
  }
}

export { GwentGameInstance, GwentGameManager };

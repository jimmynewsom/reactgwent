import express from "express";
import validator from "validator";
import authenticateToken, { verifyWebsocketToken } from "../middleware/authenticateToken.mjs";
import { Player, Gwent, cardMap, validateDeck, defaultDeck } from "../gwent/gwent.mjs";
import { updateWinsAndLosses, checkGamesThisMonth, incrementGamesThisMonth } from "../server.mjs";


//wrapper class for Gwent Online Multiplayer
//basically I am going to feed one move in at a time, and then send the game state back to both players
//Also, right now the decks in MultiplayerGwent have additional fields besides just the cards
//but in my Gwent objects decks are just an array of card data... might fix later
class MultiplayerGwent{
  constructor(player1){
    this.player1 = new Player(player1);
    this.status = "waiting for player two";
    this.playerIndexMap = new Map();
    this.playerIndexMap.set(player1, 0);
  }

  addPlayerTwo(player2){
    this.player2 = new Player(player2);
    this.playerIndexMap.set(player2, 1);
  }

  setStatus(status){
    this.status = status;
  }

  setDeck1(deck){
    this.deck1 = deck;
  }

  setDeck2(deck){
    this.deck2 = deck;
  }

  startGame(){
    this.game = new Gwent(this.player1, this.player2, this.deck1, this.deck2);
  }

  getPlayerIndex(playerName){
    return this.playerIndexMap.get(playerName);
  }

  getGameState(playerIndex){
    let gameState = {
      playerIndex: playerIndex,
      playersTurn: this.game.playersTurn,
      round: this.game.round,
      board: this.game.board,
      player: this.game.players[playerIndex].player,
      opponent: this.game.players[(playerIndex + 1) % 2].player,
    }
    gameState.player.hand = this.game.players[playerIndex].hand;
    gameState.player.deckSize = this.game.players[playerIndex].deck.length;
    //little hack, because my PlayerPanel components expect a player.hand.length, but I don't want to reveal the opponent's cards
    gameState.opponent.hand = {length: this.game.players[(playerIndex + 1) % 2].hand.length}
    gameState.opponent.deckSize = this.game.players[(playerIndex + 1) % 2].deck.length;
    //maps are not serializable, which means they don't get sent via socket.io events,
    //so this adds a serializable version of the tightBondsMaps to the gamestate
    gameState.tightBondsMaps = [Object.fromEntries(gameState.board.tightBondsMaps[0].entries()),
                                Object.fromEntries(gameState.board.tightBondsMaps[1].entries())];

    return gameState;
  }
}


//this might be a little more complicated than it needs to be
//since I am running this on one server, I am only opening websockets for players actively playing games, which made some things a little messy
//it almost works though
//also, on the front end, my BrowserRouter refreshes the whole page everytime I change urls, breaking my websocket connections
//so I need a lot of logic to handle that and reconnect to the right rooms, etc
export default function GameRouter(io){
  const gameRouter = express.Router();
  var games = [];
  var userGameMap = new Map();
  //I am hard coding a max number of games, because CDPR gave me permission to make this, but only for demonstration purposes
  const MAX_GAMES = 5;

  function sanitizeInput(input){
    return validator.blacklist(input + "", "$.<>");
  }

  //when a user tries to create a game, check if there is already more games in progress than max games or if the user is already in a game
  //or if the user has already played 10 or more games this month
  //if so, return an error
  //otherwise, create a new game and add the user as user1
  //then call socket.connect() on the front end, which should add them to the right room now using the map
  gameRouter.get("/createGame", authenticateToken, async (req, res) => {
    let username = sanitizeInput(req.username);

    let gamesThisMonth = await checkGamesThisMonth(username);
    if(gamesThisMonth >= 10)
      return res.status(400).json({ error: "you have already played the maximum number of games this month for this demo"});

    if(games.length >= MAX_GAMES)
      return res.status(503).json({ error: 'server already has the maximum number of games currently in progress. Please try again later.' });

    if(userGameMap.has(username))
      return res.status(400).json({ error: "you already have a game in progress. Fuck off! :)"});

    let game = new MultiplayerGwent(username);
    games.push(game);
    userGameMap.set(username, game);
    return res.status(200).json({message: "game created"});
  });

  //when a user tries to join a game, check they are not already in a game and the target opponent exists
  //if nothings wrong, add them as user2, then call socket.connect() on the front end
  gameRouter.get("/joinGame/:targetOpponent", authenticateToken, async (req, res) => {
    let username = sanitizeInput(req.username);
    let targetOpponent = req.params.targetOpponent;

    let gamesThisMonth = await checkGamesThisMonth(username);
    if(gamesThisMonth >= 10)
      return res.status(400).json({ error: "you have already played the maximum number of games this month for this demo"});

    if(userGameMap.has(username))
      return res.status(400).json({ error: "you already have a game in progress. Fuck off! :)"});

    else if(!userGameMap.has(targetOpponent))
      return res.status(400).json({error: "game not found"});

    else if(userGameMap.get(targetOpponent).user2 != undefined)
      return res.status(400).json({error: "game is full"});

    else{
      let game = userGameMap.get(targetOpponent);
      game.addPlayerTwo(username);
      game.setStatus("redirect to deckbuilder");
      userGameMap.set(username, game);
      return res.status(200).json({message: "game joined"});
    }
  });


  gameRouter.get("/getGameList", authenticateToken, (req, res) => {
    let gamePlayersList = [];
    for(let game of games){
      if(game.player2)
        gamePlayersList.push([game.player1.playerName, game.player2.playerName]);
      else
        gamePlayersList.push([game.player1.playerName]);
    }
    res.json(gamePlayersList);
  });


  //temporary
  gameRouter.get("/resetGames", authenticateToken, (req, res) => {
    if(req.username == "jimmynewsom"){
      console.log("resetting games");
      games = [];
      userGameMap = new Map();
      return res.status(200).json({message: "games reset"});
    }
    else {
      return res.status(400).json({error: "you do not have authorization to reset games"});
    }
  });


  gameRouter.get("/checkUserHasGameInProgress", authenticateToken, (req, res) => {
    let username = sanitizeInput(req.username);
    if(userGameMap.has(username))
      return res.json({inProgress: true});
    else
      return res.json({inProgress: false});
  });


  //OK. One thing that sucks about this is, because I am using BrowserRouter, everytime the user changes pages it breaks my websocket connections
  //and I don't think I can fix that. I think that's just how it works.
  //So, every connection / re-connection, I am using some logic to send them (back) where they need to go
  //Also, I am using game.player1.playerName as the name of the room for every game
  //and when a client connects, I pull their username from their jwt token, and use that to add them to the right room
  io.use(verifyWebsocketToken);
  
  io.on('connection', (socket) => {
    const username = socket.username;
    console.log(username + " connected");

    if(!userGameMap.has(username))
      return;

    const game = userGameMap.get(username);
    const playerIndex = game.getPlayerIndex(username);
    socket.join(game.player1.playerName);
    console.log(username + " joined room " + game.player1.playerName);

    //store socket ids inside MultiplayerGwent object to send game updates later
    if(username == game.player1.playerName)
      game.player1socketid = socket.id;
    else
      game.player2socketid = socket.id;

    //this sends the first player to deckbuilder once the second player joins
    if(game.status == "redirect to deckbuilder"){
      io.to(game.player1.playerName).emit("redirect", "/deckbuilder/" + game.player1.playerName);
      game.setStatus("deckbuilder");
    }

    socket.on('disconnect', () => {
      console.log(username + ' disconnected');
      //todo - add logic for game teardown if users dc
    });

    //todo - add step for deck validation, but I want to get a working prototype first
    socket.on("ready_for_game", (deckObject) => {
      console.log("username ready: " + username);

      let deck = [];
      for(let cardName in deckObject.cards){
        let card = cardMap.get(cardName);
        for(let i = 0; i < deckObject.cards[cardName]; i++){
          deck.push(card);
        }
      }

      if(playerIndex == 0){
        game.setDeck1(deck);
        game.player1.setFaction(deckObject.faction);
        game.player1.setLeader(deckObject.leaderName);
      }
      else {
        game.setDeck2(deck);
        game.player2.setFaction(deckObject.faction);
        game.player2.setLeader(deckObject.leaderName);
      }

      if(game.deck1 != undefined && game.deck2 != undefined){
        console.log("both players ready, redirecting to game view");
        game.startGame();
        game.setStatus("gameInProgress");
        io.to(game.player1.playerName).emit("redirect", "/gwent");
      }
    });

    socket.on("request_game_update", () => {
      if(userGameMap.has(username) && userGameMap.get(username).status == "gameInProgress")
        io.to(socket.id).emit("game_update", game.getGameState(playerIndex));
    });

    socket.on("play_card", (cardIndex, target) => {
      //console.log(playerIndex + " " + cardIndex + " " + target);
      game.game.playCard(playerIndex, cardIndex, target);
      io.to(game.player1socketid).emit("game_update", game.getGameState(0));
      io.to(game.player2socketid).emit("game_update", game.getGameState(1));
    });

    //game.pass returns 0 for game still in progress, 1 for p1 wins, 2 for p2 wins, and 3 for ties
    socket.on("pass", () => {
      //console.log("player " + playerIndex + " passes");
      let result = game.game.pass(playerIndex);
      if(result == 0){
        io.to(game.player1socketid).emit("game_update", game.getGameState(0));
        io.to(game.player2socketid).emit("game_update", game.getGameState(1));
      }
      else{
        console.log("game over");

        if(result == 1){
          io.to(game.player1socketid).emit("game_over", "You Win!");
          io.to(game.player2socketid).emit("game_over", "You Lose!");
          updateWinsAndLosses(game.player1.playerName, true);
          updateWinsAndLosses(game.player2.playerName, false);
        }
        else if(result == 2){
          io.to(game.player1socketid).emit("game_over", "You Lose!");
        io.to(game.player2socketid).emit("game_over", "You Win!");
          updateWinsAndLosses(game.player1.playerName, false);
          updateWinsAndLosses(game.player2.playerName, true);
        }
        else
          io.to(game.player1.playerName).emit("game_over", "Tie Game!");

        incrementGamesThisMonth(game.player1.playerName);
        incrementGamesThisMonth(game.player2.playerName);

        userGameMap.delete(game.player1.playerName);
        userGameMap.delete(game.player2.playerName);
        games.splice(games.indexOf(game), 1);
      }
    });
  });

  return gameRouter;
}
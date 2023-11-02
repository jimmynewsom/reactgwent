import express from "express";
import validator from "validator";
import authenticateToken from "../middleware/authenticateToken.mjs";
import { Player, Gwent, validateDeck, defaultDeck } from "../gwent/gwent.mjs";


//wrapper class for Gwent Online Multiplayer
//basically I am going to feed one move in at a time, and then send the game state back to both players
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
    this.status = "deckbuilder";
  }

  setStatus(status){
    this.status = status;
  }

  startGame(){
    this.game = new Gwent(player1, player2, this.deck1, this.deck2);
  }


  getGameState(playerName){
    let playerIndex = this.playerIndexMap.get(playerName);
    let gameState = {
      playerIndex: playerIndex,
      boardState: this.game.board,
      playerState: this.game.players[playerIndex].player,
      handState: this.game.players[playerIndex].hand
    }
    return gameState;
  }

  playMove(playerIndex, cardIndex, target){
    console.log("nothing for now");
  }
}


//this might be a little more complicated than it needs to be
//since I am running this on one server, I am only opening websockets for players actively playing games, which made some things a little messy
//it almost works though
//also, on the front end, my BrowserRouter refreshes the whole page everytime I change urls, breaking my websocket connections
//so I need a lot of logic to handle that
export default function create_game_router(io){
  const game_router = express.Router();

  var games = [];
  var userGameMap = new Map();
  //I am hard coding a max number of games, because CDPR gave me permission to make this, but only for demonstration purposes
  const MAX_GAMES = 5;

  function sanitizeInput(input){
    return validator.blacklist(input + "", "$.<>");
  }

  //when a user tries to create a game, check if there is already more games in progress than max games or if the user is already in a game
  //if so, return an error
  //otherwise, create a new game and add the user as user1
  //then call socket.connect() on the front end, which should add them to the right room now using the map
  game_router.get("/createGame", authenticateToken, (req, res) => {
    let username = sanitizeInput(req.username);

    if(games.length >= MAX_GAMES){
      return res.status(503).json({ error: 'server already has the maximum number of games already in progress. Please try again later.' });
    }

    if(userGameMap.has(username))
      return res.status(400).json({ error: "you already have a game in progress. Fuck off! :)"});

    let game = new MultiplayerGwent(username);
    games.push(game);
    userGameMap.set(username, game);
    return res.status(200).json({message: "game created"});
  });

  //when a user tries to join a game, check they are not already in a game and the target opponent exists
  //if nothings wrong, add them as user2, then call socket.connect() on the front end
  game_router.get("/joinGame/:targetOpponent", authenticateToken, (req, res) => {
    let username = sanitizeInput(req.username);
    let targetOpponent = req.params.targetOpponent;

    if(userGameMap.has(username))
      return res.status(400).json({ error: "you already have a game in progress. Fuck off! :)"});

    if(!userGameMap.has(targetOpponent))
      return res.status(400).json({error: "game not found"});

    let game = userGameMap.get(req.params.targetOpponent);
    if(targetOpponent == game.player1.playerName && game.player2 == undefined){
      game.addPlayerTwo(username);
      game.setStatus("redirect to deckbuilder");
      userGameMap.set(username, game);
      return res.status(200).json({message: "game joined"});
    }
    else {
      return res.status(400).json({error: "game is full"});
    }
  });


  game_router.get("/getGameList", authenticateToken, (req, res) => {
    let gamePlayersList = [];
    for(let game of games){
      if(game.user2)
        gamePlayersList.push([game.player1.playerName, game.player2.playerName]);
      else
        gamePlayersList.push([game.player1.playerName]);
    }
    res.json(gamePlayersList);
  });


  //temporary
  game_router.get("/resetGames", (req, res) => {
    console.log("resetting games");
    games = [];
    userGameMap = new Map();
    return res.status(200).json({message: "games reset"});
  });


  game_router.get("/checkUserHasGameInProgress", authenticateToken, (req, res) => {
    let username = sanitizeInput(req.username);
    if(userGameMap.has(username))
      return res.json({inProgress: true});
    else
      return res.json({inProgress: false});
  });


  //OK. One thing that sucks about this is, because I am using BrowserRouter, everytime the user changes pages it breaks my websocket connections
  //and I don't think I can fix that. I think that's just how it works.
  //So, every connection / re-connection, I am using some logic to send them (back) where they need to go
  //Also, I am using player1.playerName as the name of the room for every game
  //when a client connects, I pull their username from auth, and use that to add them to the right room
  //I might need to use jwt for this later, but this works right now
  io.on('connection', (socket) => {
    let username = socket.handshake.auth.username;
    console.log(username + " connected");

    if(userGameMap.has(username)){
      let game = userGameMap.get(username);
      socket.join(game.player1.playerName);
      console.log(username + " joined room " + game.player1.playerName);
      
      console.log(game.status);
      if(game.status == "redirect to deckbuilder"){
        io.to(game.player1.playerName).emit("redirect", "/deckbuilder/" + game.player1.playerName);
        game.setStatus("deckbuilder");
      }
      else if(game.status == "redirect to game view"){
        io.to(game.player1.playerName).emit("redirect", "/gwent");
        game.setStatus("gameInProgress");
      }
    }

    socket.on('disconnect', () => {
      console.log(username + ' disconnected');
      //todo - add logic for counting user dcs. If someone dcs a lot, they quit
    });

    socket.on("test", (test_message) => {
      console.log(test_message);
    });

    //todo - add step for deck validation, but I want to get a working prototype first
    socket.on("ready_for_game", (deck) => {
      console.log("username ready: " + username);
      let game = userGameMap.get(username);
      let playerIndex = game.playerIndexMap.get(username);
      if(playerIndex == 0)
        game.deck1 = deck;
      else
        game.deck2 = deck;

      if(game.deck1 != undefined && game.deck2 != undefined){
        game.setStatus("redirect to game view");
        io.to(game.player1.playerName).emit("redirect", "/gwent");
      }
    });

    socket.on("submit_move", (cardIndex, target) => {
      console.log(cardIndex + " " + target);
    });
  });


  return game_router;
}
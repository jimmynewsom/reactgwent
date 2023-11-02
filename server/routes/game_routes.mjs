import express from "express";
import validator from "validator";
import authenticateToken from "../middleware/authenticateToken.mjs";
import { Game } from "../gwent/gwent.mjs";


export default function create_game_router(io){
  const game_router = express.Router();

  class MultiplayerGwent{
    constructor(user1){
      this.user1 = user1;
    }
  }

  var games = [];
  var userGameMap = new Map();
  const MAX_GAMES = 5;

  function sanitizeInput(input){
    return validator.blacklist(input + "", "$.<>");
  }

  //when a user tries to create a game, check if there is already more games in progress than max games or if the user is already in a game
  //if so, return an error
  //otherwise, create a new game and add the user as user1. Then create a websocket room for the game named game1, game2, game3, etc
  //on the front-end, switch to the Gwent component and connect to the websocket room
  game_router.get("/createGame", authenticateToken, (req, res) => {
    let username = sanitizeInput(req.username);

    if(games.length >= MAX_GAMES){
      return res.status(503).json({ error: 'server currently has the maximum number of games already in progress. Please try again later.' });
    }

    if(userGameMap.has(username))
      return res.status(400).json({ error: "you already have a game in progress. Fuck off! :)"});

    let game = new MultiplayerGwent(username);
    userGameMap.set(username, game);
    return res.status(200).json({message: "game created"});
  });


  game_router.get("/getGameList", authenticateToken, (req, res) => {
    let gamePlayersList = [];
    for(let game of games){
      if(game.user2)
        gamePlayersList.push([game.user1, game.user2]);
      else
        gamePlayersList.push([game.user1]);
    }
    res.json(gamePlayersList);
  });


  game_router.get("/joinGame/:targetOpponent", authenticateToken, (req, res) => {
    let username = sanitizeInput(req.username);

    if(userGameMap.has(username))
      return res.status(400).json({ error: "you already have a game in progress. Fuck off! :)"});

    let game = userGameMap.get(req.params.targetOpponent);
    if(req.params.targetOpponent == game.user1 && game.user2 == undefined){
      game.user2 = username;
      userGameMap.set(username, game);
      return res.status(200).json({message: "game joined"});
    }

    //if we get this far, we did not find targetOpponent in the list of games
    return res.status(400).json({error: "game not found"});
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
      return res.send(true);
    else
      return res.send(false);
  });


  io.on('connection', (socket) => {
    console.log('a user connected');
    let username = socket.handshake.auth.username;
    if(userGameMap.has(username)){
      socket.join(userGameMap.get(username).user1);
    }

    socket.on('disconnect', () => {
      console.log('a user disconnected');
    });

    socket.on("test", (test_message) => {
      console.log(test_message);
    });
  });


  return game_router;
}
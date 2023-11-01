import express from "express";
import validator from "validator";
import authenticateToken from "../middleware/authenticateToken.mjs";
import { Game } from "../gwent/gwent.mjs";

const game_router = express.Router();

class MultiplayerGwent{
  constructor(user1){
    this.user1 = user1;
  }
}


const games = [];
const MAX_GAMES = 5;

function sanitizeInput(input){
  return validator.blacklist(input + "", "$.<>");
}

//when a user tries to create a game, check if there is already more games in progress than max games or the user is already in a game
//if so, return an error
//otherwise, create a new game and add the user as user1. Then create a websocket room for the game named game1, game2, game3, etc
//on the front-end, switch to the Gwent component and connect to the websocket room
game_router.get("/createGame", authenticateToken, (req, res) => {
  let username = sanitizeInput(req.username);

  if(games.length >= MAX_GAMES){
    return res.status(503).json({ error: 'server currently has the maximum number of games already in progress. Please try again later' });
  }

  for(let game of games){
    if(username == game.user1 || username == game.user2)
      return res.status(400).json({ error: "you already have a game in progress. Fuck off! :)"});
  }

  games.push(new MultiplayerGwent(username));
  return res.status(200).json({message: "game created"});
});


game_router.get("/joinGame/:targetOpponent", authenticateToken, (req, res) => {
  let username = sanitizeInput(req.username);

  for(let game of games){
    if(username == game.user1 || username == game.user2)
      return res.status(400).json({ error: "you already have a game in progress. Fuck off! :)"});
  }

  for(let game of games){
    if(req.params.targetOpponent == game.user1 && game.user2 == undefined){
      game.user2 = username;
      return res.status(200).json({message: "game joined"});
    }
  }

  //if we get this far, we did not find targetOpponent in the list of games
  return res.status(400).json({error: "game not found"});
});






export {game_router};
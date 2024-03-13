import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import validator from "validator";
import cors from "cors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import db from "./db/conn.mjs";
import authenticateToken from './middleware/authenticateToken.mjs';
import {cardRows, leaderRows, validateDeck, defaultDeck} from './gwent/gwent.mjs';
import GameRouter from "./routes/game_routes.mjs";


const app = express();
const server = createServer(app);
const io = new Server(server, {
  connectionStateRecovery: {},
  cors: {origin: "*"}
});
const port = process.env.PORT || 5001;
app.use(cors());
app.use(express.json());


//I wanted to use middleware for this, but I keep finding common.js libraries that don't work, so I'm just doing this for now
function sanitizeInput(input){
  return validator.blacklist(input + "", "$.<>");
}


app.get("/", (req, res) => {
  return res.send("Hello World!");
});


// app.post("/test-sanitize", (req, res) => {
//   res.send(req.body);
// });


app.post("/register", async (req, res) => {
  try {
    let username = sanitizeInput(req.body.username);
    let password = sanitizeInput(req.body.password);

    if(!username || username == "undefined" || !password || password == "undefined")
      return res.status(400).json({ error: 'username and password must not be blank'});

    let collection = await db.collection("users");
    let user = await collection.findOne({"_id": username});

    //if the user exists already, return an error message
    if(user){
      return res.status(400).json({ error: 'username already exists, please enter a different username' });
    }

    //otherwise, register the new user and return a token
    let hash = await bcrypt.hash(password, 10);
    let newUser = {
      _id: username,
      passwordHash: hash,
      wins: 0,
      losses: 0,
      createdAt: new Date(),
      gamesThisMonth: 0
    };

    let result = await collection.insertOne(newUser);

    //this creates a jwt token asynchronously (await syntax didn't work for some reason)
    jwt.sign(username, process.env.JWT_SECRET, function(error, token) {
      res.status(201).json({
        message: "registration successful",
        token: token,
        username: username
      });
    });
    
  } catch (error) {
    console.log(error);
    return res.status(500).json({ "error": 'error creating new user, please try again' });
  }
});


app.post("/login", async (req, res) => {
  try {
    let username = sanitizeInput(req.body.username);
    let password = sanitizeInput(req.body.password);

    if(!username || username == "undefined" || !password || password == "undefined")
      return res.status(400).json({ error: 'username and password must not be blank'});

    let collection = await db.collection("users");
    let user = await collection.findOne({"_id": username});

    //if the user doesn't exist, return an error
    if(!user){
      return res.status(400).json({ error: 'invalid username and/or password, please try again' });
    }

    let result = await bcrypt.compare(password, user.passwordHash);
    
    //if the user exists and the password is wrong, return an error
    if(!result){
      return res.status(400).json({ error: 'invalid username and/or password, please try again' });
    }
    //if the user exists and the password is right, log them in and return a token
    else {
      //this creates a jwt token asynchronously (await syntax didn't work for some reason)
      jwt.sign(username, process.env.JWT_SECRET, function(error, token) {
        res.status(200).json({
          message: "login successful",
          token: token,
          username: username
        });
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({"error": "error logging in, please try again"});
  }
});


app.get("/getCardData", (req, res) => {
  return res.json(cardRows);
});


app.get("/getLeaderData", (req, res) => {
  return res.json(leaderRows);
});


app.get("/userStats", authenticateToken, async (req, res) => {
  try {
    let username = sanitizeInput(req.username);

    let collection = await db.collection("users");
    let user = await collection.findOne({"_id": username});
    return res.status(200).json({
      wins: user.wins,
      losses: user.losses
    });
  } catch (error) {
    console.log(error);
    return res.status(500);
  }
});


app.get("/getUserDecks", authenticateToken, async (req, res) => {
  try {
    let username = sanitizeInput(req.username);

    let collection = await db.collection("decks");
    let decks = await collection.find({"owner": username}).toArray();
    //console.log(decks);
    
    //the actual game in the witcher 3 only has a default deck for the Northern Realms faction
    //so if the user doesn't have a northern reams deck saved, I will load the default. the others start empty like in the actual game
    let userHasNRDeck = false;
    for(let deck of decks){
      if(deck.faction == "Northern Realms")
        userHasNRDeck = true;
    }

    if(!userHasNRDeck)
      decks.push(defaultDeck);

    //console.log(decks);

    return res.status(200).json(decks);
  } catch (error) {
    console.log(error);
    return res.status(500);
  }
});

//leaderName, and faction get validated in the validateDeck function, so I don't need to sanitize those inputs
//invalid values won't make it to the database

//card names get validated, and I build a map from the keys, but I might need to sanitize those inputs (todo)
//(what happens if someone passes invalid arguments to new Map(Object.entries(deck.cards))...? Is there any malicious input that will pass the checks?)
app.post("/saveUserDeck", authenticateToken, async (req, res) => {
  try {
    let deck = {};
    deck.faction = req.body.faction;
    deck.leaderName = req.body.leaderName;
    deck.cards = req.body.cards;
    deck.owner = sanitizeInput(req.username);
    
    let result = validateDeck(deck);
    if(!result.isValid){
      console.log("invalid deck");
      return res.status(400).json({error: "error - invalid deck"});
    } else {
      deck.heroCount = result.heroCount;
      deck.specialCount = result.specialCount;
      deck.unitCount = result.unitCount;
      deck.totalCardCount = result.totalCardCount;
      deck.totalUnitStrength = result.totalUnitStrength;

      let query = { owner: deck.owner, faction: deck.faction};
      let update = {$set: deck};
      let options = {upsert: true};

      let collection = await db.collection("decks");
      await collection.updateOne(query, update, options);
      return res.status(200).json({message: "deck saved to database"});
    } 
  } catch (error) {
    console.log(error);
    return res.status(500);
  }
});


export async function updateWinsAndLosses(username, userWon){
  try{
    let query = { _id: username};
    let update;
    if(userWon)
      update = { $inc: { wins: 1 } };
    else
      update = { $inc: { losses: 1 } };

    let collection = await db.collection("users");
    await collection.updateOne(query, update);
    console.log(username + " wins/losses updated.");
  }
  catch(error){
    console.log(error);
  }

  return;
}


export async function checkGamesThisMonth(username){
  try{
    let collection = await db.collection("users");
    let user = await collection.findOne({"_id": username});
    return user.gamesThisMonth;
  }
  catch(error){
    console.log(error);
  }

  return;
}


export async function incrementGamesThisMonth(username){
  try{
    let query = { _id: username};
    let update = { $inc: { gamesThisMonth: 1 } };

    let collection = await db.collection("users");
    await collection.updateOne(query, update);
    console.log(username + " gamesThisMonth updated.");
  }
  catch(error){
    console.log(error);
  }

  return;
}


app.get("/resetGamesThisMonth", authenticateToken, async (req, res) => {
  try {
    if(req.username == "jimmynewsom"){
      console.log("resetting gamesThisMonth counters for all users");

      let query = {};
      let update = { $set: {gamesThisMonth: 0 }};
      let collection = await db.collection("users");
      await collection.updateMany(query, update);
      console.log("gamesThisMonth counters reset for all users");

      return res.status(200).end();
    }
    else {
      return res.status(400).json({error: "you do not have authorization to reset games"});
    }
  }
  catch(error){
    console.log(error);
    return res.status(500).end();
  }
});


app.use("/gwent", GameRouter(io));


server.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
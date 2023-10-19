import express from "express";
import sanitize from "sanitize";
import cors from "cors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import db from "./db/conn.mjs";
import authenticateToken from './middleware/authenticateToken.mjs';
import {cardMap, cardRows, validateDeck} from './gwent/gwent.mjs';


const app = express();
const port = process.env.PORT || 5000;
app.use(sanitize.middleware);
app.use(cors());
app.use(express.json());


app.get("/", (req, res) => {
  res.send("Hello World!");
});


app.post("/register", async (req, res) => {
  try {
    let collection = await db.collection("users");
    let user = await collection.findOne({"_id": req.body.username});

    //if the user exists already, return an error message
    if(user){
      res.status(400).json({ error: 'username already exists, please enter a different username' });
    }

    //otherwise, register the new user and return a token
    let hash = await bcrypt.hash(req.body.password, 10);
    let newUser = {
      _id: req.body.username,
      passwordHash: hash,
      wins: 0,
      losses: 0,
      createdAt: new Date()
    };

    let result = await collection.insertOne(newUser);

    //this creates a jwt token asynchronously (await syntax didn't work for some reason)
    jwt.sign(req.body.username, process.env.JWT_SECRET, function(error, token) {
      res.status(201).json({
        message: "registration successful",
        token: token,
        username: req.body.username
      });
    });
    
  } catch (error) {
    console.log(error);
    return "error creating new user, please try again", 500
  }
});


app.post("/login", async (req, res) => {
  try {
    let collection = await db.collection("users");
    let user = await collection.findOne({"_id": req.body.username});

    //if the user doesn't exist, return an error
    if(!user){
      res.status(400).json({ error: 'invalid username and/or password, please try again' });
    }

    let result = await bcrypt.compare(req.body.password, user.passwordHash);
    
    //if the user exists and the password is wrong, return an error
    if(!result){
      res.status(400).json({ error: 'invalid username and/or password, please try again' });
    }
    //if the user exists and the password is right, log them in and return a token
    else {
      //this creates a jwt token asynchronously (await syntax didn't work for some reason)
      jwt.sign(req.body.username, process.env.JWT_SECRET, function(error, token) {
        res.status(200).json({
          message: "login successful",
          token: token,
          username: req.body.username
        });
      });
    }
  } catch (error) {
    console.log(error);
    return "error logging in, please try again", 500
  }
});


app.get("/getCardData", authenticateToken, async (req, res) => {
  res.json(cardRows);
});


app.get("/userStats", authenticateToken, async (req, res) => {
  try {
    let collection = await db.collection("users");
    let user = await collection.findOne({"_id": req.username});
    res.status(200).json({
      wins: user.wins,
      losses: user.losses
    });
  } catch (error) {
    console.log(error);
    return 500;
  }
});


app.get("/getUserDecks", authenticateToken, async (req, res) => {
  try {
    let factions = ["northern realms", "nilfgaard", "scoiatael", "monsters"];

    let collection = await db.collection("decks");
    let decks = await collection.find({"owner": req.username}).toArray();
    
    //the actual game in the witcher 3 only has a default deck for the Northern Realms faction
    //so if the user doesn't have a northern reams deck saved, I will load the default. the others start empty like in the actual game
    let userHasNRDeck = false;
    for(let deck of decks){
      if(deck.faction == "northern realms")
        userHasNRDeck = true;
    }

    if(!userHasNRDeck)
      decks.push(await collection.findOne({"owner": "default", "faction": "northern realms"}));

    res.status(200).json(decks);
  } catch (error) {
    console.log(error);
    return 500;
  }
});


// this is commented out because I haven't tested it yet
// I will uncomment and test it shortly
// app.post("saveUserDeck", authenticateToken, async (req, res) => {
//   try {
//     let deck = req.body.deck;
//     deck.owner = req.body.username;
//     if(!validateDeck(req.body.deck)){
//       return "invalid deck", 400
//     } else {
//       let query = { owner: deck.owner, faction: deck.faction};
//       let update = {$set: deck};
//       let options = {upsert: true};

//       let collection = await db.collection("decks");
//       collection.updateOne(query, update, options);
//       return "deck saved to database", 200;
//     } 
//   } catch (error) {
//     console.log(error);
//     return 500;
//   }
// });



app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
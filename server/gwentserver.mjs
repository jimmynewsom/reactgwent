import express from "express";
import sanitize from "sanitize";
import cors from "cors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import db from "./db/conn.mjs";
import authenticateToken from './middleware/authenticateToken.mjs';

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



app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
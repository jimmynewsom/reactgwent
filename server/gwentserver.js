const express = require("express");
const app = express();
const sanitize = require("sanitize");
const cors = require("cors");
const brcypt = require("bcrypt");
require("dotenv").config({ path: "./config.env" });

const port = process.env.PORT || 5000;

app.use(sanitize.middleware);
app.use(cors());
app.use(express.json());

// get driver connection
const dbo = require("./db/conn");


app.get("/", (req, res) => {
  res.send("Hello World!");
});


app.post("/register", async (req, res) => {
  try {
    let collection = await dbo.getDb("reactgwent").collection("users");
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

    //TODO - return a token instead
    res.send(result).status(201);
  } catch (error) {
    console.log(error);
    return "error creating new user, please try again", 500
  }
});


app.post("/login", async (req, res) => {
  try {
    let collection = await dbo.getDb("reactgwent").collection("users");
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
      //TODO - return a token instead
      res.send("success");
    }
  } catch (error) {
    console.log(error);
    return "error logging in, please try again", 500
  }
});



app.listen(port, () => {
  // perform a database connection when server starts
  dbo.connectToServer(function (err) {
    if (error){
      console.error(error);
    }
  });
  console.log(`Server is running on port: ${port}`);
});
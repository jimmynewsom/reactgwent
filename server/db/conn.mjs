import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import { defaultDeck } from "../gwent/gwent.mjs";

dotenv.config({ path: "./config.env" });
const DB_URL = process.env.DB_URL;
console.log(process.env.DB_URL);

const client = new MongoClient(DB_URL);
var conn = await client.connect();
var db = await conn.db("reactgwent");
await db.collection("decks").createIndex("owner");

let test = await db.collection("decks").findOne({"owner": "default"});
if(!test){
  db.collection("decks").insertOne(defaultDeck);
}

console.log("successfully connected to the database");

export default db;
import { MongoClient } from "mongodb";
const DB_URL = "mongodb://127.0.0.1:27017";
const client = new MongoClient(DB_URL);
 
var _db = await client.connect();

console.log("successfully connected to the database");

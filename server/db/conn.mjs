import { MongoClient } from "mongodb";
import dotenv from "dotenv";
dotenv.config({ path: "./config.env" });

const DB_URL = process.env.DB_URL;
console.log(process.env.DB_URL);
const client = new MongoClient(DB_URL);
 
var conn = await client.connect();
var db = await conn.db("reactgwent");

await db.collection("decks").createIndex("owner");

let test = await db.collection("decks").findOne({"owner": "default"});

if(!test){
  let defaultDeck = {
    "owner": "default",
    "faction": "Northern Realms",
    "cards": {
      "Biting Frost": 2,
      "Impenetrable Fog": 2,
      "Torrential Rain": 2,
      "Clear Weather": 2,
      "Dethmold": 1,
      "Trebuchet": 2,
      "Ballista": 2,
      "Ves": 1,
      "Keira Metz": 1,
      "Sile de Tansarville": 1,
      "Prince Stennis": 1,
      "Dun Banner Medic": 1,
      "Sabrina Glevissig": 1,
      "Sheldon Skaggs": 1,
      "Blue Stripes Commando": 2,
      "Poor Fucking Infantry": 2,
      "Redanian Foot Soldier": 1,
      "Kaedweni Siege Expert": 3,
      "Yarpen Zigrin": 1,
      "Siegfried of Denesle": 1
    },
    "totalCardCount": 30,
    "totalUnitStrength": 84,
    "heroCount": 0,
    "leaderName": "Foltest, King of Temeria",
    "specialCount": 8,
    "unitCount": 22
  }

  db.collection("decks").insertOne(defaultDeck);
}

console.log("successfully connected to the database");

export default db;
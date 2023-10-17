import fs from 'fs';
import { parse } from 'csv-parse';

class CardData {
  constructor(name, image_url, type, faction, strength, range, special, available, description){
    this.name = name;
    this.image_url = image_url;
    this.type = type;
    this.faction = faction;
    this.strength = strength;
    this.range = range;
    this.special = special;
    this.available = available;
    this.description = description;
  }
}

let cardRows;
const cardMap = new Map();

//const start = Date.now();

fs.readFile("./gwent/unit_cards.csv", function (err, fileData) {
  parse(fileData, {columns: false, trim: true}, function(err, rows) {
    cardRows = rows;

    cardRows.forEach((row, i) => {
      //the first row is just the names of the columns
      if(i!=1){
        //each row is [0] card name, [1] image url, [2] type, [3] faction, [4], available, [5] strength, [6] range, [7] special, [8] avaialble, and [9] description
        let card = new CardData(row[0], row[1], row[2], row[3], row[4], row[5], row[6], row[7], row[8], row[9]);
        cardMap.set(row[0], card);
      }
    });
  });
});

//const end = Date.now();
//console.log(`Execution time: ${end - start} ms`);

export {cardMap, cardRows};

export function validateDeck(deck){
  let heroCount = 0, specialCount = 0, unitCount = 0;
  
  //TODO - validate leader exists and is the correct faction

  for(let [cardName, numberInDeck] of deck.cards){
    let card = cardMap.get(cardName);

    if(numberInDeck > card.available)
      return false;

    if(card.faction != deck.faction || card.faction != "neutral")
      return false;

    if(card.type == "hero"){
      heroCount++;
      unitCount++;
    }

    if(card.type == "special")
      specialCount++;

    if(card.type == "unit")
      unitCount++;
  }

  if(specialCount > 10)
    return false;

  if(unitCount < 22)
    return false;

  return true;
}
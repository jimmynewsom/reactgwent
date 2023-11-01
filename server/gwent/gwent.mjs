import fs from 'fs';
import { parse } from 'csv-parse';


//CARD AND DECK LOGIC!!!!


export class CardData {
  constructor(name, image_url, type, faction, strength, range, special, available, description){
    this.name = name;
    this.image_url = image_url;
    this.type = type;
    this.faction = faction;
    this.strength = Number(strength);
    this.range = range;
    this.special = special;
    this.available = Number(available);
    this.description = description;
  }
}

export class LeaderCard {
  constructor(name, title, image_url, faction, desc){
    this.name = name;
    this.title = title;
    this.image_url = image_url;
    this.faction = faction;
    this.desc = desc;
  }
}

let cardRows;
const cardMap = new Map();

//these should maybe be synchronous instead of async, since I need them to initialize at start up. but it's not that important
fs.readFile("./gwent/unit_cards.csv", function (err, fileData) {
  parse(fileData, {columns: false, trim: true}, function(err, rows) {
    cardRows = rows;

    cardRows.forEach((row, i) => {
      //the first row is just the names of the columns
      if(i!==0){
        //each row is [0] card name, [1] image url, [2] type, [3] faction, [4], available, [5] strength, [6] range, [7] special, [8] avaialble, and [9] description
        let card = new CardData(row[0], row[1], row[2], row[3], row[4], row[5], row[6], row[7], row[8], row[9]);
        cardMap.set(row[0], card);
      }
    });
  });
});

let leaderRows;
const leaderMap = new Map();

fs.readFile("./gwent/leader_cards.csv", function (err, fileData) {
  parse(fileData, {columns: false, trim: true}, function(err, rows) {
    leaderRows = rows;

    leaderRows.forEach((row, i) => {
      //the first row is just the names of the columns
      if(i!==0){
        //each row is [0] leader name, [1] leader title, [2] image url, [3] faction, and [4] description
        let card = new CardData(row[0], row[1], row[2], row[3], row[4]);
        //using titles instead of leader names here, because leader names are not unique
        leaderMap.set(row[1], card);
      }
    });
  });
});


export {cardMap, cardRows, leaderRows, leaderMap};


//deck should have faction, leaderName, cards, and owner fields, from /saveUserDeck route in server.mjs
//TODO - validate leader exists and is the correct faction
export function validateDeck(deck){
  let isValid = true, heroCount = 0, specialCount = 0, unitCount = 0, totalCardCount = 0, totalUnitStrength = 0;
  
  //TODO - validate leader exists and is the correct faction

  let deckMap = new Map(Object.entries(deck.cards));
  for(let [cardName, numberInDeck] of deckMap){
    //if the user submits a deck with a card name I don't recognize they're not using my app
    if(!cardMap.has(cardName)){
      return {isValid: false};
    }

    let card = cardMap.get(cardName);
    totalCardCount += numberInDeck;

    if(numberInDeck > card.available)
      isValid = false;

    if(card.faction != deck.faction && card.faction != "neutral")
      isValid = false;

    if(card.type == "hero"){
      heroCount++;
      unitCount++;
      totalUnitStrength += card.strength;
    }

    if(card.type == "special")
      specialCount = specialCount + numberInDeck;

    if(card.type == "unit"){
      unitCount += numberInDeck;
      totalUnitStrength += (numberInDeck * card.strength);
    }
  }

  if(specialCount > 10)
    isValid = false;

  if(unitCount < 22)
    isValid = false;

  let result = {isValid, unitCount, heroCount, specialCount, totalCardCount, totalUnitStrength};
  return result;
}


//GAME LOGIC!!!!
//a lot of this might need to get optimized, and if it's really slow this might block my event loop
//but I'm just going to write a sloppy v1 first and then optimize later if necessary
//also, I only have to do this at the end of rounds. Normal turns I can getCardStrength and getRowStrength client-side

class Player{
  lives = 2;
  passed = false;

  constructor(playerName){
    this.playerName = playerName;
  }
}

class Board{
  field = [{close: [], ranged: [], siege: [], graveyard: []},
           {close: [], ranged: [], siege: [], graveyard: []}];
  
  weather = {close: false, ranged: false, siege: false};

  rallyHorns = [{close: false, ranged: false, siege: false},
               {close: false, ranged: false, siege: false}];

  clearWeather(){
    this.weather = {close: false, ranged: false, siege: false};
  }

  clearRallyHorns(){
    this.rallyHorns = [{close: false, ranged: false, siege: false},
                      {close: false, ranged: false, siege: false}];
  }

  getCardStrength(playerIndex, row, cardIndex){
    let card = this.field[playerIndex][row][cardIndex];
    if(card.type == "hero")
      return card.strength;

    let tightBond = 1, morale = 0;

    for(let [card2, i] of this.field[playerIndex][row]){
      if(i == cardIndex)
        continue;
      else if(card2.special == "morale")
        morale++;
      else if(card2.special == "tight bond" && card2.name == card.name)
        tightBond++;
    }

    let currentStrength = card.strength;
    if(weather[row] == true)
      currentStrength = 1;

    currentStrength = (currentStrength + morale)**tightBond;
    
    if(this.rallyHorns[playerIndex][row])
      currentStrength = currentStrength * 2;

    return currentStrength;
  }

  getRowStrength(playerIndex, row){
    let totalStrength = 0;
    for(let i=0; i<field[playerIndex][row].length; i++){
      totalStrength = totalStrength + this.getCardStrength(playerIndex, row, i);
    }
    return totalStrength;
  }

  endRoundAndCalculateWinner(faction1, faction2){
    let p1Total = this.getRowStrength(0, "close") + this.getRowStrength(0, "ranged") + this.getRowStrength(0, "siege");
    let p2Total = this.getRowStrength(1, "close") + this.getRowStrength(1, "ranged") + this.getRowStrength(1, "siege");

    for(let i=0; i<2; i++){
      this.rows[i].graveyard.push(...rows[i].close);
      this.rows[i].graveyard.push(...rows[i].ranged);
      this.rows[i].graveyard.push(...rows[i].siege);
      this.rows[i].close = [];
      this.rows[i].ranged = [];
      this.rows[i].siege = [];
    }

    this.clearWeather();
    this.clearRallyHorns();
      
    if(p1Total > p2Total)
      return 1;
    else if(p1Total < p2Total)
      return -1;
    else{
      //nilfgaard wins ties if only 1 faction is nilfgaard
      if(faction1 == "Nilfgaard" && faction2 != "Nilfgaard")
        return 1;
      else if(faction2 == "Nilfgaard" && faction1 != "Nilfgaard")
        return -1;
      else
        return 0;
    }
  }

  scorch(playerIndex, range){
    if(range){
      console.log("scorch - range");
    }
    else {
      console.log("scorch everywhere");
    }
  }

}

function shuffle(array){ 
  return array.sort(() => Math.random() - 0.5); 
}; 

/*
Here is where the game logic will go.
On the server I will track everything. player names & stuff, cards on the board & graveyards, cards in the decks, & cards in the hands.
I will also validate all attempted moves on the server.

Then, the server needs to send both clients all of the data they need every turn
(technically it could just send update data, but I'm worried that's trusting the clients too much)

Clients need to know what's on the board and what's in their hand every turn, and whose turn it is.
And then clients will tell the server their move every turn, which can be 1 of 3 things:
  1: client plays a card (so I need to know the card name and sometimes a target)
  2: client plays their leader ability (to be implemented later)
  3: client passes

I think that's all I need to make this work
*/
export class Game{
  constructor(playerName1, playerName2, deck1, deck2){
    deck1 = shuffle(deck1);
    deck2 = shuffle(deck2);

    this.players = [{player: Player(playerName1), deck: deck1, hand: []}, {player: Player(playerName2), deck: deck2, hand: []}];
    this.board = new Board();
    this.players[0].hand = draw(0, 10);
    this.players[1].hand = draw(1, 10);
  }

  //modifies deck in players array in addition to returning cards to hand
  //also, if you try to draw more cards than are left in the deck it only returns the remaining cards and doesn't throw an exception
  draw(playerIndex, numCards){
    return this.players[playerIndex].deck.splice(0, numCards);
  }

  /*
  One more big function...
  play cards, following all gwent rules
  */
  playCard(playerIndex, cardIndex, target){
    let card = this.players[playerIndex].hand[cardIndex];
    this.players[playerIndex].hand.splice(cardIndex, 1);
    
    if((card.type == "unit" || card.type == "hero") && card.special != "spy"){
      if(card.range == "close")
        this.board.field[playerIndex].close.push(card);
      else if(card.range == "ranged")
        this.board.field[playerIndex].ranged.push(card);
      else if(card.range == "siege")
        this.board.field[playerIndex].siege.push(card);
      else if(card.range == "agile"){
        if(target == "close")
          this.board.field[playerIndex].close.push(card);
        else if(target == "ranged")
          this.board.field[playerIndex].ranged.push(card);
      }

      //unit cards can have 4 abilities that trigger when placed - medic, spy, scorchClose, & muster
      //(morale & tight bond don't trigger until I calculate the card strength)
      if(card.special == "scorchClose")
        this.board.scorch(playerIndex, "close");
      //if the player plays a medic card, target should specify indexes in graveyard
      //since medics can revive medics, target is an array here
      else if(card.special == "medic"){
        console.log("medic played");
        // for(let i = 0; i < target.length; i++){
        //   let card2 = this.board.field[playerIndex].graveyard[target[i]];
        //   this.board.field[playerIndex].graveyard.splice(target[i], 1);
        //   this.playCardFromGraveyard(playerIndex, card2);
        //   if(card2.special != "medic")
        //     break;
        // }
      }
      else if(card.special == "spy"){
        this.draw(playerIndex, 2);

        if(card.range == "close")
          this.board.field[(playerIndex + 1) % 2].close.push(card);
        else if(card.range == "ranged")
          this.board.field[(playerIndex + 1) % 2].ranged.push(card);
        else if(card.range == "siege")
          this.board.field[(playerIndex + 1) % 2].siege.push(card);
      }
      else if(card.special == "muster"){
        console.log("muster played");
        // let musterList = musterMap.get(card.name);
        // let i = 0;
        // while(i < this.players[playerIndex].hand.length){
        //   let card2;
        //   if(musterMap.includes(this.players[playerIndex].hand[i].name)){
        //     card2 = this.players[playerIndex].hand[i];
        //     this.players[playerIndex].hand.splice(i, 1);
        //     this.playCardSpecial(playerIndex, card2);
        //   }
        //   else {
        //     i++;
        //   }
        // }
      }

    }
    //7 special cards - 4 weather cards, scorch, commander's horn, & decoy
    else if(card.type == "special"){
      if(card.name == "Biting Frost")
        this.board.weather.close = true;
      else if(card.name == "Impenetrable Fog")
        this.board.weather.ranged = true;
      else if(card.name == "Torrential Rain")
        this.board.weather.siege = true;
      else if(card.name == "Clear Weather")
        this.board.clearWeather();
      else if(card.name == "Scorch")
        this.board.scorch();
      //if the player plays a commanders horn, target should specify the row
      else if(card.name == "Commanders Horn")
        this.board.rallyHorns[playerIndex][target] = true;
      //if the player plays a decoy, target should specify row & index, eg. {row: "close", index: 3}
      else if(card.name == "Decoy"){
        let card2 = this.board.field[playerIndex][target.row][target.index];
        this.board.field[playerIndex][target.row][target.index] = card;
        this.players[playerIndex].hand.push(card2);
      }

      //finally, every card except decoys get put in the graveyard
      //except maybe weather cards and commanders horns shouldnt, but since you cant recover them from the graveyard its basically the same thing
      if(card.name != "Decoy")
        this.board[playerIndex].graveyard.push(card);
    }
  }

  playCardSpecial(playerIndex, card){

  }
}
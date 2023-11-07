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

const defaultDeck = {
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

export {cardMap, cardRows, leaderRows, leaderMap, defaultDeck};


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

export class Player{
  lives = 2;
  passed = false;

  constructor(playerName){
    this.playerName = playerName;
  }

  setFaction(faction){
    this.faction = faction;
  }

  setLeader(leaderName){
    this.leaderName = leaderName;
  }
}

class Board{
  field = [{close: [], ranged: [], siege: [], graveyard: []},
           {close: [], ranged: [], siege: [], graveyard: []}];
  
  weather = {close: false, ranged: false, siege: false};

  rallyHorns = [{close: false, ranged: false, siege: false},
               {close: false, ranged: false, siege: false}];

  morale = [{close: 0, ranged: 0, siege: 0},
            {close: 0, ranged: 0, siege: 0}];
    
  tightBondsMaps = [new Map(), new Map()];

  clearWeather(){
    this.weather = {close: false, ranged: false, siege: false};
  }

  clearRallyHorns(){
    this.rallyHorns = [{close: false, ranged: false, siege: false},
                      {close: false, ranged: false, siege: false}];
  }

  calculateMoraleAndTightBonds(){
    this.morale = [{close: 0, ranged: 0, siege: 0},
                  {close: 0, ranged: 0, siege: 0}];
    this.tightBondsMaps = [new Map(), new Map()];

    const ranges = ["close", "ranged", "siege"];
    for(let i = 0; i < 2; i++){
      for(let range of ranges){
        for(let card of this.field[i][range]){
          if(card.special == "morale")
            this.morale[i][range]++;

          else if(card.special == "tight bond"){
            if(this.tightBondsMaps[i].has(card.name))
              this.tightBondsMaps[i].set(card.name, this.tightBondsMaps[i].get(card.name) + 1);
            else
              this.tightBondsMaps[i].set(card.name, 1);
          }
        }
      }
    }
  }

  //this needs to be called after I calculate morale and tight bonds for the rows now
  //that way I only need to iterate over each row twice, instead once per card
  getCardStrength(playerIndex, range, cardIndex){
    let card = this.field[playerIndex][range][cardIndex];
    if(card.type == "hero")
      return card.strength;

    let morale = this.morale[playerIndex][range];
    let tightBond = this.tightBondsMaps[playerIndex].has(card.name) ? this.tightBondsMaps[playerIndex].get(card.name) : 1;

    //morale effects every creature in the row except itself
    if(card.special == "morale")
      morale--;

    let currentStrength = card.strength;
    if(this.weather[range] == true)
      currentStrength = 1;

    currentStrength = (currentStrength + morale)**tightBond;
    
    if(this.rallyHorns[playerIndex][range])
      currentStrength = currentStrength * 2;

    return currentStrength;
  }

  //same conditions as above (must be called after calculateMoraleAndTightBonds())
  getRowStrength(playerIndex, range){
    let totalStrength = 0;
    for(let i = 0; i < this.field[playerIndex][range].length; i++){
      totalStrength = totalStrength + this.getCardStrength(playerIndex, range, i);
    }
    return totalStrength;
  }

  //same conditions as above
  getTotalStrength(playerIndex){
    let total = this.getRowStrength(playerIndex, "close") + this.getRowStrength(playerIndex, "ranged") + this.getRowStrength(playerIndex, "siege");
    return total;
  }

  //returns 1 for player1 wins, 2 for player2 wins, and 3 for ties
  endRoundAndCalculateWinner(faction1, faction2){
    this.calculateMoraleAndTightBonds();
    let p1Total = this.getTotalStrength(0);
    let p2Total = this.getTotalStrength(1);
    let card;

    for(let i = 0; i < 2; i++){
      //Monster faction keeps 1 unit card on their side of the field at the end of every round
      if((i == 0 && faction1 == "Monsters") || (i == 1 && faction2 == "Monsters")){
        let totalCardCount = this.field[i]["close"].length + this.field[i]["ranged"].length + this.field[i]["siege"].length;
        let randomIndex = Math.floor(Math.random() * totalCardCount);

        if(totalCardCount > 0){
          if(randomIndex < this.field[i]["close"].length)
            card = this.field[i]["close"].splice(randomIndex, 1)[0];
          else if(randomIndex < this.field[i]["close"].length + this.field[i]["ranged"].length){
            randomIndex -= this.field[i]["close"].length;
            card = this.field[i]["ranged"].splice(randomIndex, 1)[0];
          }
          else {
            randomIndex -= this.field[i]["close"].length + this.field[i]["ranged"].length;
            card = this.field[i]["siege"].splice(randomIndex, 1)[0];
          }
        }
      }

      this.field[i].graveyard.push(...this.field[i].close);
      this.field[i].graveyard.push(...this.field[i].ranged);
      this.field[i].graveyard.push(...this.field[i].siege);
      this.field[i].close = [];
      this.field[i].ranged = [];
      this.field[i].siege = [];

      if(((i == 0 && faction1 == "Monsters") || (i == 1 && faction2 == "Monsters")) && card){
        this.field[i][card.range].push(card);
        card = null;
      }

    }

    this.clearWeather();
    this.clearRallyHorns();
      
    if(p1Total > p2Total)
      return 1;
    else if(p1Total < p2Total)
      return 2;
    else{
      //nilfgaard wins ties if only 1 faction is nilfgaard
      if(faction1 == "Nilfgaard" && faction2 != "Nilfgaard")
        return 1;
      else if(faction2 == "Nilfgaard" && faction1 != "Nilfgaard")
        return 2;
      else
        return 3;
    }
  }

  //this could be optimized.......
  scorch(playerIndex, range){
    this.calculateMoraleAndTightBonds();
    //for targeted scorch, if the opponent has a total strength of 10 or higher in the target row, kill that rows strongest card(s)
    //(iterating backwards through the row, so splices don't screw up later indexes in the loop)
    if(range){
      let totalStrength = 0, maxStrength = 0;
      for(let i = this.field[(playerIndex + 1) % 2][range].length - 1; i--; i > -1){
        let strength = this.getCardStrength((playerIndex + 1) % 2, range, i);
        totalStrength += strength;
        if(strength > maxStrength)
          maxStrength = strength;
      }
      if(totalStrength >= 10){
        for(let i = this.field[(playerIndex + 1) % 2][range].length - 1; i--; i > -1){
          let strength = this.getCardStrength((playerIndex + 1) % 2, range, i);
          if(strength == maxStrength)
            this.field[(playerIndex + 1) % 2][range].splice(i, 1);
        }
      }
    }
    //otherwise, kill the strongest card(s) in every row
    else {
      let maxStrength = 0;
      let ranges = ["close", "ranged", "siege"];
      for(let i = 0; i < 2; i++){
        for(let range of ranges){
          for(let j = this.field[i][range].length - 1; j--; j > -1){
            let strength = this.getCardStrength(i, range, j);
            if(strength > maxStrength)
              maxStrength = strength;
          }
        }
      }
      for(let i = 0; i < 2; i++){
        for(let range of ranges){
          for(let j = this.field[i][range].length - 1; j--; j > -1){
            let strength = this.getCardStrength(i, range, j);
            if(strength == maxStrength)
              this.field[i][range].splice(j, 1);
          }
        }
      }
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
export class Gwent{
  constructor(player1, player2, deck1, deck2){
    this.round = 1;
    this.deck1 = shuffle(deck1);
    this.deck2 = shuffle(deck2);

    this.players = [{player: player1, deck: deck1, hand: []}, {player: player2, deck: deck2, hand: []}];
    this.board = new Board();
    this.players[0].hand = this.draw(0, 10);
    this.players[1].hand = this.draw(1, 10);
    if(this.flipCoin())
      this.playersTurn = 0;
    else
      this.playersTurn = 1;
  }

  //modifies deck in players array in addition to returning cards to hand
  //also, if you try to draw more cards than are left in the deck it only returns the remaining cards and doesn't throw an exception
  draw(playerIndex, numCards){
    return this.players[playerIndex].deck.splice(0, numCards);
  }

  flipCoin(){
    return Math.random() - 0.5 > 0;
  }

  /*
  One more big function...
  play cards, following all gwent rules
  */
  playCard(playerIndex, cardIndex, target){
    //first check if it is the player's turn
    if(playerIndex != this.playersTurn)
      return;

    let card = this.players[playerIndex].hand[cardIndex];
    this.players[playerIndex].hand.splice(cardIndex, 1);
    
    //unit cards and hero cards that aren't spies get added to their respective range
    //if the unit range is agile, target should specify the range
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
    else if(card.special == "spy"){
      this.players[playerIndex].hand.push(...this.draw(playerIndex, 2));

      if(card.range == "close")
        this.board.field[(playerIndex + 1) % 2].close.push(card);
      else if(card.range == "ranged")
        this.board.field[(playerIndex + 1) % 2].ranged.push(card);
      else if(card.range == "siege")
        this.board.field[(playerIndex + 1) % 2].siege.push(card);
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
      //if the player plays a commanders horn, target should specify the range
      else if(card.name == "Commanders Horn")
        this.board.rallyHorns[playerIndex][target] = true;
      //if the player plays a decoy, target should specify range & index, eg. {range: "close", index: 3}
      else if(card.name == "Decoy"){
        let card2 = this.board.field[playerIndex][target.range][target.index];
        this.board.field[playerIndex][target.range][target.index] = card;
        this.players[playerIndex].hand.push(card2);
      }

      //finally, every special card except decoys gets put in the graveyard
      //except maybe weather cards and commanders horns shouldnt, but since you cant recover them from the graveyard its basically the same thing
      if(card.name != "Decoy")
        this.board.field[playerIndex].graveyard.push(card);
    }

    //if the other player has not passed it's their turn. Otherwise it stays the current player's turn
    if(!this.players[(playerIndex + 1) % 2].player.passed)
      this.playersTurn = (this.playersTurn + 1) % 2;
  }

  playCardSpecial(playerIndex, card){
    console.log("nothing for now");
  }

  playLeaderAbility(playerIndex){
    console.log("nothing for now");
  }

  //this handles passing and calculates winners for rounds and the game
  //when the game is over, return 1 for player1 wins, 2 for player2 wins, and 3 for ties
  //otherwise return 0 for game still in progress;
  pass(playerIndex){
    if(this.playersTurn != playerIndex)
      return;

    this.players[playerIndex].player.passed = true;

    let result;
    //once both players pass, endRoundAndCalculateWinner
    if(this.players[(playerIndex + 1) % 2].player.passed){
      result = this.board.endRoundAndCalculateWinner(this.players[0].player.faction, this.players[1].player.faction);
      if(result == 1){
        this.players[1].player.lives--;
        if(this.players[1].player.lives == 0)
          return 1;
        else if(this.players[0].player.faction == "Northern Realms")
          this.players[0].hand.push(...this.draw(0, 1));
      }
      else if(result == 2){
        this.players[0].player.lives--;
        if(this.players[0].player.lives == 0)
          return 2;
        else if(this.players[1].player.faction == "Northern Realms")
          this.players[1].hand.push(...this.draw(1, 1));
      }

      //if we finish round 3, there are 3 possibilities
      //either 1) 1 player won 1 round and 2 rounds were ties, in which case 1 player wins
      //or 2) every round was a tie, or 3) each player won 1 round and there was 1 tie, and in those cases it's a tie game
      else if(this.round == 3){
        if(this.players[0].player.lives > this.players[1].player.lives)
          return 1;
        else if(this.players[0].player.lives < this.players[1].player.lives)
          return 2;
        else
          return 3;
      }

      this.round++;
      this.players[0].player.passed = false;
      this.players[1].player.passed = false;
    }
    else{
      this.playersTurn = (this.playersTurn + 1) % 2;
    }

    return 0;
  }
}
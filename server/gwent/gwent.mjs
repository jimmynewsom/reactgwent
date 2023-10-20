import fs from 'fs';
import { parse } from 'csv-parse';


//CARD AND DECK LOGIC!!!!


class CardData {
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

let cardRows;
const cardMap = new Map();

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

export {cardMap, cardRows};

export function validateDeck(deck){
  let isValid = true, heroCount = 0, specialCount = 0, unitCount = 0, totalCardCount = 0, totalUnitStrength = 0;
  
  //TODO - validate leader exists and is the correct faction

  let deckMap = new Map(Object.entries(deck.cards));
  for(let [cardName, numberInDeck] of deckMap){
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


class Player{
  lives = 2;
  passed = false;
  hand = [];

  constructor(playerName){
    this.playerName = playerName;
  }
}

class Board{
  field = [{close: [], ranged: [], siege: [], graveyard: []},
          {close: [], ranged: [], siege: [], graveyard: []}];
  
  weather = {close: false, ranged: false, siege: false};

  rallyHorn = [{close: false, ranged: false, siege: false},
             {close: false, ranged: false, siege: false}];

  clearWeather(){
    this.weather = {close: false, ranged: false, siege: false};
  }

  clearRallyHorns(){
    this.rallyHorn = [{close: false, ranged: false, siege: false},
                      {close: false, ranged: false, siege: false}];
  }

  getCardStrength(playerIndex, row, cardIndex){
    let card = this.field[playerIndex][row][cardIndex];
    if(card.type == "hero")
      return card.strength;

    let tightBond = 1, morale = 0;

    for(let [c, i] of this.field[playerIndex][row]){
      if(i == cardIndex)
        continue;
      else if(c.special == "morale")
        morale++;
      else if(c.special == "tight bond" && c.name == card.name)
        tightBond++;
    }

    let currentStrength = card.strength;
    if(weather[row] == true)
      currentStrength = 1;

    currentStrength = (currentStrength + morale)**tightBond;
    
    if(this.rallyHorn[playerIndex][row])
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

  // scorch(playerIndex, range){
  //   if(range){

  //   }
  //   else {

  //   }
  // }

}

function shuffle(array){ 
  return array.sort(() => Math.random() - 0.5); 
}; 

/*
Here is where the game logic will go.
On the server I will track everything. player names & stuff, cards on the board, cards in the decks, & cards in the hands.
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
class Game{
  constructor(playerName1, playerName2, deck1, deck2){
    deck1 = shuffle(deck1);
    deck2 = shuffle(deck2);

    this.players = [{player: Player(playerName1), deck: deck1}, {player: Player(playerName2), deck: deck2}];
    this.board = new Board();
    this.players[0].hand = draw(0, 10);
    this.players[1].hand = draw(1, 10);
  }

  //modifies deck in players array in addition to returning cards to hand
  //also, if you try to draw more cards than are left in the deck it only returns the remaining cards and doesn't throw an exception
  draw(playerIndex, numCards){
    return this.players[playerIndex].deck.splice(0, numCards);
  }

  validateMove(playerIndex, cardName){
    isValid = false;
    for(let card in this.players[playerIndex].player.hand){
      if(card.name == cardName)
        isValid = true;
    }
    return isValid;
  }

  /*
  One more big function...
  play cards, following all gwent rules
  */
  playCard(playerIndex, cardName, target){
    for(let [card, i] of this.players[playerIndex].player.hand){
      if(card.name == cardName){
        this.players[playerIndex].hand.splice(i, 1);

        if(card.special == "none"){
          if(card.range == "close")
            this.board[playerIndex].close.push(card);
          else if(card.range == "ranged")
            this.board[playerIndex].ranged.push(card);
          else if(card.range == "siege")
            this.board[playerIndex].siege.push(card);
          else if(card.range == "agile"){
            if(target = "close")
              this.board[playerIndex].close.push(card);
            else if(target == "ranged")
              this.board[playerIndex].ranged.push(card);
          }
        }
        else if(card.special == "scorch - close"){
          this.board.scorch();
        }

        if(card.type == "unit" || card.type == "hero"){
          if(card.special == "spy"){
            this.players[playerIndex].player.hand.push(...draw(playerIndex, 2));
            
          }
          if(card.range == "close")
            this.board.rows[playerIndex].close.cards.push(card);
          else if(card.range == "ranged")
            this.board.rows[playerIndex].ranged.cards.push(card);
          else if(card.range == "siege")
            this.board.rows[playerIndex]
        }
      }
    }
  }

  pass(playerIndex){
    players[playerIndex].player.passed = true;
  }

}
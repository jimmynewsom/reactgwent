import './GwentClient.scss';
import React, { useState, useEffect } from 'react';
import { useAuthHeader } from 'react-auth-kit';

import {LargeCardView, CardData, SmallCardView} from '../Card/Card';


function PlayerStatsPanel({player, totalStrength}){
  console.log("rendering player stats panel");

  return(
    <div className="player_stats_panel">
      <p>{player.playerName}</p>
      <p>{player.faction}</p>
      <p>cards in hand: {player.hand.length}</p>
      <p>lives: {player.lives}</p>
      <p>leader: {player.leaderName}</p>
      <p>totalStrength: {totalStrength}</p>
      {player.passed ? <p><b>passed</b></p> : <p></p>}
    </div>
  );
}

const bitingFrostCard = new CardData("Biting Frost", "biting_frost.png", "special", "neutral", "0", "special", "weather", "3", "");
const impenetrableFogCard = new CardData("Impenetrable Fog", "impenetrable_fog.png", "special", "neutral", "0", "special", "weather", "3", "");
const torrentialRainCard = new CardData("Torrential Rain", "torrential_rain.png", "special", "neutral", "0", "special", "weather", "3", "");
// const BitingFrostView = new SmallCardView({bitingFrostCard});
// const impenetrableFogView = <SmallCardView cardData={impenetrableFogCard} />;
// const torrentialRainView = new SmallCardView({torrentialRainCard});

function WeatherPanel({weather}){
  console.log("rendering weather panel");

  return(
    <div className="weather_panel">
      <div className="weather_grid">
        <div>{weather.close ? <SmallCardView cardData={bitingFrostCard}/> : <></>}</div>
        <div>{weather.ranged ? <SmallCardView cardData={impenetrableFogCard}/> : <></>}</div>
        <div>{weather.siege ? <SmallCardView cardData={torrentialRainCard}/> : <></>}</div>
      </div>
    </div>
  );
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

  constructor(board){
    if(board){
      this.field = board.field;
      this.weather = board.weather;
      this.rallyHorns = board.rallyHorns;
      this.calculateMoraleAndTightBonds();
    }
  }

  calculateMoraleAndTightBonds(){
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
              this.tightBondsMaps[i].set(card.name, 0);
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
    let tightBond = this.tightBondsMaps[playerIndex].has(card.name) ? this.tightBondsMaps[playerIndex].get(card.name) : 0;

    //morale effects every creature in the row except itself
    if(card.special == "morale")
      morale--;

    let currentStrength = card.strength;
    if(this.weather[range] == true)
      currentStrength = 1;

    currentStrength = (currentStrength + morale)*(2**tightBond);
    
    if(this.rallyHorns[playerIndex][range])
      currentStrength = currentStrength * 2;

    return currentStrength;
  }
}

const rallyHornCard = new CardData("Commanders Horn", "commanders_horn.png", "special", "neutral", "0", "special", "horn", "3", "");

//Field is basically a view for my Board class
function Field({board, playerIndex, setPlayerTotal, setOpponentTotal}){
  console.log("rendering field component");

  let r1 = createCardRows(board, playerIndex, "siege", 1);
  let r2 = createCardRows(board, playerIndex, "ranged", 1);
  let r3 = createCardRows(board, playerIndex, "close", 1);
  //setOpponentTotal(r1[1] + r2[1] + r3[1]);
  let r4 = createCardRows(board, playerIndex, "close", 0);
  let r5 = createCardRows(board, playerIndex, "ranged", 0);
  let r6 = createCardRows(board, playerIndex, "siege", 0);
  //setPlayerTotal(r4[1] + r5[1] + r6[1]);

  return(
    <div className="field_grid">
      {r1[0]}
      {r2[0]}
      {r3[0]}
      
      {r4[0]}
      {r5[0]}
      {r6[0]}
    </div>
  );
}

function createCardRows(board, playerIndex, range, i){
  console.log("calling createCardRows function");

  let cardViews = [];
  let cards = board.field[(playerIndex + i) % 2][range];
  let rowWeather = board.weather[range];
  let rowStrength = 0;
  
  for(let j=0; j < cards.length; j++){
    let card = cards[j];
    let currentStrength = board.getCardStrength((playerIndex + i) % 2, range, j);
    rowStrength += currentStrength;

    cardViews.push(<SmallCardView
                      cardData={card}
                      key={(range + i) + j}
                      currentStrength={currentStrength}
                  />);
  }

  let rallyHorn = board.rallyHorns[(playerIndex + i) % 2][range];

  let cardViewClasses = "cardrow";
  if(rowWeather)
    cardViewClasses += " weather_active";
  //todo - if this row is targetable


  return[(<>
    <div className="range">{range}<p>totalStrength: {rowStrength}</p></div>
    <div className="rallyhorn">{rallyHorn ? <SmallCardView cardData={rallyHornCard}/> : <></>}</div>
    <div className={cardViewClasses}>{cardViews}</div>
  </>), rowStrength];
}


//first, checks for cardRows in localStorage
//if it's there already, use that data to build the cardMap
//otherwise, pull it from the server, save it to localStorage for later, and then build the map
//(Also, I need to build the map inside the async function, so there's a little duplicate code here
//  which I could refactor out into another function, but it's only 3 lines, so who cares)
export function getCardData(setcardmap, authheader) {
  let cardRows;
  if(localStorage.hasOwnProperty("cardRows")){
    cardRows = JSON.parse(localStorage.getItem("cardRows"));
    let map = new Map();
    cardRows.forEach((row, i) => {
      if(i !== 0){
        let card = new CardData(row[0], row[1], row[2], row[3], row[4], row[5], row[6], row[7], row[8], row[9]);
        map.set(row[0], card);
      }
    });
    setcardmap(map);
  }
  else {
    const fetchCardData = async () => {
      try {
        let result = await fetch(process.env.REACT_APP_BACKEND_URL + "getCardData", {
          headers: {"Authorization": authheader().split(" ")[1]}
        });
        cardRows = await result.json();
        localStorage.setItem("cardRows", JSON.stringify(cardRows));
        let map = new Map();
        cardRows.forEach((row, i) => {
          if(i !== 0){
            let card = new CardData(row[0], row[1], row[2], row[3], row[4], row[5], row[6], row[7], row[8], row[9]);
            map.set(row[0], card);
          }
        });
        setcardmap(map);
      } catch (error) {
        console.log(error);
      }
    }
    fetchCardData();
  }
}

let card1 = new CardData("Geralt of Rivia", "geralt_of_rivia.png", "hero", "neutral", "15", "close", "none", "1", "");
let card2 = new CardData("Yennefer of Vengerberg", "yennefer_of_vengerberg.png", "hero", "neutral", "7", "ranged", "medic", "1", "");
let card3 = new CardData("Triss Merigold", "triss_merigold.png", "hero", "neutral", "7", "close", "scorch", "1", "");
let card4 = new CardData("Cirilla Fiona Elen Riannon", "ciri.png", "hero", "neutral", "15", "close", "none", "1", "");

let initialGameState = {
  playerIndex: 0,
  playersTurn: 0,
  round: 1,
  board: new Board({
    field: [{close: [card1], ranged: [card2], siege: [card3], graveyard: [card4]},
            {close: [card2], ranged: [card4], siege: [card2], graveyard: []}],
    weather: {close: true, ranged: false, siege: true},
    rallyHorns: [{close: true, ranged: true, siege: true},
                {close: false, ranged: false, siege: false}]
  }),
  player: {
    lives: 2,
    passed: false,
    playerName: "jimmynewsom",
    faction: "Northern Realms",
    leaderName: "leaderwoman",
    hand: [card1, card2, card3, card4]
  },
  opponent: {
    lives: 2,
    passed: false,
    playerName: "opponent",
    faction: "Northern Realms",
    leaderName: "leaderman",
    hand: {length: 10}//this is a hack, so I can reuse my Player panel for both players, but not send 1 player what's in the other players hand
  }
}



export default function GwentClient({socket}) {
  console.log("rendering gwent client parent component");

  const authHeader = useAuthHeader();
  const [cardMap, setCardMap] = useState(new Map());
  
  //focusCard is going to look like cardIndex to start
  const [focusCard, setFocusCard] = useState();
  const [gameOverMessage, setGameOverMessage] = useState();
  const [playerTotal, setPlayerTotal] = useState(0);
  const [opponentTotal, setOpponentTotal] = useState(0);
  

  const [gameState, setGameState] = useState(initialGameState);

  function socketGameUpdateReceived(gameState){
    console.log("game update received");

    gameState.board = new Board(gameState.board);
    console.log(gameState.board);
    setGameState(gameState);
    console.log(gameState)
  };

  function socketGameOverReceived(result){
    console.log("game over");

    if(result.winner == gameState.playerIndex)
      setGameOverMessage("You Win!");
    else if(result.winner != 2)
      setGameOverMessage("You Lose!");
    else
      setGameOverMessage("Tie Game.");
  }

  useEffect(() => {
    getCardData(setCardMap, authHeader);

    console.log("connecting to websocket");
    socket.connect();
    socket.removeAllListeners("game_update");
    socket.removeAllListeners("game_over");
    socket.on("game_update", socketGameUpdateReceived);
    socket.on("game_over", socketGameOverReceived);
    socket.emit("request_game_update");

    return (() => {
      socket.disconnect();
      console.log("disconnecting socket");
    });
  }, []);

  function submitPass(){
    if(gameState.playersTurn != gameState.playerIndex){
      console.log("it's not your turn");
      return;
    }

    socket.emit("pass");
  }

  function handleHandClick(cardIndex){
    return () => {
      if(!socket.connected){
        alert("websocket is disconnected. please refresh the page!");
        return;
      }

      //first click makes the card the focus card
      if(!focusCard || focusCard[0] != cardIndex)
        setFocusCard([cardIndex]);
      else {
        //if the card is already the focus and they click it again, play the card, unless it has targeting rules
        //but first check if it's the players turn
        if(gameState.playersTurn != gameState.playerIndex){
          alert("it's not your turn");
          return;
        }

        let card = gameState.player.hand[cardIndex];

        if(card.type == "unit" || card.type == "hero"){
          console.log("unit or hero card played");
          if(card.special != "medic" && card.range != "agile"){
            console.log("socket connected: " + socket.connected);
            socket.emit("play_card", cardIndex);
          }
          else if(card.range == "agile"){
            //todo - implement agile targeting logic
            socket.emit("play_card", cardIndex, "close");
          }
          else {
            //todo - implement medic targeting logic
            socket.emit("play_card", cardIndex);
          }
        }
        else {
          //if the card is not type hero or unit it is type special
          //decoys and rally horns have targets, but the other special cards do not
          console.log("special card played");
          if(card.name != "Decoy" && card.name !="Commanders Horn"){
            socket.emit("play_card", cardIndex);
          }
          else if(card.name == "Commanders Horn"){
            //todo - add rally horn targeting logic
            socket.emit("play_card", cardIndex, "close");
          }
          else {
            //todo - add decoy targeting logic
            console.log("decoy played");
          }
        }
        setFocusCard();
        socket.emit("request_game_update");
      }
    }
   }

   //this function is kind of a repeat of my createCardRows function inside my Field component..... might refactor later
  function createHandViews(){
    let cardViews = [];
    let cards = gameState.player.hand;
    
    for(let i=0; i < cards.length; i++){
      let card = cards[i];

      cardViews.push(<SmallCardView
                        cardData={card}
                        handleClick={handleHandClick(i)}
                        key={"hand" + i}
                    />)
    }
    return cardViews;
  }


  
  if(gameState == undefined)
    return;

  if(gameOverMessage)
    return <h3>{gameOverMessage}</h3>

  return(
    <div className="gwent_client">
      <div className="gwent_client_grid">
        <div className="stats_panel">
          <PlayerStatsPanel
            player={gameState.opponent}
            totalStrength={opponentTotal}
          />
          <WeatherPanel
            weather={gameState.board.weather}
          />
          <p>round: {gameState.round}</p>
          <PlayerStatsPanel
            player={gameState.player}
            totalStrength={playerTotal}
          />
          <p>{gameState.playersTurn == gameState.playerIndex ? <b>YOUR TURN</b> : <b>NOT YOUR TURN</b>}</p>
          <button onClick={submitPass}>Pass</button>
        </div>
        <div className="board_panel">
          <Field 
            board={gameState.board}
            playerIndex={gameState.playerIndex}
            setPlayerTotal={setPlayerTotal}
            setOpponentTotal={setOpponentTotal}
          />
          <br />
          <div className="player_hand">
            {createHandViews()}
          </div>
        </div>
        <div className="right_panel">
          <div className="deck_and_graveyard">
            <p>graveyards</p>
            <p>decks & card focus</p>
          </div>
          <div className="card_focus">
            {focusCard ? <LargeCardView cardData={gameState.player.hand[focusCard[0]]} handleClick={()=>{}} /> : <></>}
          </div>
          <div className="deck_and_graveyard">
            <p>graveyards</p>
            <p>decks & card focus</p>
          </div>
        </div>
      </div>
    </div>
  );
}
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
      <p>totalStrength: {totalStrength.close + totalStrength.ranged + totalStrength.siege}</p>
      {player.passed ? <p><b>passed</b></p> : <p></p>}
    </div>
  );
}

const bitingFrostCard = new CardData("Biting Frost", "biting_frost.png", "special", "neutral", "0", "special", "weather", "3", "");
const impenetrableFogCard = new CardData("Impenetrable Fog", "impenetrable_fog.png", "special", "neutral", "0", "special", "weather", "3", "");
const torrentialRainCard = new CardData("Torrential Rain", "torrential_rain.png", "special", "neutral", "0", "special", "weather", "3", "");

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
      this.morale = board.morale;
      this.tightBondsMaps = board.tightBondsMaps;
    }
  }

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

  getTotalStrength(playerIndex){
    let totalStrength = {close: 0, ranged: 0, siege: 0};
    let ranges = ["close", "ranged", "siege"];
    for(let range of ranges){
      for(let i = 0; i < this.field[playerIndex][range].length; i++){
        totalStrength[range] += this.getCardStrength(playerIndex, range, i);
      }
    }
    return totalStrength;
  }
}

const rallyHornCard = new CardData("Commanders Horn", "commanders_horn.png", "special", "neutral", "0", "special", "horn", "3", "");

//Field is a view / react component for my Board data class made of CardRow components
function Field({board, playerIndex, playerTotal, opponentTotal, handlePFieldCardClick, handleOFieldCardClick, handleRangeClick}){
  console.log("rendering field component");

  let r1 = CardRow(board, playerIndex, "siege", 1, opponentTotal.siege, handleOFieldCardClick, () => {});
  let r2 = CardRow(board, playerIndex, "ranged", 1, opponentTotal.ranged, handleOFieldCardClick, () => {});
  let r3 = CardRow(board, playerIndex, "close", 1, opponentTotal.close, handleOFieldCardClick, () => {});
  let r4 = CardRow(board, playerIndex, "close", 0, playerTotal.close, handlePFieldCardClick, handleRangeClick);
  let r5 = CardRow(board, playerIndex, "ranged", 0, playerTotal.ranged, handlePFieldCardClick, handleRangeClick);
  let r6 = CardRow(board, playerIndex, "siege", 0, playerTotal.siege, handlePFieldCardClick, handleRangeClick);

  return(
    <div className="field_grid">
      {r1}{r2}{r3}{r4}{r5}{r6}
    </div>
  );
}

//CardRows are a row of cards plus weather, row totals, and rally horns
function CardRow(board, playerIndex, range, i, rowStrength, handleFieldCardClick, handleRangeClick){
  console.log("rendering CardRow component");

  let cardViews = [];
  let cards = board.field[(playerIndex + i) % 2][range];
  let rowWeather = board.weather[range];
  
  for(let j=0; j < cards.length; j++){
    let card = cards[j];
    cardViews.push(<SmallCardView
                      cardData={card}
                      key={(range + i) + j}
                      currentStrength={board.getCardStrength((playerIndex + i) % 2, range, j)}
                      handleClick={handleFieldCardClick(range, j)}
                  />);
  }

  let rallyHorn = board.rallyHorns[(playerIndex + i) % 2][range];

  let rowClasses = "row_grid";
  if(rowWeather)
    rowClasses += " weather_active";
  if(rallyHorn)
    rowClasses += " rallyhorn_active";
  //todo - if this row is targetable


  return(<div className={rowClasses} handleClick={handleRangeClick(range)}>
    <div className="range">{range}<p>totalStrength: {rowStrength}</p></div>
    <div className="rallyhorn">{rallyHorn ? <SmallCardView cardData={rallyHornCard}/> : <></>}</div>
    <div className="cardrow">{cardViews}</div>
  </div>);
}

//this is kind of a repeat of my CardRow component, but hands don't need weather, rally horns, and row totals
function PlayerHand({cards, handleHandCardClick}){
  let cardViews = [];
  for(let i = 0; i < cards.length; i++){
    let card = cards[i];
    cardViews.push(<SmallCardView
                      cardData={card}
                      handleClick={handleHandCardClick(i)}
                      currentStrength={card.strength}
                      key={"hand" + i}
                  />)
  }
  return cardViews;
}

//CardRowDialogs are for swapping cards at the start of the game, medics, and graveyards
function CardRowDialog(cards, handleDialogClick){
  console.log("rendering card view dialog");

  let cardViews = [];
  
  for(let j=0; j < cards.length; j++){
    let card = cards[j];
    cardViews.push(<LargeCardView
                      cardData={card}
                      key={(range + i) + j}
                      handleClick={handleDialogClick}
                  />);
  }

  return(
    <dialog className="card_dialog">
      
    </dialog>
  );
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

//initial game state to work on styling
let initialGameState = {
  playerIndex: 0,
  playersTurn: 0,
  round: 1,
  board: new Board({
    field: [{close: [card1], ranged: [card2], siege: [card3], graveyard: [card4]},
            {close: [card2], ranged: [card4], siege: [card2], graveyard: []}],
    weather: {close: true, ranged: false, siege: false},
    rallyHorns: [{close: true, ranged: false, siege: false},
                {close: false, ranged: false, siege: false}],
    morale: [{close: 0, ranged: 0, siege: 0}, {close: 0, ranged: 0, siege: 0}],
    tightBondsMaps: [new Map(), new Map()]
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
  
  //focusCard looks like [range or "hand", cardIndex, "player" or "opponent"]
  const [focusCard, setFocusCard] = useState();
  const [gameOverMessage, setGameOverMessage] = useState();
  const [gameState, setGameState] = useState(initialGameState);
  const [playerTotal, setPlayerTotal] = useState(initialGameState.board.getTotalStrength(initialGameState.playerIndex));
  const [opponentTotal, setOpponentTotal] = useState(initialGameState.board.getTotalStrength((initialGameState.playerIndex + 1) % 2));

  //I'm using a state variable for this instead of just an html dialog so that it won't render at all unless I need it
  //Otherwise I think a hidden html dialog would get recomputed every render phase
  //can be [null, "cardSwap", "playerGY", "opponentGY", or "medic"]
  const [dialogStatus, setDialogStatus] = useState();

  function socketGameUpdateReceived(gameState){
    console.log("game update received");
    gameState.board.tightBondsMaps = [new Map(Object.entries(gameState.tightBondsMaps[0])),
                                      new Map(Object.entries(gameState.tightBondsMaps[1]))];

    gameState.board = new Board(gameState.board);
    setGameState(gameState);
    setPlayerTotal(gameState.board.getTotalStrength(gameState.playerIndex));
    setOpponentTotal(gameState.board.getTotalStrength((gameState.playerIndex + 1) % 2));
    console.log(gameState)
  };

  function socketSubmitCardSwap(cardIndex){
    socket.emit("card_swap", cardIndex);
  }

  function socketSubmitPass(){
    if(gameState.playersTurn != gameState.playerIndex){
      console.log("it's not your turn");
      return;
    }

    socket.emit("pass");
  }

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

  function handleHandCardClick(socket, focusCard, gameState, cardIndex, setFocusCard){
    return () => {
      if(!socket.connected){
        alert("websocket is disconnected. please refresh the page!");
        return;
      }
  
      //first click makes the card the focus card
      if(!focusCard || focusCard[0] != "hand" || focusCard[1] != cardIndex)
        setFocusCard(["hand", cardIndex]);
      else {
        //if the card is already the focus and they click it again, play the card, unless it has targeting rules
        //but first check if it's the players turn
        if(gameState.playersTurn != gameState.playerIndex){
          alert("it's not your turn");
          return;
        }
  
        let card = gameState.player.hand[cardIndex];
        
        console.log("socket connected: " + socket.connected);
        console.log(card.name + " played");
  
        if(card.type == "unit" || card.type == "hero"){
          if(card.special != "medic" && card.range != "agile"){
            socket.emit("play_card", cardIndex);
            setFocusCard();
          }
          else if(card.range == "agile"){
            console.log("agile unit selected, please select row");
          }
          else {
            //todo - implement medic targeting logic
            socket.emit("play_card", cardIndex);
            setFocusCard();
          }
        }
        else {
          //if the card is not type hero or unit it is type special
          //decoys and rally horns have targets, but the other special cards do not
          if(card.name != "Decoy" && card.name !="Commanders Horn"){
            socket.emit("play_card", cardIndex);
            setFocusCard();
          }
          else if(card.name == "Commanders Horn"){
            console.log("rally horn selected, please select row");
          }
          else {
            console.log("decoy selected, please select target");
          }
        }
      }
    }
  }
  
  function handlePFieldCardClick(range, cardIndex){
    return () => {
      if(!socket.connected){
        alert("websocket is disconnected. please refresh the page!");
        return;
      }
  
      //if the focus card is a decoy in the player's hand, clicking a card on your side of the field will make it the target for the decoy
      if(focusCard && focusCard[0] == "hand"){
        if(gameState.playersTurn != gameState.playerIndex){
          alert("it's not your turn");
          return;
        }
  
        if(gameState.player.hand[focusCard[1]].special == "decoy"){
          if(gameState.board.field[gameState.playerIndex][range][cardIndex].type == "unit")
            socket.emit("play_card", focusCard[1], {range: range, index: cardIndex});
        }
      }
  
      //otherwise, set the focus card to the card that was clicked
      else if(!focusCard || focusCard[0] != range || focusCard[1] != cardIndex || focusCard[2] == "player");
        setFocusCard([range, cardIndex, "player"]);
    }
  }
  
  function handleOFieldCardClick(range, cardIndex){
    return () => {
      if(!socket.connected){
        alert("websocket is disconnected. please refresh the page!");
        return;
      }
  
      if(!focusCard || focusCard[0] != range || focusCard[1] != cardIndex || focusCard[2] != "opponent");
        setFocusCard(range, cardIndex, "opponent");
    }
  }
  
  function handleRangeClick(range){
    return () => {
      if(focusCard && focusCard[0] == "hand"){
        let fcard = gameState.player.hand[focusCard[1]];
        if((fcard.name == "Commanders Horn") || (fcard.range == "agile" && range != "siege"))
          socket.emit("play_card", focusCard[1], range);
      }
    }
  }

  function showGameDialog() {
    let dialog = document.getElementById("game-dialog");
    dialog.showModal();
  }
  
  function hideGameDialog() {
    let dialog = document.getElementById("game-dialog");
    dialog.close();
  }

  

  //////////////////////////////////////////////////////
  ////////////////// Render Logic /////////////////////
  ////////////////////////////////////////////////////
  
  if(gameState == undefined)
    return;

  if(gameOverMessage)
    return <h3>{gameOverMessage}</h3>

  let dialogContent;
  if(dialogStatus){
    if(dialogStatus == "cardSwap"){
      dialogContent = <div>Card Swap</div>;
    }
    else if(dialogStatus == "playerGY"){
      dialogContent = (
        <div>
          <p>player GY</p>
          <button onClick={()=>{setDialogStatus()}}>Close GY</button>  
        </div>
      );
    }
    else if(dialogStatus == "opponentGY"){
      dialogContent = (
        <div>
          <p>opponent GY</p>
          <button onClick={()=>{setDialogStatus()}}>Close GY</button>  
        </div>
      );
    }
  }
  else {
    dialogContent = <></>;
  }



  //focusCard has shape [range (or hand), index, player or opponent]
  //but I might refactor it to be [range (or hand), index, player or opponent, card]
  let fcard;
  if(focusCard && focusCard[0] == "hand"){
    fcard = gameState.player.hand[focusCard[1]];
  }
  else if(focusCard && focusCard[2] == "player")
    fcard = gameState.board.field[gameState.playerIndex][focusCard[0]][focusCard[1]];
  else if(focusCard && focusCard[2] == "opponent")
    fcard = gameState.board.field[(gameState.playerIndex + 1) % 2][focusCard[0]][focusCard[1]];

  return(
    <div className="gwent_client">
      <dialog id="game-dialog">{dialogContent}</dialog>
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
          <button onClick={socketSubmitPass}>Pass</button>
        </div>
        <div className="board_panel">
          <Field 
            board={gameState.board}
            playerIndex={gameState.playerIndex}
            playerTotal={playerTotal}
            opponentTotal={opponentTotal}
            handlePFieldCardClick={handlePFieldCardClick}
            handleOFieldCardClick={handleOFieldCardClick}
            handleRangeClick={handleRangeClick}
          />
          <br />
          <div className="player_hand">
            <PlayerHand cards={gameState.player.hand} handleHandCardClick={handleHandCardClick} />
          </div>
        </div>
        <div className="right_panel">
          <div className="deck_and_graveyard">
            <LargeCardView cardData={card1} handleClick={()=>{}} />
            <p>opponent graveyard</p>
            <p>opponent deck size: 20</p>
          </div>
          <div className="card_focus">
            {focusCard ? <LargeCardView cardData={fcard} handleClick={()=>{}} /> : <></>}
          </div>
          <div className="deck_and_graveyard">
            <LargeCardView cardData={card1} handleClick={()=>{}} />
            <p>player graveyard</p>
            <p>decks & card focus</p>
          </div>
        </div>
      </div>
    </div>
  );
}
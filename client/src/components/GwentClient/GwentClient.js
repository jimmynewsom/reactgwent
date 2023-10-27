import './GwentClient.css';
import React, { useState, useEffect } from 'react';
import { useAuthHeader } from 'react-auth-kit';

import {LargeCardView, CardData, SmallCardView} from '../Card/Card';


function PlayerStatsPanel({player}){
  return(
    <div className="player_stats_panel">
      <p>{player.name}</p>
      <p>{player.faction}</p>
      <p>(number of cards in hand)</p>
      <p>lives: {player.lives}</p>
      {player.passed ? <p><b>passed</b></p> : <p></p>}
    </div>
  );
}

function WeatherPanel({weather}){
  return(
    <div className="weather_panel">
      <div className="weather_grid">
        <div>{weather.close ? <p>snow</p> : <p>no snow</p>}</div>
        <div>{weather.ranged ? <p>fog</p> : <p>no fog</p>}</div>
        <div>{weather.siege ? <p>rain</p> : <p>no rain</p>}</div>
      </div>
    </div>
  );
}

function Field({fieldData, rallyHorns, playerIndex}){

  return(
    <div className="field">
      <div className="field_grid">
        <div>one</div>
        <div>two</div>
        <div>three</div>
        <div>gap</div>
        <div>four</div>
        <div>five</div>
        <div>six</div>
      </div>
    </div>
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
        let result = await fetch("http://localhost:5000/getCardData", {
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


export default function GwentClient() {
  const authHeader = useAuthHeader();
  const [cardMap, setCardMap] = useState(new Map());
  const [player, setPlayer] = useState({name: "player", faction: "Northern Realms", lives: 2, passed: false});
  const [opponent, setOpponent] = useState({name: "opponent", faction: "Northern Realms", lives: 2, passed: false});
  const [weather, setWeather] = useState({close: false, ranged: false, siege: false});
  const [playerIndex, setPlayerIndex] = useState(0);

  let card = new CardData("Geralt of Rivia", "geralt_of_rivia.png", "hero", "neutral" , "15", "close", "none", "1", "");
  let dummyFieldData = [{close: ["Geralt of Rivia"], ranged: [], siege: []}, {close: [], ranged: [], siege: []}];
  
  const [fieldData, setFieldData] = useState(dummyFieldData);
  const [rallyHorns, setRallyHorns] = useState([{close: false, ranged: false, siege: false}, {close: false, ranged: false, siege: false}]);
  const [focusCard, setFocusCard] = useState(card);






  function createCardViews(range, i){
    console.log(cardMap);
    let cardViews = [];
    let cardNames = fieldData[(playerIndex + i) % 2][range];
    console.log(cardNames);

    if(cardMap.size == 0)
      return;
    

    for(let j=0; j < cardNames.length; j++){
      let cardName = cardNames[j];
      console.log(cardName);
      let card = cardMap.get(cardName);
      console.log(card);

      cardViews.push(<SmallCardView
                        cardData={card}
                        key={(range + i) + j}
                    />)
    }
    return cardViews;
  }

  useEffect(() => {
    getCardData(setCardMap, authHeader);
  }, []);

  return(
    <div className="gwent_client">
      <div className="gwent_client_grid">
        <div className="stats_panel">
          <PlayerStatsPanel
            player={opponent}
          />
          <WeatherPanel
            weather={weather}
          />
          <PlayerStatsPanel
            player={player}
          />
          <button>Pass</button>
        </div>
        <div className="board_panel">
          <div>{createCardViews("close", 0)}</div>
          <div className="player_hand">
            player hand
          </div>
        </div>
        <div className="right_panel">
          <div className="deck_and_graveyard">
            <p>graveyards</p>
            <p>decks & card focus</p>
          </div>
          <div className="card_focus">
            {focusCard ? <LargeCardView cardData={focusCard} handleClick={()=>{}} /> : <></>}
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
// Import dependencies
import './DeckBuilder.scss';
import React, {useState, useEffect} from 'react';
import {useParams} from 'react-router-dom';
import {useAuthHeader} from 'react-auth-kit';

// Import components
import {getCardData} from '../GwentClient/GwentClient';
import {LargeCardView, CardData, LeaderCardView, LeaderCardData} from '../Card/Card';

// Import icons
import { TbCards } from "react-icons/tb";
import { CgCardSpades, CgCardClubs } from "react-icons/cg";
import { PiHandFist } from "react-icons/pi";
import { GiElfHelmet, GiBroadsword, GiCrossbow, GiSpikedShield } from "react-icons/gi";
import { GoSun } from "react-icons/go";


//this class is so I can re-use my deck hashmaps, but still have new objects so that react notices the state changes
export class GwentDeck {
  constructor(deck){
    if(!deck){
      this.cards = new Map();
      this.heroCount = 0;
      this.specialCount = 0;
      this.unitCount = 0;
      this.totalCardCount = 0;
      this.totalUnitStrength = 0;
    }
    else {
      this.cards = deck.cards;
      this.heroCount = deck.heroCount;
      this.specialCount = deck.specialCount;
      this.unitCount = deck.unitCount;
      this.totalCardCount = deck.totalCardCount;
      this.totalUnitStrength = deck.totalUnitStrength;
      this.leaderName = deck.leaderName;
    }
  }

  setLeaderNameAndReturnDeck(leaderName){
    this.leaderName = leaderName;
    return this;
  }
}


/*
So, my approach is as follows:
1)load all the card data into a cardMap
2)track currentFaction, currentDeck, and 1 deck per faction as state variables
3)load the left panel (available cards) by looking at the cardMap, currentFaction, and currentDeck
4)load the right panel by looking at the currentDeck
5)when a user clicks a card in the left panel
  - check if there is already the max # of that card in the current deck. if so, do nothing
  - otherwise, add 1 to that card in the current deck object, then make a new identical deck object from the old deck object so react notices the changes
    set current deck equal to the new deck object
  - finally, set the respective faction deck equal to the new current deck. this will save changes if a user switches factions later

6)when a user clicks a card in the right panel
  - check if there is currently 0 of that card in the current deck. if so, do nothing
  - otherwise, subtract 1 from that card in the current deck object, and make a new deck object from the old deck object. set current deck equal to the new deck
  - finally, set the respective faction deck equal to the new current deck. same reason as above

7)when a user switches factions
  - update currentFaction, then set currentDeck equal to the respective faction deck

8)also, I don't have images for the skellige deck yet, so that is TODO for now / maybe forever
*/


export default function DeckBuilder({socket}) {
  console.log("rendering Deckbuilder component");

  const authHeader = useAuthHeader();
  const [cardMap, setCardMap] = useState(new Map());
  const [leaderMap, setLeaderMap] = useState(new Map());
  const [currentFaction, setCurrentFaction] = useState("Northern Realms");
  const [currentDeck, setCurrentDeck] = useState(new GwentDeck().setLeaderNameAndReturnDeck("Foltest King of Temeria"));
  const [northernRealmsDeck, setNorthernRealmsDeck] = useState(currentDeck);
  const [nilfgaardDeck, setNilfgaardDeck] = useState(new GwentDeck().setLeaderNameAndReturnDeck("Emhyr var Emreis Emperor of Nilfgaard"));
  const [scoiataelDeck, setScoiataelDeck] = useState(new GwentDeck().setLeaderNameAndReturnDeck("Francesca Findabair the Beautiful"));
  const [monsterDeck, setMonsterDeck] = useState(new GwentDeck().setLeaderNameAndReturnDeck("Eredin Bringer of Death"));
  //const [skelligeDeck, setSkelligeDeck] = useState(new GwentDeck());

  const { roomName } = useParams();

  //commenting out the skelligeDeck because I don't have images for those cards yet
  function nextFaction(){
    if(currentFaction == "Northern Realms"){
      setCurrentFaction("Monsters");
      setCurrentDeck(monsterDeck);
    }
    else if(currentFaction == "Monsters"){
      //setCurrentFaction("Skellige");
      //setCurrentDeck(skelligeDeck);
      setCurrentFaction("Nilfgaard");
      setCurrentDeck(nilfgaardDeck);
    }
    // else if(currentFaction == "Skellige"){
    //   setCurrentFaction("Nilfgaard");
    //   setCurrentDeck(nilfgaardDeck);
    // }
    else if(currentFaction == "Nilfgaard"){
      setCurrentFaction("Scoiatael");
      setCurrentDeck(scoiataelDeck);
    }
    else if(currentFaction == "Scoiatael"){
      setCurrentFaction("Northern Realms");
      setCurrentDeck(northernRealmsDeck);
    }
  }
  
  function previousFaction(){
    if(currentFaction == "Northern Realms"){
      setCurrentFaction("Scoiatael");
      setCurrentDeck(scoiataelDeck);
    }
    else if(currentFaction == "Scoiatael"){
      setCurrentFaction("Nilfgaard");
      setCurrentDeck(nilfgaardDeck);
    }
    else if(currentFaction == "Nilfgaard"){
      // setCurrentFaction("Skellige");
      // setCurrentDeck(skelligeDeck);
      setCurrentFaction("Monsters");
      setCurrentDeck(monsterDeck);
    }
    // else if(currentFaction == "Skellige"){
    //   setCurrentFaction("Monsters");
    //   setCurrentDeck(monsterDeck);
    // }
    else if(currentFaction == "Monsters"){
      setCurrentFaction("Northern Realms");
      setCurrentDeck(northernRealmsDeck);
    }
  }
  
  function addCardToDeck(cardData){
    if(currentDeck.cards.has(cardData.name) && currentDeck.cards.get(cardData.name) == cardData.available){
      console.log("error! maximum number of card " + cardData.name + " already in deck!");
      return;
    }

    currentDeck.totalCardCount++;

    if(cardData.type == "unit"){
      currentDeck.unitCount++;
      currentDeck.totalUnitStrength += cardData.strength;
    }
    else if(cardData.type == "special"){
      currentDeck.specialCount++;
    }
    else if(cardData.type == "hero"){
      currentDeck.unitCount++;
      currentDeck.totalUnitStrength += cardData.strength;
      currentDeck.heroCount++;
    }

    if(currentDeck.cards.has(cardData.name)){
      currentDeck.cards.set(cardData.name, currentDeck.cards.get(cardData.name) + 1);
    }
    else {
      currentDeck.cards.set(cardData.name, 1);
    }

    setCurrentDeck(new GwentDeck(currentDeck));
    
    if(currentFaction == "Northern Realms")
      setNorthernRealmsDeck(currentDeck);
    else if(currentFaction == "Monsters")
      setMonsterDeck(currentDeck);
    // else if(currentFaction == "Skellige")
    //   setSkelligeDeck(currentDeck);
    else if(currentFaction == "Nilfgaard")
      setNilfgaardDeck(currentDeck);
    else if(currentFaction == "Scoiatael")
      setScoiataelDeck(currentDeck);
  }
  
  function removeCardFromDeck(cardData){
    if(currentDeck.cards.get(cardData.name) == 0){
      //I'm pretty sure this check is unneccessary, because if there are 0 in the deck the card shouldn't be in the view and thus unclickable
      //but I'm including this in case people click really fast or something
      console.log("error! current deck already has 0 of this card!");
      return;
    }

    currentDeck.totalCardCount--;

    if(cardData.type == "unit"){
      currentDeck.unitCount--;
      currentDeck.totalUnitStrength -= cardData.strength;
    }
    else if(cardData.type == "special"){
      currentDeck.specialCount--;
    }
    else if(cardData.type == "hero"){
      currentDeck.unitCount--;
      currentDeck.totalUnitStrength -= cardData.strength;
      currentDeck.heroCount--;
    }

    currentDeck.cards.set(cardData.name, currentDeck.cards.get(cardData.name) - 1);

    setCurrentDeck(new GwentDeck(currentDeck));

    if(currentFaction == "Northern Realms")
        setNorthernRealmsDeck(currentDeck);
    else if(currentFaction == "Monsters")
      setMonsterDeck(currentDeck);
    // else if(currentFaction == "Skellige")
    //   setSkelligeDeck(currentDeck);
    else if(currentFaction == "Nilfgaard")
      setNilfgaardDeck(currentDeck);
    else if(currentFaction == "Scoiatael")
      setScoiataelDeck(currentDeck);
  }

  function createAvailableCards(){
    let cardViews = [];
    for(let [keyy, value] of cardMap){
      if(value.faction != currentFaction && value.faction != "neutral")
        continue;

      let used = currentDeck.cards.has(keyy) ? currentDeck.cards.get(keyy) : 0;
      let available = value.available - used;
      if(available != 0)
        cardViews.push(<LargeCardView
                            cardData={value}
                            handleClick={addCardToDeck}
                            key={value.name}
                            available={available}
                        />);
    }
    return cardViews;
  }

  function createUsedCards(){
    if(cardMap.size == 0){
      console.log("cardMap hasn't loaded yet");
      return;
    }

    let cardViews = [];
    for(let [keyy, value] of currentDeck.cards){
      if(currentDeck.cards.get(keyy) == 0)
        continue;

      cardViews.push(<LargeCardView
                          cardData={cardMap.get(keyy)}
                          handleClick={removeCardFromDeck}
                          key={keyy + "2"}
                          available={value}
                      />);
    }
    return cardViews;
  }

  function createLeaderCards(){
    let cardViews = [];
    for(let [keyy, value] of leaderMap){
      if(value.faction != currentFaction)
        continue;

      cardViews.push(<div key={value.name} className="leader-select-card" onClick={()=>{chooseLeader(value.name)}}>
          <LeaderCardView leaderCardData={value} />
          <p>{value.ability_description}</p>
        </div>);
    }
    return cardViews;
  }

  function chooseLeader(leaderName){
    currentDeck.leaderName = leaderName;
    setCurrentDeck(new GwentDeck(currentDeck));

    if(currentFaction == "Northern Realms")
      setNorthernRealmsDeck(currentDeck);
    else if(currentFaction == "Monsters")
      setMonsterDeck(currentDeck);
    // else if(currentFaction == "Skellige")
    //   setSkelligeDeck(currentDeck);
    else if(currentFaction == "Nilfgaard")
      setNilfgaardDeck(currentDeck);
    else if(currentFaction == "Scoiatael")
      setScoiataelDeck(currentDeck);

    hideLeaderDialog();
  }

  function showLeaderDialog(){
    let dialog = document.getElementById("leader-dialog");
    dialog.showModal();
  }

  function hideLeaderDialog(){
    let dialog = document.getElementById("leader-dialog");
    dialog.close();
  }

  //saves current faction deck to the database
  async function saveCurrentDeck(){
    let button = document.getElementById("save-button");
    button.disabled = true;
    try {
      let cards = Object.fromEntries(currentDeck.cards.entries());
      let serializableDeck = {
        "faction": currentFaction,
        "leaderName": currentDeck.leaderName,
        "cards": cards
      };
      let result = await fetch(process.env.REACT_APP_BACKEND_URL + "saveUserDeck", {
        method: 'POST',
        headers: {
          "Authorization": authHeader().split(" ")[1],
          "Accept": 'application/json',
          "Content-Type": 'application/json'
        },
        //I am not including the count fields here, because I will calculate those on the server, in case someone trys to cheat
        body: JSON.stringify(serializableDeck)
      });
      let message = await result.json();
      console.log(message);
    }
    catch (error){
      console.log(error);
    }
    button.disabled = false;
  }

  async function fetchUserDecks(){
    try {
      let result = await fetch(process.env.REACT_APP_BACKEND_URL + "getUserDecks", {
        headers: {"Authorization": authHeader().split(" ")[1]}
      });
      let mongoDeckObjects = await result.json();
      //console.log(decks);

      for(let mongoDeck of mongoDeckObjects){
        let map = new Map(Object.entries(mongoDeck.cards));
        let gwentClientDeck = new GwentDeck();
        gwentClientDeck.cards = map;
        gwentClientDeck.totalCardCount = mongoDeck.totalCardCount;
        gwentClientDeck.unitCount = mongoDeck.unitCount;
        gwentClientDeck.specialCount = mongoDeck.specialCount;
        gwentClientDeck.totalUnitStrength = mongoDeck.totalUnitStrength;
        gwentClientDeck.heroCount = mongoDeck.heroCount;
        gwentClientDeck.leaderName = mongoDeck.leaderName;

        if(mongoDeck.faction == "Northern Realms"){
          setCurrentDeck(gwentClientDeck);
          setNorthernRealmsDeck(gwentClientDeck);
          setCurrentFaction("Northern Realms");
        }
        else if(mongoDeck.faction == "Monsters")
          setMonsterDeck(gwentClientDeck);
        // else if(mongoDeck.faction == "Skellige")
        //   setSkelligeDeck(map);
        else if(mongoDeck.faction == "Nilfgaard")
          setNilfgaardDeck(gwentClientDeck);
        else if(mongoDeck.faction == "Scoiatael")
          setScoiataelDeck(gwentClientDeck);
      }
    } catch (error){
      console.log(error);
    }
  }

  function submitReady(){
    if(!socket.connected){
      alert("websocket is disconnected. please refresh the page!");
      return;
    }

    let cards = Object.fromEntries(currentDeck.cards.entries());
    let serializableDeck = {
      "faction": currentFaction,
      "leaderName": currentDeck.leaderName,
      "cards": cards
    };
    let button = document.getElementById("ready");
    button.disabled = true;
    setTimeout(() => {button.disabled = false}, 3000);
    socket.emit("ready_for_game", serializableDeck);
  }


  //uses getCardData and getLeaderData functions from GwentClient class
  //then loads the users decks from the server (or the default decks if the user has no saved decks, handled by server-side logic)
  useEffect(() => {
    getCardData(setCardMap, setLeaderMap);
    fetchUserDecks();
    console.log("test - roomName = " + roomName);
    if(roomName){
      console.log("connecting to websocket");
      socket.connect();
      socket.removeAllListeners("deck_validation_passed");
      socket.removeAllListeners("deck_validation_failed");
      socket.on("deck_validation_passed", () => {alert("deck passed validation! waiting for opponent")});
      socket.on("deck_validation_failed", () => {alert("deck failed validation! please submit a valid deck")});
      return (() => {
        socket.disconnect();
        console.log("disconnecting socket");
      });
    }
  },  []);


  //this is so that if these objects haven't finished loading yet (from the server or localStorage) I don't get errors
  if(cardMap.size == 0 || leaderMap.size == 0)
    return;

  return(
    <div className="deckbuilder">
      <div className="deckbuilder-border">
        <dialog id="leader-dialog">
          <h3>Select Leader</h3>
          <div className="leader-select-border">
            {createLeaderCards()}
          </div>
          <button className="primary-button" onClick={hideLeaderDialog}>Close</button>
        </dialog>
        <h1 className={'screen-heading'}>DeckBuilder</h1>
        <div className="faction-select">
          <button className={'primary-button'} onClick={previousFaction}> previous faction </button>
          <h2> {currentFaction} </h2>
          <button className={'primary-button'} onClick={nextFaction}> next faction </button>
        </div>
        <div className="deckbuilder-grid">
          <div className="one">
            <p className="filters"><TbCards /><GiBroadsword /><GiCrossbow /><GiElfHelmet /><GoSun /><GiSpikedShield />(filters - todo)</p>
            <h4>Available Cards</h4>
            <div className="card-panel">
              {createAvailableCards()}
            </div>
          </div>
          <div className="two">
            <LeaderCardView leaderCardData={leaderMap.get(currentDeck.leaderName)} />
            <div><button className="primary-button" onClick={showLeaderDialog}>Choose Leader</button></div>
            <strong>Total cards in deck</strong>
            <p className="card-stat"><TbCards />{currentDeck.totalCardCount}</p>
            <strong>Number of Unit Cards</strong>

            {currentDeck.unitCount >= 22 ? <p style={{color:"green"}}><CgCardSpades />{currentDeck.unitCount}</p> : <p style={{color:"red"}}>{currentDeck.unitCount}/22</p>}

            <strong>Special Cards</strong>

            {currentDeck.specialCount <= 10 ? <p style={{color:"green"}}><CgCardClubs />{currentDeck.specialCount}/10</p> : <p style={{color:"red"}}>{currentDeck.specialCount}/10</p>}
            
            <strong>Total Unit Card Strength</strong>
            <p className="card-stat"><PiHandFist />{currentDeck.totalUnitStrength}</p>
            <strong>Hero Cards</strong>
            <p className="card-stat"><GiElfHelmet />{currentDeck.heroCount}</p>

            {!roomName ? <button className="primary-button" id="save-button" onClick={saveCurrentDeck}> Save current deck </button> : <button className="primary-button" id="ready" onClick={submitReady}> Ready (use current deck) </button>}
          </div>
          <div className="three">
          <p className="filters"><TbCards /><GiBroadsword /><GiCrossbow /><GiElfHelmet /><GoSun /><GiSpikedShield />(filters - todo)</p>
            <h5>Cards in Deck</h5>
            <div className="card-panel">
              {createUsedCards()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
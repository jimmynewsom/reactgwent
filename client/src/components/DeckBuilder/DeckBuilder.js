import './DeckBuilder.css';
import React, { useState, useEffect } from 'react';
import { useAuthHeader } from 'react-auth-kit';

import {LargeCardView, CardData} from '../Card/Card';


/*
So, in retrospect, this component sucks as a React component, because the best way for me to track cards in a deck is a map,
but React uses shallow comparison to check for changes in state. So to get React to notice my changes I need to make new objects everytime.
Which is probably expensive and wasteful, but idk how else to get this to work with React
anyway, working is better than perfect, right? v1, I'm gonna try it like this and see if it's fast enough...

So, my approach is as follows:
1)load all the card data into a cardMap
2)track currentFaction, currentDeck, and 1 deck per faction
3)load the left panel (available cards) by looking at the cardMap, currentFaction, and currentDeck
4)load the right panel by looking at the currentDeck
5)when a user clicks a card in the left panel
  - check if there is already the max # of that card in the current deck. if so, do nothing
  - if there is less than the max #, make a new map and add 1 to that card in the current deck map. set current deck equal to the new map
  - finally, set the respective faction deck map equal to the new current deck map. this will save changes if a user switches factions later

6)when a user clicks a card in the right panel
  - (if there are 0 in the deck there shouldn't be a card showing in the right panel, so we don't need to check that first)
  - make a new map and subtract 1 from that card in the current deck map. set current deck equal to the new map
  - finally, set the respective faction deck map equal to the new current deck map. same reason as above

7)when a user switches factions
  - update currentFaction, then set currentDeck equal to the respective faction deck

8)also, I'm only implementing Northern Realms to start. but this is my plan for adding the other factions later
*/


export default function DeckBuilder() {
  const authHeader = useAuthHeader();
  const [cardMap, setCardMap] = useState(new Map());
  const [currentFaction, setCurrentFaction] = useState("Northern Realms");
  const [currentDeck, setCurrentDeck] = useState(new Map());
  const [northernRealmsDeck, setNorthernRealmsDeck] = useState(currentDeck);
  const [nilfgaardDeck, setNilfgaardDeck] = useState(new Map());
  const [scoiataelDeck, setScoiataelDeck] = useState(new Map());
  const [monsterDeck, setMonsterDeck] = useState(new Map());
  const [skelligeDeck, setSkelligeDeck] = useState(new Map());

  const [totalCardCount, setTotalCardCount] = useState(0);
  const [unitCardCount, setUnitCardCount] = useState(0);
  const [specialCardCount, setSpecialCardsCount] = useState(0);
  const [totalUnitStrength, setTotalUnitStrength] = useState(0);
  const [heroCardCount, setHeroCardCount] = useState(0);


  function nextFaction(){
    if(currentFaction == "Northern Realms"){
      setCurrentFaction("Monsters");
      setCurrentDeck(monsterDeck);
    }
    else if(currentFaction == "Monsters"){
      setCurrentFaction("Skellige");
      setCurrentDeck(skelligeDeck);
    }
    else if(currentFaction == "Skellige"){
      setCurrentFaction("Nilfgaard");
      setCurrentDeck(nilfgaardDeck);
    }
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
      setCurrentFaction("Skellige");
      setCurrentDeck(skelligeDeck);
    }
    else if(currentFaction == "Skellige"){
      setCurrentFaction("Monsters");
      setCurrentDeck(monsterDeck);
    }
    else if(currentFaction == "Monsters"){
      setCurrentFaction("Northern Realms");
      setCurrentDeck(northernRealmsDeck);
    }
  }
  
  function addCardToDeck(cardData){
    return (() => {
      if(currentDeck.has(cardData.name) && currentDeck.get(cardData.name) == cardData.available){
        console.log("error! maximum number of card " + cardData.name + " already in deck!");
      }
      else {
        //this might be faster / rerender less times if I group some of these states into an object
        //will optimize later if necessary
        setTotalCardCount(totalCardCount + 1);

        if(cardData.type == "unit"){
          setUnitCardCount(unitCardCount + 1);
          setTotalUnitStrength(totalUnitStrength + cardData.strength);
        }
        else if(cardData.type == "special")
          setSpecialCardsCount(specialCardCount + 1);
        else if(cardData.type == "hero"){
          setUnitCardCount(unitCardCount + 1);
          setTotalUnitStrength(totalUnitStrength + cardData.strength);
          setHeroCardCount(heroCardCount + 1);
        }

        setCurrentDeck(new Map(currentDeck.set(cardData.name, currentDeck.has(cardData.name) ? currentDeck.get(cardData.name) + 1 : 1)));
        
        //I was going to use another map, faction decks, with all the decks in it
        //but since state is supposed to immutable, I think this is better
        if(currentFaction == "Northern Realms")
          setNorthernRealmsDeck(currentDeck);
        else if(currentFaction == "Monsters")
          setMonsterDeck(currentDeck);
        else if(currentFaction == "Skellige")
          setSkelligeDeck(currentDeck);
        else if(currentFaction == "Nilfgaard")
          setNilfgaardDeck(currentDeck);
        else if(currentFaction == "Scoiatael")
          setScoiataelDeck(currentDeck);
      }
    })
  }
  
  function removeCardFromDeck(cardData){
    return (() => {
      setTotalCardCount(totalCardCount - 1);

      if(cardData.type == "unit"){
        setUnitCardCount(unitCardCount - 1);
        setTotalUnitStrength(totalUnitStrength - cardData.strength);
      }
      else if(cardData.type == "special")
        setSpecialCardsCount(specialCardCount - 1);
      else if(cardData.type == "hero"){
        setUnitCardCount(unitCardCount - 1);
        setTotalUnitStrength(totalUnitStrength - cardData.strength);
        setHeroCardCount(heroCardCount - 1);
      }

      setCurrentDeck(new Map(currentDeck.set(cardData.name, currentDeck.get(cardData.name) - 1)));

      if(currentFaction == "Northern Realms")
          setNorthernRealmsDeck(currentDeck);
        else if(currentFaction == "Monsters")
          setMonsterDeck(currentDeck);
        else if(currentFaction == "Skellige")
          setSkelligeDeck(currentDeck);
        else if(currentFaction == "Nilfgaard")
          setNilfgaardDeck(currentDeck);
        else if(currentFaction == "Scoiatael")
          setScoiataelDeck(currentDeck);
    }
  )};

  function createAvailableCards(){
    let cardViews = [];
    for(let [keyy, value] of cardMap){
      if(value.faction != currentFaction && value.faction != "neutral")
        continue;

      let used = currentDeck.has(keyy) ? currentDeck.get(keyy) : 0;
      let available = value.available - used;
      if(available != 0)
        cardViews.push(<LargeCardView
                            cardData={value}
                            handleClick={addCardToDeck}
                            key={value.name}
                            available={available}
                        />)
    }
    return cardViews;
  }

  function createUsedCards(){
    let cardViews = [];
    for(let [keyy, value] of currentDeck){
      if(currentDeck.get(keyy) == 0)
        continue;

      cardViews.push(<LargeCardView
                          cardData={cardMap.get(keyy)}
                          handleClick={removeCardFromDeck}
                          key={keyy + "2"}
                          available={value}
                      />)
    }
    return cardViews;
  }

  async function saveCurrentDeck(){
    let button = document.getElementById("save_button");
    button.disabled = true;
    try {
      let cards = Object.fromEntries(currentDeck.entries());
      let result = await fetch("http://localhost:5000/saveUserDeck", {
        method: 'POST',
        headers: {
          "Authorization": authHeader().split(" ")[1],
          "Accept": 'application/json',
          "Content-Type": 'application/json'
        },
        body: JSON.stringify({
          "faction": currentFaction,
          "leader": "Foltest, King of the North",
          "cards": cards
        })
      });
      let message = await result.json();
      console.log(message);
    }
    catch (error){
      console.log(error);
    }
    button.disabled = false;
  }

  //this is a big one. loads data for deckbuilder component
  //first, checks for cardRows in localStorage
  //if it's there already, use that data to build the cardMap
  //otherwise, pull it from the server, save it to localStorage for later, and then build the map
  //(Also, I need to build the map inside the async function, so there's a little duplicate code here)
  //then load the users decks from the server (or the default decks if the user has no saved decks, handled by server-side logic)
  useEffect(() => {
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
      setCardMap(map);
    }
    else {
      const fetchCardData = async () => {
        try {
          let result = await fetch("http://localhost:5000/getCardData", {
            headers: {"Authorization": authHeader().split(" ")[1]}
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
          setCardMap(map);
        } catch (error) {
          console.log(error);
        }
      }
      fetchCardData();
    }

    const fetchUserDecks = async () => {
      try {
        let result = await fetch("http://localhost:5000/getUserDecks", {
          headers: {"Authorization": authHeader().split(" ")[1]}
        });
        let decks = await result.json();
        //console.log(decks);

        for(let deck of decks){
          let map = new Map(Object.entries(deck.cards));
          if(deck.faction == "Northern Realms"){
            setCurrentDeck(map);
            setNorthernRealmsDeck(map);
            setCurrentFaction("Northern Realms");
            setTotalCardCount(deck.totalCardCount);
            setUnitCardCount(deck.unitCardCount);
            setSpecialCardsCount(deck.specialCardCount);
            setTotalUnitStrength(deck.totalUnitStrength);
            setHeroCardCount(deck.heroCardCount);
          }

          //I'm leaving this commented out for now, because if there are any typos in my card names this will explode
          //(because looking up the card name in the card map fails, so it passes undefined to my LargeCardView components in createUsedCards)
          //I'll add them back in one by one later
          // else if(deck.faction == "Monsters")
          //   setMonsterDeck(map);
          // else if(deck.faction == "Skellige")
          //   setSkelligeDeck(map);
          // else if(deck.faction == "Nilfgaard")
          //   setNilfgaardDeck(map);
          // else if(deck.faction == "Scoiatael")
          //   setScoiataelDeck(map);
        }
      } catch (error){
        console.log(error);
      }
    }
    fetchUserDecks();
  },  []);


  return(
    <div className="deckbuilder">
      <h3>DeckBuilder</h3>
      <div className="faction_select">
        <p> (previous faction) </p>
        <p> {currentFaction} </p>
        <p> (next faction) </p>
      </div>
      <div className="grid">
        <div className="one">
          <p>(filters)</p>
          <p>Available Cards</p>
          <div className="card_panel">
            {createAvailableCards()}
          </div>
        </div>
        <div className="two">
          <p>leader</p>
          <h3>leader card</h3>
          <p>total cards in deck</p>
          <p>{totalCardCount}</p>
          <p>number of unit cards</p>

          {unitCardCount >= 22 ? <p style={{color:"green"}}>{unitCardCount}</p> : <p style={{color:"red"}}>{unitCardCount}/22</p>}

          <p>special cards</p>

          {specialCardCount <= 10 ? <p style={{color:"green"}}>{specialCardCount}/10</p> : <p style={{color:"red"}}>{specialCardCount}/10</p>}
          
          <p>total unit card strength</p>
          <p>{totalUnitStrength}</p>
          <p>hero cards</p>
          <p>{heroCardCount}</p>

          <button id="save_button" onClick={saveCurrentDeck}> Save current deck </button>


        </div>
        <div className="three">
          <p>(filters)</p>
          <p>Cards in Deck</p>
          <div className="card_panel">
            {createUsedCards()}
          </div>
        </div>
      </div>
    </div>
  );
}
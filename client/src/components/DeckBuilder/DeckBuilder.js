import './DeckBuilder.css';
import React, { useState, useEffect } from 'react';
import { useAuthHeader } from 'react-auth-kit';

import {CardView, CardData} from '../Card/Card';


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
  const [cardMap, setCardMap] = useState();
  const [currentFaction, setCurrentFaction] = useState("Northern Realms");
  const [currentDeck, setCurrentDeck] = useState(new Map());
  const [northernRealmsDeck, setNorthernRealmsDeck] = useState(currentDeck);
  const [nilfgaardDeck, setNilfgaardDeck] = useState(new Map());
  const [scoiataelDeck, setScoiataelDeck] = useState(new Map());
  const [monsterDeck, setMonsterDeck] = useState(new Map());
  const [skelligeDeck, setSkelligeDeck] = useState(new Map());


  function nextFaction(){
    if(currentFaction == "Northern Realms")
      setCurrentFaction("Monsters");
    else if(currentFaction == "Monsters")
      setCurrentFaction("Skellige");
    else if(currentFaction == "Skellige")
      setCurrentFaction("Nilfgaard");
    else if(currentFaction == "Nilfgaard")
      setCurrentFaction("Scoiatael");
    else if(currentFaction == "Scoiatael")
      setCurrentFaction("Northern Realms");
  }
  
  function previousFaction(){
    if(currentFaction == "Northern Realms")
      setCurrentFaction("Scoiatael");
    else if(currentFaction == "Scoiatael")
      setCurrentFaction("Nilfgaard");
    else if(currentFaction == "Nilfgaard")
      setCurrentFaction("Skellige");
    else if(currentFaction == "Skellige")
      setCurrentFaction("Monsters");
    else if(currentFaction == "Monsters")
      setCurrentFaction("Northern Realms");
  }
  
  function addCardToDeck(cardData){
    if(currentDeck.has(cardData.name) && currentDeck.get(cardData.name) == cardData.available){
      console.log("error! maximum number of card " + cardData.name + " already in deck!");
    }
    else {
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
  }
  
  function removeCardFromDeck(cardData){
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
        if(i !== 1){
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
            if(i !== 1){
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
        result = await result.json();
        console.log(result);
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
            
          </div>
        </div>
        <div className="two">
          <p>leader</p>
          <h3>leader card</h3>
          <p>total cards in deck</p>
          <p>(#)</p>
          <p>number of unit cards</p>
          <p>(#)</p>
          <p>special cards</p>
          <p>(#)/10</p>
          <p>hero cards</p>
          <p>(#)</p>

          <button> Start Game </button>


        </div>
        <div className="three">
          <p>(filters)</p>
          <p>Cards in Deck</p>
          <div className="card_panel">
            
          </div>
        </div>
      </div>
    </div>
  );
}
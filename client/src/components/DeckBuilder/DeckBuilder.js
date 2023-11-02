import './DeckBuilder.css';
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuthHeader } from 'react-auth-kit';
import {useNavigate} from "react-router-dom";

import {getCardData} from '../GwentClient/GwentClient';
import {LargeCardView, CardData} from '../Card/Card';

//this class is a little weird, but I need to make new objects everytime for React to notice my state changes, and this seemed like a good way to do it
//also, I should maybe include a field for the faction, but right now it's easier to track that separately and add it when I save decks to the database
export class GwentDeck {
  constructor(deck){
    if(!deck){
      this.cards = new Map();
      this.heroCount = 0;
      this.specialCount = 0;
      this.unitCount = 0;
      this.totalCardCount = 0;
      this.totalUnitStrength = 0;
      this.leaderName = "Foltest, King of Temeria";
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
}


/*
So, my approach is as follows:
1)load all the card data into a cardMap
2)track currentFaction, currentDeck, and 1 deck per faction
3)load the left panel (available cards) by looking at the cardMap, currentFaction, and currentDeck
4)load the right panel by looking at the currentDeck
5)when a user clicks a card in the left panel
  - check if there is already the max # of that card in the current deck. if so, do nothing
  - if there is less than the max #, add 1 to that card in the deck, and make a new deck object from the old deck object. set current deck equal to the new deck
  - finally, set the respective faction deck equal to the new current deck. this will save changes if a user switches factions later

6)when a user clicks a card in the right panel
  - if there are 0 in the deck there shouldn't be a card showing in the right panel, but I will check that first just in case
  - then, subtract 1 from that card in the current deck, and a make a new deck object from the old deck object. set current deck equal to the new deck
  - finally, set the respective faction deck equal to the new current deck. same reason as above

7)when a user switches factions
  - update currentFaction, then set currentDeck equal to the respective faction deck

8)also, I don't have images for the skellige deck yet, so that is TODO for now / maybe forever
*/


export default function DeckBuilder({socket}) {
  const authHeader = useAuthHeader();
  const navigate = useNavigate();
  const [cardMap, setCardMap] = useState(new Map());
  const [currentFaction, setCurrentFaction] = useState("Northern Realms");
  const [currentDeck, setCurrentDeck] = useState(new GwentDeck());
  const [northernRealmsDeck, setNorthernRealmsDeck] = useState(currentDeck);
  const [nilfgaardDeck, setNilfgaardDeck] = useState(new GwentDeck());
  const [scoiataelDeck, setScoiataelDeck] = useState(new GwentDeck());
  const [monsterDeck, setMonsterDeck] = useState(new GwentDeck());
  const [skelligeDeck, setSkelligeDeck] = useState(new GwentDeck());

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
    return (() => {
      if(currentDeck.cards.has(cardData.name) && currentDeck.cards.get(cardData.name) == cardData.available){
        console.log("error! maximum number of card " + cardData.name + " already in deck!");
      }
      else {
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
        
        //I was going to use another map, faction decks, with all the decks in it
        //but since state is supposed to immutable, I think this is better, and will cause less re-renders... I think...
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

      let used = currentDeck.cards.has(keyy) ? currentDeck.cards.get(keyy) : 0;
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
                      />)
    }
    return cardViews;
  }

  async function saveCurrentDeck(){
    let button = document.getElementById("save_button");
    button.disabled = true;
    try {
      let cards = Object.fromEntries(currentDeck.cards.entries());
      let result = await fetch(process.env.REACT_APP_BACKEND_URL + "saveUserDeck", {
        method: 'POST',
        headers: {
          "Authorization": authHeader().split(" ")[1],
          "Accept": 'application/json',
          "Content-Type": 'application/json'
        },
        //I am not including the count fields here, because I will calculate those on the server, in case someone trys to cheat
        body: JSON.stringify({
          "faction": currentFaction,
          "leaderName": currentDeck.leaderName,
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


  //uses getCardData function from GwentClient class
  //then loads the users decks from the server (or the default decks if the user has no saved decks, handled by server-side logic)
  useEffect(() => {
    getCardData(setCardMap, authHeader);

    const fetchUserDecks = async () => {
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
    fetchUserDecks();
  },  []);


  return(
    <div className="deckbuilder">
      <h3>DeckBuilder</h3>
      <div className="faction_select">
        <button onClick={previousFaction}> previous faction </button>
        <p> {currentFaction} </p>
        <button onClick={nextFaction}> next faction </button>
      </div>
      <div className="deckbuilder_grid">
        <div className="one">
          <p>(filters)</p>
          <p>Available Cards</p>
          <div className="card_panel">
            {createAvailableCards()}
          </div>
        </div>
        <div className="two">
          <p>Leader</p>
          <h3>{currentDeck.leaderName}</h3>
          <p>Total cards in deck</p>
          <p>{currentDeck.totalCardCount}</p>
          <p>Number of Unit Cards</p>

          {currentDeck.unitCount >= 22 ? <p style={{color:"green"}}>{currentDeck.unitCount}</p> : <p style={{color:"red"}}>{currentDeck.unitCount}/22</p>}

          <p>Special Cards</p>

          {currentDeck.specialCount <= 10 ? <p style={{color:"green"}}>{currentDeck.specialCount}/10</p> : <p style={{color:"red"}}>{currentDeck.specialCount}/10</p>}
          
          <p>Total Unit Card Strength</p>
          <p>{currentDeck.totalUnitStrength}</p>
          <p>Hero Cards</p>
          <p>{currentDeck.heroCount}</p>

          {!roomName ? <button onClick={saveCurrentDeck}> Save current deck </button> : <button> Ready (use this deck) </button>}


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
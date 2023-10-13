import './DeckBuilder.css';
import React, { useState, useEffect } from 'react';
import { useAuthHeader } from 'react-auth-kit';

//import {CardView, } from '../Card/Card';

class CardData {
  constructor(name, image_url, type, faction, strength, range, special, available, description){
    this.name = name;
    this.image_url = image_url;
    this.type = type;
    this.faction = faction;
    this.strength = strength;
    this.range = range;
    this.special = special;
    this.available = available;
    this.description = description;
  }
}



export default function DeckBuilder() {
  const cardMap = new Map();
  const authHeader = useAuthHeader();
  const [currentFaction, setCurrentFaction] = useState("Northern Realms");
  const [deck, setDeck] = useState();


  //checks for cardRows in localStorage
  //if it's there already, use that data to build the map
  //otherwise, pull it from the server, save it to localStorage for later, and then build the map
  //(I need to build the map inside the async function, so there's a little duplicate code here)
  //I also need to load the user decks here
  useEffect(() => {
    let cardRows;
    if(localStorage.hasOwnProperty("cardRows")){
      cardRows = JSON.parse(localStorage.getItem("cardRows"));
      cardRows.forEach((row, i) => {
        if(i !== 1){
          let card = new CardData(row[0], row[1], row[2], row[3], row[4], row[5], row[6], row[7], row[8], row[9]);
          cardMap.set(row[0], card);
        }
      });
    }
    else {
      const fetchCardData = async () => {
        try {
          let result = await fetch("http://localhost:5000/getCardData", {
            headers: {"Authorization": authHeader().split(" ")[1]}
          });
          cardRows = await result.json();
          localStorage.setItem("cardRows", JSON.stringify(cardRows));
          cardRows.forEach((row, i) => {
            if(i !== 1){
              let card = new CardData(row[0], row[1], row[2], row[3], row[4], row[5], row[6], row[7], row[8], row[9]);
              cardMap.set(row[0], card);
            }
          });
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
  });


  return(<h2>DeckBuilder</h2>);
}


  // constructor(props){
  //   super(props);

  //   this.card1 = new CardData("gerald", "creature", 10, "melee", "none", "none");
  //   this.card2 = new CardData("foot soldier", "creature", 1, "melee", "none", "none");
  //   this.card3 = new CardData("medic", "creature", 1, "siege", "medic", "none");
  //   this.card4 = new CardData("sunny day", "weather", -1, "none", "sunny day", "none");
  // }

//   render(){ 
//     return (
//       <div className="deckbuilder">
//         <h3>DeckBuilder</h3>
//         <div className="faction_select">
//           <p> (previous faction) </p>
//           <p> (current faction) </p>
//           <p> (next faction) </p>
//         </div>
//         <div className="grid">
//           <div className="one">
//             <p>(filters)</p>
//             <p>Available Cards</p>
//             <div className="card_panel">
//               <CardView card={this.card1} />
//               <CardView card={this.card2} />
//             </div>
//           </div>
//           <div className="two">
//             <p>leader</p>
//             <h3>leader card</h3>
//             <p>total cards in deck</p>
//             <p>(#)</p>
//             <p>number of unit cards</p>
//             <p>(#)</p>
//             <p>special cards</p>
//             <p>(#)/10</p>
//             <p>hero cards</p>
//             <p>(#)</p>

//             <button> Start Game </button>


//           </div>
//           <div className="three">
//             <p>(filters)</p>
//             <p>Cards in Deck</p>
//             <div className="card_panel">
//               <CardView card={this.card3} />
//               <CardView card={this.card4} />
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   }
// }

// class CardPanel extends React.Component {
//   render(){
//     return (
//       <div className="card_panel">
        


//       </div>
//     );
//   }
// }
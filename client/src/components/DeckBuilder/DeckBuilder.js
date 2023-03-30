import './DeckBuilder.css';
import React from 'react';

import {CardView, CardData} from '../Card/Card';


class DeckBuilder extends React.Component {
  constructor(props){
    super(props);

    this.card1 = new CardData("gerald", "creature", 10, "melee", "none", "none");
    this.card2 = new CardData("foot soldier", "creature", 1, "melee", "none", "none");
    this.card3 = new CardData("medic", "creature", 1, "siege", "medic", "none");
    this.card4 = new CardData("sunny day", "weather", -1, "none", "sunny day", "none");
  }

  render(){ 
    return (
      <div className="deckbuilder">
        <h3>DeckBuilder</h3>
        <div className="faction_select">
          <p> (previous faction) </p>
          <p> (current faction) </p>
          <p> (next faction) </p>
        </div>
        <div className="grid">
          <div className="one">
            <p>(filters)</p>
            <p>Available Cards</p>
            <div className="card_panel">
              <CardView card={this.card1} />
              <CardView card={this.card2} />
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
              <CardView card={this.card3} />
              <CardView card={this.card4} />
            </div>
          </div>
        </div>
      </div>
    );
  }
}

class CardPanel extends React.Component {
  render(){
    return (
      <div className="card_panel">
        


      </div>
    );
  }
}

export default DeckBuilder;

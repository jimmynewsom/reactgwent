import './DeckBuilder.css';
import React from 'react';

import {CardView, CardData} from '../Card/Card';


class DeckBuilder extends React.Component {
  constructor(props){
    super(props);

    this.card = new CardData("gerald", "creature", 10, "melee", "none", "none");
  }

  render(){ 
    return (
      <div className="deckbuilder">
        <h3>DeckBuilder</h3>
        <div className="grid">
          <div className="one">
            <p>(filters)</p>
            <p>Available Cards</p>
            <div className="card_panel">
              <CardView card={this.card} />
            </div>
          </div>
          <div className="two">
            <p>leader</p>
            <p>leader card</p>
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
            <p>three</p>
            <p>Cards in Deck</p>
            <div className="card_panel">
              <CardView card={this.card} />
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default DeckBuilder;

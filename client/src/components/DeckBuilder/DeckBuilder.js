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
          <div className="one">One</div>
          <div className="two">
            <p></p>


          </div>
          <div className="three">Three</div>
        </div>


        <CardView card={this.card} />
      </div>
    );
  }
}

export default DeckBuilder;

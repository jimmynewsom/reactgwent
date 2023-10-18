import './Card.css';
import React, {useState} from 'react';

export class CardData {
  constructor(name, image_url, type, faction, strength, range, special, available, description){
    this.name = name;
    this.image_url = image_url;
    this.type = type;
    this.faction = faction;
    this.strength = Number(strength);
    this.range = range;
    this.special = special;
    this.available = Number(available);
    this.description = description;
  }
}

export function LargeCardView ({cardData, handleClick, available}) {

  return(
    <div className="card" onClick={handleClick(cardData)}>
      <p>{cardData.name}</p>
      <p>type: {cardData.type}</p>
      <p>faction: {cardData.faction}</p>
      {cardData.type == "hero" || cardData.type == "unit" ? <><p>{cardData.strength}</p><p>{cardData.range}</p></> : <p></p>}
      {cardData.special != "none" ? <p>{cardData.special}</p> : <p></p>}
      {available ? <p>{available}</p> : <p></p>}
    </div>
  )
}

// function SmallCardView ({cardData}){
//   return <p></p>
// }

// return (
//     <div className="card">
//         <div className="card_img_area">
//             {/* eventually I should fill this href attribute with a img url from my card data, but not today*/}
            
//             <a className="card_img" href="{}"></a>
//             <div className="card_icon_column">

//                 { (this.props.card.type != "creature") ? <p>{this.props.card.type}</p> : <p></p>}
//                 { (this.props.card.strength != -1) ? <p>{this.props.card.strength}</p> : <p></p>}
//                 { (this.props.card.type != "none") ? <p>{this.props.card.range}</p> : <p></p>}
//                 { (this.props.card.type != "special") ? <p>{this.props.card.none}</p> : <p></p>}
//             </div>


//         </div>
//         <div className="card_txt_area">
//             <p className="card_name"> {this.props.card.name} </p>
//             <p className="card_total"> (number available / in deck) </p>
//         </div>
//     </div>)
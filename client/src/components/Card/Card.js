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

export function LargeCardView ({cardData, handleClick, available = 0}) {

  return(
    <div className="large_card" onClick={handleClick(cardData)}>
      <img 
        src={"https://res.cloudinary.com/dli8kk5qz/image/upload/v1698336601/gwent/unit%20cards/" + cardData.image_url}
        alt={"image url is wrong for " + cardData.name + " with image url " + cardData.image_url}
        width="180"
        height="320"
      />
      <div className="available"><p>available: {available}</p></div>
    </div>
  );
  
  // old version
  // return(
  //   <div className="large_card" onClick={handleClick(cardData)}>
  //     <div className="card_img_area"></div>
  //     <div className="card_text_area">
  //       <p>{cardData.name}</p>
  //       <p>type: {cardData.type}</p>
  //       <p>faction: {cardData.faction}</p>
  //       {cardData.type == "hero" || cardData.type == "unit" ? <><p>{cardData.strength}</p><p>{cardData.range}</p></> : <p></p>}
  //       {cardData.special != "none" ? <p>{cardData.special}</p> : <p></p>}
  //       {available ? <p>available: {available}</p> : <p>{cardData.description}</p>}
  //     </div>
  //   </div>
  // );
}

export function SmallCardView ({cardData}){

  return (
    <div className="small_card">
      <img 
        src={"https://res.cloudinary.com/dli8kk5qz/image/upload/v1698336601/gwent/unit%20cards/" + cardData.image_url}
        alt={"image url is wrong for " + cardData.name + " with image url " + cardData.image_url}
        width="60"
        height="100"
      />
    </div>
  );
  }
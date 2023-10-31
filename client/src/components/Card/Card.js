import './Card.css';
import React from 'react';

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
        src={process.env.REACT_APP_IMAGE_HOST_BASE_URL + cardData.image_url}
        alt={"image url is wrong for " + cardData.name + " with image url " + cardData.image_url}
        width="180"
        height="320"
      />
      {available ? <div className="available"><p>available: {available}</p></div> : <></>}
    </div>
  );
}

export function SmallCardView ({cardData}){

  return (
    <div className="small_card">
      <img 
        src={process.env.REACT_APP_IMAGE_HOST_BASE_URL + cardData.image_url}
        alt={"image url is wrong for " + cardData.name + " with image url " + cardData.image_url}
        width="40"
        height="60"
      />
    </div>
  );
}
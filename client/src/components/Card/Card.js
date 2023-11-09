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
        src={process.env.REACT_APP_UNIT_IMAGE_BASE_URL + cardData.image_url}
        alt={"image url is wrong for " + cardData.name + " with image url " + cardData.image_url}
        width="180"
        height="320"
      />
      {available ? <div className="available"><p>available: {available}</p></div> : <></>}
    </div>
  );
}

export function SmallCardView ({cardData, handleClick, currentStrength}){
  let strength;
  if(currentStrength || currentStrength == 0){
    if(currentStrength == cardData.strength)
      strength = <p>{currentStrength}</p>
    else if(currentStrength < cardData.strength)
      strength = <p className="weaker_card">{currentStrength}</p>
    else
      strength = <p className="stronger_card">{currentStrength}</p>
  }

  return (
    <div className="small_card" onClick={handleClick ? handleClick : ()=>{}}>
      {currentStrength || currentStrength == 0 ? <>{strength}</> : <></>}
      <img 
        src={process.env.REACT_APP_UNIT_IMAGE_BASE_URL + cardData.image_url}
        alt={"image url is wrong for " + cardData.name + " with image url " + cardData.image_url}
        width="40"
        height="60"
      />
    </div>
  );
}
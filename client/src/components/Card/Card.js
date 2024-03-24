import './Card.scss';
import React from 'react';

export class CardData {
  constructor(name, image_url, type, faction, strength, range, special, available, description) {
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

export class LeaderCardData {
  constructor(name, image_url, faction, desc, ability_description){
    this.name = name;
    this.image_url = image_url;
    this.faction = faction;
    this.desc = desc;
    this.ability_description = ability_description;
  }
}

export function LargeCardView({ cardData, handleClick, available = 0 }) {

  return (
    <div className="large-card" onClick={() => handleClick(cardData)}>
      <div className="large-card-image">
        <img
          src={process.env.REACT_APP_UNIT_IMAGE_BASE_URL + cardData.image_url}
          alt={"image url is wrong for " + cardData.name + " with image url " + cardData.image_url}
          width="180"
          height="320"
        />
      </div>
      <div className="large-card-availability">
        {available ? <div className="available"><p>Available: {available}</p></div> : <></>}
      </div>
    </div>
  );
}

export function SmallCardView({ cardData, handleClick, currentStrength }) {
  let strength;
  if (currentStrength || currentStrength == 0) {
    if (currentStrength == cardData.strength)
      strength = <p>{currentStrength}</p>
    else if (currentStrength < cardData.strength)
      strength = <p className="weaker-card">{currentStrength}</p>
    else
      strength = <p className="stronger-card">{currentStrength}</p>
  }

  return (
    <div className="small-card" onClick={handleClick ? handleClick : () => { }}>
      {currentStrength || currentStrength == 0 ? <>{strength}</> : <p></p>}
      <img
        src={process.env.REACT_APP_UNIT_IMAGE_BASE_URL + cardData.image_url}
        alt={"image url is wrong for " + cardData.name + " with image url " + cardData.image_url}
        width="40"
        height="60"
      />
    </div>
  );
}

export function LeaderCardView({ leaderCardData, width = 180, height = 320 }) {

  return (
    <div className="leader-card">
      <div className="leader-card-image">
        <img
          src={process.env.REACT_APP_LEADER_IMAGE_BASE_URL + leaderCardData.image_url}
          alt={"image url is wrong for " + leaderCardData.name + " " + leaderCardData.title + " with image url " + leaderCardData.image_url}
          width={width}
          height={height}
        />
      </div>
    </div>
  );
}
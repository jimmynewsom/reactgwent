import React, { useState, useEffect } from 'react';
import { useAuthHeader } from 'react-auth-kit';

import {LargeCardView, CardData} from '../Card/Card';


// class GwentBoard{
//   constructor(){
    
//   }
// }


export function getCardData(setcardmap, authheader) {
  let cardRows;
  if(localStorage.hasOwnProperty("cardRows")){
    cardRows = JSON.parse(localStorage.getItem("cardRows"));
    let map = new Map();
    cardRows.forEach((row, i) => {
      if(i !== 0){
        let card = new CardData(row[0], row[1], row[2], row[3], row[4], row[5], row[6], row[7], row[8], row[9]);
        map.set(row[0], card);
      }
    });
    setcardmap(map);
  }
  else {
    const fetchCardData = async () => {
      try {
        let result = await fetch("http://localhost:5000/getCardData", {
          headers: {"Authorization": authheader().split(" ")[1]}
        });
        cardRows = await result.json();
        localStorage.setItem("cardRows", JSON.stringify(cardRows));
        let map = new Map();
        cardRows.forEach((row, i) => {
          if(i !== 0){
            let card = new CardData(row[0], row[1], row[2], row[3], row[4], row[5], row[6], row[7], row[8], row[9]);
            map.set(row[0], card);
          }
        });
        setcardmap(map);
      } catch (error) {
        console.log(error);
      }
    }
    fetchCardData();
  }
}


export default function GwentClient() {
  const authHeader = useAuthHeader();
  const [cardMap, setCardMap] = useState(new Map());


  useEffect(() => {
    getCardData(setCardMap, authHeader);
  }, []);

  return(
    <h2>Gwent Client</h2>
  );

}
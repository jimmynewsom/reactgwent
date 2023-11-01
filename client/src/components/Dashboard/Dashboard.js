import './Dashboard.css';
import React, { useState, useEffect } from 'react';
import { useAuthHeader, useAuthUser } from 'react-auth-kit';

import { connectSocket } from '../App/App';

export default function Dashboard({socket}) {
  const auth = useAuthUser();
  const authHeader = useAuthHeader();
  const [userStats, setUserStats] = useState({wins: "loading", losses: "loading"});
  const [gameList, setGameList] = useState([]);

  async function createGame(){
    try {
      let result = await fetch(process.env.REACT_APP_BACKEND_URL + "gwent/createGame", {
        headers: {"Authorization": authHeader().split(" ")[1]}
      });
      if(result.status == 200){
        console.log("game created successfully. attempting to connect to socket.io game room...");
        connectSocket();
        socket.emit("test", "this is a test");
        //socket.emit("join_game", auth().username);
      }
    } catch (error) {
      console.log(error);
    }
  }



  useEffect(() => {
    const fetchUserData = async () => {
      try {
        let result = await fetch(process.env.REACT_APP_BACKEND_URL + "userStats", {
          headers: {"Authorization": authHeader().split(" ")[1]}
        });
        result = await result.json();
        setUserStats(result);
      } catch (error) {
        console.log(error);
      }
    }
    fetchUserData();
  }, []);

  return(
    <div className="dashboard">
      <h2> Dashboard / Lobby</h2>
      <p> Hello {auth().username} </p>
      <p> wins: {userStats.wins} </p>
      <p> losses: {userStats.losses} </p>
      <button onClick={createGame}> Create Game </button> <button> Join Game </button> <button> Find Game</button>
    </div>
  );
}
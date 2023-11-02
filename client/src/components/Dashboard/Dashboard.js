import './Dashboard.css';
import React, { useState, useEffect } from 'react';
import { useAuthHeader, useAuthUser } from 'react-auth-kit';
import {useNavigate} from "react-router-dom";


export default function Dashboard({socket}) {
  const auth = useAuthUser();
  const authHeader = useAuthHeader();
  const navigate = useNavigate();
  const [userStats, setUserStats] = useState({wins: "loading", losses: "loading"});
  const [gameList, setGameList] = useState([]);
  const [waitingForOpponent, setWaitingForOpponent] = useState(false);


  //mostly finished stuff

  async function createGame(){
    try {
      let result = await fetch(process.env.REACT_APP_BACKEND_URL + "gwent/createGame", {
        headers: {"Authorization": authHeader().split(" ")[1]}
      });
      if(result.status == 200){
        console.log("game created successfully. attempting to connect to socket.io game room...");
        socket.connect();
        setWaitingForOpponent(true);
        await fetchGameList();
      }
    } catch (error) {
      console.log(error);
    }
  }

  function joinGame(opponentName){
    const test = async () => {
      try {
        let result = await fetch(process.env.REACT_APP_BACKEND_URL + "gwent/joinGame/" + opponentName, {
          headers: {"Authorization": authHeader().split(" ")[1]}
        });
        if(result.status == 200){
          console.log("game joined. connecting to socket.io game room...");
          socket.connect();
        }
      } catch (error) {
        console.log(error);
      }
    }
    return test;
  }

  //temporary - for testing only
  async function resetGames(){
    console.log("resetting games");
    try {
      let result = await fetch(process.env.REACT_APP_BACKEND_URL + "gwent/resetGames", {
        headers: {"Authorization": authHeader().split(" ")[1]}
      });
      if(result.status == 200){
        console.log("game reset successfully");
        setWaitingForOpponent(false);
        socket.disconnect();
        await fetchGameList();
      }
    } catch (error) {
      console.log(error);
    }
  }

  function createGamesTable(){
    let gameRows = [];
    for(let game of gameList){
      gameRows.push(
        <tr key={game[0]}>
          <td>{game[0]}</td>
          <td>{game[1] ? game[1] : <button onClick={joinGame(game[0])}>Join Game</button>}</td>
        </tr>
      );
    }

    return(
      <table>
        <thead><tr><th>Host</th><th>Opponent</th></tr></thead>
        <tbody>{gameRows}</tbody>  
      </table>
    );
  }



  //fully finished stuff

  async function fetchUserData(){
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

  async function fetchGameList(){
    console.log("fetching game list");
    try {
      let result = await fetch(process.env.REACT_APP_BACKEND_URL + "gwent/getGameList", {
        headers: {"Authorization": authHeader().split(" ")[1]}
      });
      result = await result.json();
      setGameList(result);
    } catch (error) {
      console.log(error);
    }
  }

  async function checkUserHasGameInProgress(){
    try {
      let result = await fetch(process.env.REACT_APP_BACKEND_URL + "gwent/getGameList", {
        headers: {"Authorization": authHeader().split(" ")[1]}
      });
      result = await result.json();
      console.log(result);
      if(result)
        socket.connect();
    } catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {
    fetchUserData();
    fetchGameList();
    checkUserHasGameInProgress();
  }, []);

  return(
    <div className="dashboard">
      <h2> Dashboard / Lobby </h2>
      <p> Hello {auth().username} </p>
      <p> wins: {userStats.wins} </p>
      <p> losses: {userStats.losses} </p>

      {waitingForOpponent ? <p><b>WAITING FOR OPPONENT TO JOIN GAME</b></p> : <p> </p>}

      <h3> Games in progress: </h3>

      {createGamesTable()}

      <button onClick={createGame}> Create Game </button>
      <button onClick={fetchGameList}> Refresh Game List </button>
      <button onClick={resetGames}> Reset Games (temporary)</button>
    </div>
  );
}
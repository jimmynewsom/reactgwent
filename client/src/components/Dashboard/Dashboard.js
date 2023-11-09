import './Dashboard.scss';
import React, { useState, useEffect } from 'react';
import { useAuthHeader, useAuthUser } from 'react-auth-kit';
import WinLossCount from './WinLossCount';

// Icons
import { FaPlus } from "react-icons/fa6";
import { IoRefreshOutline } from "react-icons/io5";

const instructions = "Game is a pretty simple game."

export default function Dashboard({ socket }) {
  const auth = useAuthUser();
  const authHeader = useAuthHeader();
  const [userStats, setUserStats] = useState({ wins: "loading", losses: "loading" });
  const [gameList, setGameList] = useState([]);
  const [waitingForOpponent, setWaitingForOpponent] = useState(false);


  //mostly finished stuff

  async function createGame() {
    try {
      let result = await fetch(process.env.REACT_APP_BACKEND_URL + "gwent/createGame", {
        headers: { "Authorization": authHeader().split(" ")[1] }
      });
      if (result.status == 200) {
        console.log("game created successfully. connecting to socket.io game room...");
        socket.connect();
        setWaitingForOpponent(true);
        await fetchGameList();
      }
    } catch (error) {
      console.log(error);
    }
  }

  function joinGame(opponentName) {
    const test = async () => {
      try {
        let result = await fetch(process.env.REACT_APP_BACKEND_URL + "gwent/joinGame/" + opponentName, {
          headers: { "Authorization": authHeader().split(" ")[1] }
        });
        if (result.status == 200) {
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
  async function resetGames() {
    console.log("resetting games");
    try {
      let result = await fetch(process.env.REACT_APP_BACKEND_URL + "gwent/resetGames", {
        headers: { "Authorization": authHeader().split(" ")[1] }
      });
      if (result.status == 200) {
        console.log("games reset successfully. disconnecting from socket.io");
        setWaitingForOpponent(false);
        socket.disconnect();
        await fetchGameList();
      }
    } catch (error) {
      console.log(error);
    }
  }

  function createGamesTable() {
    let gameRows = [];
    for (let game of gameList) {
      gameRows.push(
        <tr key={game[0]}>
          <td>{game[0]}</td>
          <td>{game[1] ? game[1] : <button className={`primary-button`} onClick={joinGame(game[0])}>Join Game</button>}</td>
          <td>{game[1] ? "Waiting for players..." : "Game in Progress"}</td>
        </tr>
      );
    }

    return (
      <table>
        <thead><tr><th>Player One</th><th>Player Two</th><th>Status</th></tr></thead>
        <tbody>{gameRows}</tbody>
      </table>
    );
  }



  //fully finished stuff

  async function fetchUserData() {
    try {
      let result = await fetch(process.env.REACT_APP_BACKEND_URL + "userStats", {
        headers: { "Authorization": authHeader().split(" ")[1] }
      });
      result = await result.json();
      setUserStats(result);
    } catch (error) {
      console.log(error);
    }
  }

  async function fetchGameList() {
    console.log("fetching game list");
    try {
      let result = await fetch(process.env.REACT_APP_BACKEND_URL + "gwent/getGameList", {
        headers: { "Authorization": authHeader().split(" ")[1] }
      });
      result = await result.json();
      setGameList(result);
    } catch (error) {
      console.log(error);
    }
  }

  async function checkUserHasGameInProgress() {
    try {
      let result = await fetch(process.env.REACT_APP_BACKEND_URL + "gwent/checkUserHasGameInProgress", {
        headers: { "Authorization": authHeader().split(" ")[1] }
      });
      result = await result.json();
      console.log("inprogress result: " + result.inProgress);
      if (result.inProgress)
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

  return (
    <div className="dashboard">
      <h2 className={`screen-heading`}> Dashboard / Lobby </h2>
      <div className={`container`}>
        <div className={`sidebar`}>
          <h3> Hello, {auth().username}!</h3>
          <div className='wins-and-losses'>
            <h5>Latest stats</h5>
            <WinLossCount label="Wins" count={userStats.wins} />
            <WinLossCount label="Losses" count={userStats.losses} />
          </div>
        </div>

        <div className='main-window'>
          <div className="games-in-progress">
            <div>
              <h3> Games in progress </h3>
              <button className={`icon-button`} onClick={fetchGameList}><IoRefreshOutline />Refresh list</button>
            </div>
            <button className={`primary-button`} onClick={createGame}><FaPlus />Create Game </button>
          </div>

          {createGamesTable()}
          <button className={`secondary-button`} onClick={resetGames}>Reset</button>
        </div>
      </div>
    </div>
  );
}
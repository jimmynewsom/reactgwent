import './Dashboard.css';
import React, { useState, useEffect } from 'react';
import { useAuthHeader, useAuthUser } from 'react-auth-kit';

export default function Dashboard() {
  const auth = useAuthUser();
  const authHeader = useAuthHeader();
  const [userStats, setUserStats] = useState({wins: "loading", losses: "loading"});

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        let result = await fetch("http://localhost:5000/userStats", {
          headers: {"Authorization": authHeader().split(" ")[1]}
        });
        result = await result.json();
        setUserStats(result);
      } catch (error) {
        console.log(error);
      }
    }
    fetchUserData();
  });

  return(
    <div className="dashboard">
      <h2> Dashboard / Lobby</h2>
      <p> Hello {auth().username} </p>
      <p> wins: {userStats.wins} </p>
      <p> losses: {userStats.losses} </p>
      <button> Join Game </button> <button> Create Game </button> <button> Find Game</button>
    </div>
  );
}
import './Dashboard.css';
import React from 'react';

export default function Dashboard() {
  return(
    <div className="dashboard">
      <h2> Dashboard / Lobby</h2>
      <p> Hello (username) </p>
      <p> wins: (wins) </p>
      <p> losses: (losses) </p>
      <button> Join Game </button> <button> Create Game </button> <button> Find Game ?</button>
    </div>
  );
}
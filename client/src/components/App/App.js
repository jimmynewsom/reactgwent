import './App.css';
import React, { useState } from 'react';
import { RequireAuth } from 'react-auth-kit';
import { Route, Routes } from "react-router-dom";

import Dashboard from '../Dashboard/Dashboard';
import LoginRegister from '../LoginRegister/LoginRegister';
import DeckBuilder from '../DeckBuilder/DeckBuilder';
import {CardView, CardData} from '../Card/Card';


function App() {
  return(
    <div className="app-wrapper">
      <h1>React Gwent</h1>

      <nav>
        <ul>
          <li><a href="/">Dashboard</a></li>
          <li><a href="/deckbuilder">DeckBuilder</a></li>
        </ul>
      </nav>

      <Routes>
        <Route path="/" element={
          <RequireAuth loginPath='/loginregister'>
            <Dashboard />
          </RequireAuth>
        }/>
        <Route path="/deckbuilder" element={
          <RequireAuth loginPath='/loginregister'>
            <DeckBuilder />
          </RequireAuth>
        }/>
        <Route path="loginregister" element={<LoginRegister />} />
      </Routes>
    </div>
  );
}


export default App;
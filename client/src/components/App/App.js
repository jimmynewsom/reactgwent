import './App.css';
import React, {useState} from 'react';
import {io} from 'socket.io-client';
import {RequireAuth, useIsAuthenticated, useAuthUser, useSignOut} from 'react-auth-kit';
import {Route, Routes, useNavigate} from "react-router-dom";

import Dashboard from '../Dashboard/Dashboard';
import LoginRegister from '../LoginRegister/LoginRegister';
import DeckBuilder from '../DeckBuilder/DeckBuilder';
import GwentClient from '../GwentClient/GwentClient';
import {CardData, SmallCardView, LargeCardView} from '../Card/Card';


export default function App() {
  const isAuthenticated = useIsAuthenticated();
  const auth = useAuthUser();
  const signOut = useSignOut();
  const navigate = useNavigate();

  let card1 = new CardData("Geralt of Rivia", "geralt_of_rivia.png", "hero", "neutral", "15", "close", "none", "1", "");

  var socket;

  if(isAuthenticated()){
    const SOCKET_URL = process.env.REACT_APP_BACKEND_URL;
    socket = io(SOCKET_URL, {
      autoConnect: false,
      auth: { username: auth().username }
    });

    console.log("new websocket connection");

    socket.on('info_message', (msg) => {console.log(msg);});

    socket.on("redirect", (path) => {
      console.log("redirecting to " + path);
      navigate(path);
    });
  }

  function signOutAndRedirectToLogin(){
    signOut();
    navigate("/loginregister");
  }


  return(
    <div className="app-wrapper">
      <h1>React Gwent</h1>

      <nav>
        <ul>
          <li><a href="/">Dashboard</a></li>
          <li><a href="/deckbuilder">DeckBuilder</a></li>
          {isAuthenticated() ? <button onClick={signOutAndRedirectToLogin}>Sign Out</button> : <></>}
        </ul>
      </nav>

      <Routes>
        <Route path="/" element={
          <RequireAuth loginPath='/loginregister'>
            <Dashboard socket={socket}/>
          </RequireAuth>
        }/>
        <Route path="/deckbuilder" element={
          <RequireAuth loginPath='/loginregister'>
            <DeckBuilder socket={socket}/>
          </RequireAuth>
        }/>
        <Route path="/deckbuilder/:roomName" element={
          <RequireAuth loginPath='/loginregister'>
            <DeckBuilder socket={socket}/>
          </RequireAuth>
        }/>
        <Route path="/gwent" element={
          <RequireAuth loginPath='/loginregister'>
            <GwentClient socket={socket}/>
          </RequireAuth>
        }/>
        <Route path="/loginregister" element={<LoginRegister />} />

        <Route path="/smallcardview" element={<SmallCardView cardData={card1} currentStrength={10}/>} />
        <Route path="/largecardview" element={<LargeCardView cardData={card1} handleClick={() => console.log("nothing")}/>} />
      </Routes>
    </div>
  );
}
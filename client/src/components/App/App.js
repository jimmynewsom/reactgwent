import './App.scss';
import React from 'react';
import {io} from 'socket.io-client';
import {RequireAuth, useIsAuthenticated, useAuthHeader, useSignOut} from 'react-auth-kit';
import {Route, Routes, useNavigate} from "react-router-dom";

import Dashboard from '../Dashboard/Dashboard';
import LoginRegister from '../LoginRegister/LoginRegister';
import DeckBuilder from '../DeckBuilder/DeckBuilder';
import GwentClient from '../GwentClient/GwentClient';
import {CardData, SmallCardView, LargeCardView} from '../Card/Card';


export default function App() {
  const isAuthenticated = useIsAuthenticated();
  const authHeader = useAuthHeader();
  const signOut = useSignOut();
  const navigate = useNavigate();

  let card1 = new CardData("Geralt of Rivia", "geralt_of_rivia.png", "hero", "neutral", "15", "close", "none", "1", "");

  var socket;

  if(isAuthenticated()){
    const SOCKET_URL = process.env.REACT_APP_BACKEND_URL;
    socket = io(SOCKET_URL, {
      autoConnect: false,
      auth: { "Authorization": authHeader().split(" ")[1] }
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
      <div className={`sidebar ${!isAuthenticated() ? 'logged-out' : 'logged-in'}`}>
        <img src="/logo.webp" width="300" height="300" />

        {isAuthenticated() &&
          <nav>
            <ul>
              <div className='tabs'>
                <li><a href="/">Dashboard</a></li>
                <li><a href="/deckbuilder">DeckBuilder</a></li>
              </div>
              <button onClick={signOutAndRedirectToLogin}>Sign Out</button>
            </ul>
          </nav>
        }
      </div>

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
      <footer>This is an unofficial, fan made game for demonstration purposes only, and is in no way endorsed by CD PROJEKT RED. It can also only play a maximum of 5 games at a time.</footer>
    </div>
  );
}
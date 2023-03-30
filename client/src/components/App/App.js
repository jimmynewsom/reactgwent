import './App.css';
import React from 'react';
//import ReactDOM from "react-dom/client";
import { Route, Routes, Link } from "react-router-dom";

import Dashboard from '../Dashboard/Dashboard';
import Login from '../Login/Login';
import DeckBuilder from '../DeckBuilder/DeckBuilder';
import {CardView, CardData} from '../Card/Card';


class App extends React.Component {
  render(){    
    return (
      <div className="app-wrapper">
        <h1>React Gwent</h1>

        <nav>
          <ul>
            <li><Link to="/">Dashboard</Link></li>
            <li><Link to="/deckbuilder">DeckBuilder</Link></li>
          </ul>
        </nav>

        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/deckbuilder" element={<DeckBuilder />} />
        </Routes>
      </div>
    );
  }
}

export default App;



//const [token, setToken] = useState();

  // if(!token) {
  //   return <Login setToken={setToken} />
  // }
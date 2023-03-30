import './App.css';
import React from 'react';
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Dashboard from '../Dashboard/Dashboard';
import Login from '../Login/Login';
import DeckBuilder from '../DeckBuilder/DeckBuilder';
import {CardView, CardData} from '../Card/Card';


class App extends React.Component {
  render(){    
    return (
      <div className="app-wrapper">
        <h1>React Gwent</h1>

        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Dashboard />}>
              <Route index element={<Home />} />
              <Route path="blogs" element={<Blogs />} />
              <Route path="contact" element={<Contact />} />
              <Route path="*" element={<NoPage />} />
            </Route>
          </Routes>
        </BrowserRouter>

        <DeckBuilder />
      </div>
    );
  }
}

export default App;



//const [token, setToken] = useState();

  // if(!token) {
  //   return <Login setToken={setToken} />
  // }
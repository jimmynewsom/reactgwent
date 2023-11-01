import React from 'react';
import ReactDOM from 'react-dom/client';
import { AuthProvider } from 'react-auth-kit';
import { BrowserRouter } from 'react-router-dom';
import './index.css';

import App from './components/App/App';

//I think if I import my socket here, it won't get reimported when my App component re-renders,
//so I can reuse one connection for the whole app
import {socket} from "./socket";

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <AuthProvider
        authType = {'cookie'}
        authName={'_auth'}
        cookieDomain={window.location.hostname}
        cookieSecure={false}
    >
      <BrowserRouter>
        <App socket={socket}/>
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
);
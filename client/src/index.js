import React from 'react';
import ReactDOM from 'react-dom/client';
import AuthProvider from 'react-auth-kit';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
//import reportWebVitals from './reportWebVitals';

import App from './components/App/App'

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
        <App />
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
//reportWebVitals();

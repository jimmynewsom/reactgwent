import React, { useState } from 'react';
import PropTypes from 'prop-types';
import './Login.css';



export default function Login({ setToken }) {
  const [username, setUsername] = useState();
  const [password, setPassword] = useState();

  return(
    <div className="login-wrapper">
      <h2>Login</h2>
      <form>
        <label>
          <p>Username: </p>
          <input type="text" onChange={e => setUsername(e.target.value)} />
        </label>
        <label>
          <p>Password: </p>
          <input type="password" onChange={e => setPassword(e.target.value)} />
        </label>
        <div>
          <button id="login">Login</button>
          <button id="register">Register</button>
        </div>
      </form>
    </div>
  );
}

Login.PropTypes = {setToken: PropTypes.func.isRequired};
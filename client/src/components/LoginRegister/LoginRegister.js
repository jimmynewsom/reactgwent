import React, { useState } from 'react';
import { useSignIn } from 'react-auth-kit';
import './LoginRegister.css';

function login(){
  console.log("login button clicked");
}

function register(){
  console.log("register button clicked");
}

export default function LoginRegister({ setToken }) {
  //const signIn = useSignIn();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

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
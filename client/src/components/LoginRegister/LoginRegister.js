import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSignIn } from 'react-auth-kit';
import './LoginRegister.css';


export default function LoginRegister({ setToken }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const signIn = useSignIn();
  const navigate = useNavigate();


  async function login(){
    console.log("login button clicked");
    let login = document.getElementById("login");
    login.disabled = true;
    let register = document.getElementById("register");
    register.disabled = true;
  
    try {
      let result = await fetch("http://localhost:5000/login", {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: username,
          password: password
        })
      });

      result = await result.json();
      console.log(result);

      signIn({
        token: result.token,
        tokenType: "Bearer",
        expiresIn: 1440,
        authState: {username: result.username}
      });

      navigate("/");
    }
    catch (error) {
      console.log(error);
    }

    login.disabled = false;
    register.disabled = false;
  }

  async function register(){
    console.log("register button clicked");
    let login = document.getElementById("login");
    login.disabled = true;
    let register = document.getElementById("register");
    register.disabled = true;
  
    try {
      let result = await fetch("http://localhost:5000/register", {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: username,
          password: password
        })
      });

      result = await result.json();
      console.log(result);

      signIn({
        token: result.token,
        tokenType: "Bearer",
        expiresIn: 1440,
        authState: {username: result.username}
      });

      navigate("/");
    }
    catch (error) {
      console.log(error);
    }

    login.disabled = false;
    register.disabled = false;
  }

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
          <button id="login" onClick={login}>Login</button>
          <button id="register" onClick={register}>Register</button>
        </div>
      </form>
    </div>
  );
}
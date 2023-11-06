import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSignIn } from 'react-auth-kit';
import './LoginRegister.scss';


//TODO - add flash messages for login and registration successes and failures



export default function LoginRegister({ setToken }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [showToastMessage, setShowToastMessage] = useState(false);
  const signIn = useSignIn();
  const navigate = useNavigate();


  async function login(){
    console.log("login button clicked");
    let login = document.getElementById("login");
    login.disabled = true;
    let register = document.getElementById("register");
    register.disabled = true;
  
    try {
      let result = await fetch(process.env.REACT_APP_BACKEND_URL + "login", {
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

      if(result.status != 200){
        console.error("error logging in! username/password invalid");
        setToastMessage("error logging in! username/password invalid");
        setShowToastMessage(true);
        setTimeout(()=>{setShowToastMessage(false)}, 3000);
        login.disabled = false;
        register.disabled = false;
      }
      else {
        result = await result.json();
        //console.log(result);

        setToastMessage("Signing in...");
        setShowToastMessage(true);
        setTimeout(()=> {
          signIn({
            token: result.token,
            tokenType: "Bearer",
            expiresIn: 1440,
            authState: {username: result.username}
          });

          navigate("/");
        
        }, 1000);
      }
    }
    catch (error) {
      console.log(error);
      login.disabled = false;
      register.disabled = false;
    }
  }

  async function register(){
    console.log("register button clicked");
    let login = document.getElementById("login");
    login.disabled = true;
    let register = document.getElementById("register");
    register.disabled = true;
  
    try {
      let result = await fetch(process.env.REACT_APP_BACKEND_URL + "register", {
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

      if(result.status != 201){
        console.error("username already exists, please enter a different username");
        setToastMessage("username already exists, please enter a different username");
        setShowToastMessage(true);
        setTimeout(()=>{setShowToastMessage(false)}, 3000);
        login.disabled = false;
        register.disabled = false;
      }
      else {
        result = await result.json();
        //console.log(result);

        setToastMessage("Registration successful! Redirecting to dashboard");
        setShowToastMessage(true);
        setTimeout(() => {
          signIn({
            token: result.token,
            tokenType: "Bearer",
            expiresIn: 1440,
            authState: {username: result.username}
          });

          navigate("/");
        }, 1000);
      }
    }
    catch (error) {
      console.log(error);
      login.disabled = false;
      register.disabled = false;
    }
  }

  return(
    <div className="login_wrapper">
      <h2>Login</h2>
      <form>
        <div>
          <label>Username: </label>
          <input type="text" onChange={e => setUsername(e.target.value)} />
        </div>
        <br />
        <div>
          <label>Password: </label>
          <input type="password" onChange={e => setPassword(e.target.value)} />
        </div>
        <div className={'login-button'}>
          <button id="login" onClick={login}>{showToastMessage ? toastMessage : "Login" }</button>
        </div>        
      </form>
      <hr />
      <button id="register" onClick={register}>Register as a new user</button>
    </div>
  );
}
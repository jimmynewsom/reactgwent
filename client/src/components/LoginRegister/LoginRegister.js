import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSignIn } from 'react-auth-kit';
import './LoginRegister.scss';


//TODO - add flash messages for login and registration successes and failures



export default function LoginRegister({ setToken }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginSuccessMessage, setLoginSuccessMessage] = useState("");
  const [signupSuccessMessage, setSignupSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showLoginSuccessMessage, setShowLoginSuccessMessage] = useState(false);
  const [showSignupSuccessMessage, setShowSignupSuccessMessage] = useState(false);
  const [showErrorMessage, setShowErrorMessage] = useState(false);
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
        console.error("Username or password invalid");
        setErrorMessage("Username or password invalid");
        setShowErrorMessage(true);
        setTimeout(()=>{setShowErrorMessage(false)}, 3000);
        login.disabled = false;
        register.disabled = false;
      }
      else {
        result = await result.json();
        //console.log(result);

        setLoginSuccessMessage("Signing in...");
        setShowLoginSuccessMessage(true);
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
        setErrorMessage("username already exists, please enter a different username");
        setShowErrorMessage(true);
        setTimeout(()=>{setShowErrorMessage(false)}, 3000);
        login.disabled = false;
        register.disabled = false;
      }
      else {
        result = await result.json();
        //console.log(result);

        setSignupSuccessMessage("Registration successful! Redirecting to dashboard");
        setShowSignupSuccessMessage(true);
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
      <span className={`error`}>{errorMessage}</span>
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
          <button className={`primary-button`} id="login" onClick={login}>{showLoginSuccessMessage ? loginSuccessMessage : "Login" }</button>
        </div>        
      </form>
      <hr />
      <button className={`secondary-button`} id="register" onClick={register}>{showSignupSuccessMessage ? signupSuccessMessage : "Register as a new user"}</button>
    </div>
  );
}
import axios from "axios";
import React, { SyntheticEvent, useEffect, useState } from "react";
import { Navigate } from "react-router";
import background from "../../assets/the_pong.png";
import './Auth.css'
import 'bootstrap/dist/css/bootstrap.min.css';
import { Button } from 'react-bootstrap';

const SignIn = () =>
{
    const [tfaCode, setTfaCode] = useState("");
    const [redirect, setRedirect] = useState(false);

    const submit = async (e: SyntheticEvent) => {
        e.preventDefault();
        await axios.post("/auth/tfa", {tfaCode: tfaCode}).then(() => {
            setRedirect(true);
        }).catch(() => {
          window.alert(`There was an error`);
        }
        );
    }

  if (redirect) {
    return <Navigate to={'/profile'} />
  }

  const handleChange = (event: any) => {
    setTfaCode(event.target.value);
  }

  return(
 
    <div className="tfa-container" style={{backgroundImage: `url(${background})`}}>
    <form className="tfa-form" onSubmit={submit}>
    <input
          style={{width: '250px'}}
          className="username input"
          type="string"
          name="username"
          placeholder={'two factor authentication code'}
          value={tfaCode}
          onChange={handleChange}
        />
        <br />
        <Button className="btn btn-light" type="submit">
          <h1>
            <b>sendCode</b>
          </h1>
        </Button>
    </form>
    </div>
  );
}

export default SignIn;


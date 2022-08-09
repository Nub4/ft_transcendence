import axios from "axios";
import React, { SyntheticEvent, useEffect, useState } from "react";
import { Navigate } from "react-router";
import background from "../../assets/the_pong.png";
// import 'bootstrap/dist/css/bootstrap.min.css';
import { Button } from 'react-bootstrap';
import './SignIn.css';
import { Socket } from "socket.io-client";

type Props = {
  socket: Socket | null,
};

const SignIn = ({socket}: Props) =>
{
    const [redirectTFA, setRedirectTFA] = useState(false);
    const [redirect, setRedirect] = useState(false);
    const [error, setError] = useState(false);

    const submit = async (e: SyntheticEvent) => {
      e.preventDefault();
      let myWindow = window.open('http://' + process.env.REACT_APP_HOST + ':3000/auth/42');
      const interval = setInterval(async () => {
        if (getCookie("access_token") !== null) {   
          try {
            const {data} = await axios.get('user');
            if (data.tfaEnabled === false)
            {
              setRedirect(true);
              myWindow?.close();
              clearInterval(interval);
            }
          }
          catch (e:any) {
            if (e.response.status === 400)
            {
              setRedirectTFA(true);
              myWindow?.close();
              clearInterval(interval);
            }
          }
        }
      }, 1000);
    }

  useEffect(() => {
  }, []);

  function getCookie(name: string): string | null {
    const nameLenPlus = (name.length + 1);
    return document.cookie
      .split(';')
      .map(c => c.trim())
      .filter(cookie => {
        return cookie.substring(0, nameLenPlus) === `${name}=`;
      })
      .map(cookie => {
        return decodeURIComponent(cookie.substring(nameLenPlus));
      })[0] || null;
  }
  
  if (redirect) {
    return <Navigate to={'/profile'} />
  }

  if (redirectTFA) {
    return <Navigate to={'/auth/tfa'} />
  }

  return(
    // <Card bg="dark">
    // <Card.Img src={background} height={400} />
    // <Card.Body>
    <div className="signin-container" style={{backgroundImage: `url(${background})`}}>
    <form className="signin-form" onSubmit={submit} style={{alignContent: 'center'}}>
        <Button className="btn btn-light" type="submit">
          <h1>
            <b>42 SignIn</b>
          </h1>
        </Button>
    </form>
    </div>
    // </Card.Body>
// </Card>
  );
}

export default SignIn;


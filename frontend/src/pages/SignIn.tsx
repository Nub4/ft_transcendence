import axios from "axios";
import React, { SyntheticEvent, useEffect, useState } from "react";
import { Navigate } from "react-router";
import background from "../assets/the_pong.png";
import 'bootstrap/dist/css/bootstrap.min.css';
import { Button, Card } from 'react-bootstrap';

const SignIn = () =>
{
    const [redirect, setRedirect] = useState(false);

    const submit = async (e: SyntheticEvent) => {
        e.preventDefault();

        const myWindow = window.open('http://localhost:3000/auth/42');
        
        const interval = setInterval(async () => {
            try {
                const {data} = await axios.get('user');
                myWindow?.close();
                setRedirect(true);
                clearInterval(interval);
            } catch (e) {
                console.log(e);
            }
        }, 1000);
    }

    if (redirect)
    {
        return <Navigate to={'/'} />
    }

    return(
        <Card bg="dark">
            <Card.Img src={background} height={400} />
            <Card.Body>
            <div className="col-md-12 text-center">
            <form onSubmit={submit}>
                <Button style={{ width: '250px', height: '100px', backgroundColor: 'white', color: 'black', border: '2px solid black' }}
                type="submit"><h1><b><mark>42 SignIn</mark></b></h1></Button>
            </form>
            </div>
            </Card.Body>
        </Card>
    );
}

export default SignIn;


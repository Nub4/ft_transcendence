import React, { useEffect, useState } from "react";
import Wrapper from "../../components/Wrapper";
import 'bootstrap/dist/css/bootstrap.min.css';
import { Card } from 'react-bootstrap';
import winnerImage from '../../assets/winner.png';
import { Navigate } from "react-router";

type Props = {
    winner: string,
};

const GameFinished = ({winner}: Props) =>
{

    if (winner === "") {
        return <Navigate to={'/profile'} />
    }

    return(
        <Wrapper>
            <Card>
                <Card.Img src={winnerImage} />
                <Card.Body>
                    <div className="col-md-12 text-center">
                        <h1>{winner}</h1>
                    </div>
                </Card.Body>
            </Card>
        </Wrapper>
    );
}

export default GameFinished;
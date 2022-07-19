import React from "react";
import Wrapper from "../../components/Wrapper";
import 'bootstrap/dist/css/bootstrap.min.css';
import { Card } from 'react-bootstrap';
import winnerImage from '../../assets/winner.png';

type Props = {
    winner: string,
};

const GameFinished = ({winner}: Props) =>
{
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
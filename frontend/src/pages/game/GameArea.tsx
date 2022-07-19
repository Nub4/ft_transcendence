import React, { SyntheticEvent, useState } from "react";
import { Navigate } from "react-router";
import { Socket } from "socket.io-client";
import Wrapper from "../../components/Wrapper";
import { gameUpdate } from "../../models/game";
import 'bootstrap/dist/css/bootstrap.min.css';
import { Card } from 'react-bootstrap';
import sahara from '../../assets/sahara.png';

type Props = {
    socket: Socket | null,
    gameUpdate: gameUpdate | null,
    gameWinner: string | null,
};

const GameArea = ({socket, gameUpdate, gameWinner }: Props) =>
{
    const style = {
        border: '1px solid black',
    };

    const leave = async (e: SyntheticEvent) => {
        e.preventDefault();
        socket?.emit('leaveGameToServer', gameUpdate?.name);
    }

    window.addEventListener("keydown", function(event) {
        if (event.defaultPrevented)
            return ;  
        switch (event.key) {
            case "ArrowUp":
                socket?.emit('moveDownToServer');
                break ;
            case "ArrowDown":
                socket?.emit('moveUpToServer');
                break ;
            default:
                return ;
        }
        event.preventDefault();
    }, true);

    if (gameWinner !== '') {
        return <Navigate to={'/gamefinished'} />
    }

    return(
        <Wrapper>
            <Card>
                <Card.Img src={sahara} />
                <Card.ImgOverlay>
                    <div className="col-md-12 text-center">
                        <svg
                            id="aliens-go-home-canvas"
                            preserveAspectRatio="xMaxYMax none"
                            style={style}
                            width="400px"
                            height="200px"
                        >
                            <rect x={10} y={gameUpdate?.player1.y} width={10} height={gameUpdate?.options.paddleSize} />
                            <rect x={380} y={gameUpdate?.player2.y} width={10} height={gameUpdate?.options.paddleSize} />
                            <circle cx={gameUpdate?.ball.x} cy={gameUpdate?.ball.y} r={gameUpdate?.ball.size} />
                        </svg>
                        <br />
                        <br />
                        <h1 style={{ color: '#f3bad6' }}>{gameUpdate?.player1.score} Score board {gameUpdate?.player2.score}</h1>
                    </div>
                </Card.ImgOverlay>
                <Card.Body>
                <div className="col-md-12 text-center">
                    <h3>{gameUpdate?.player1.user.username} vs {gameUpdate?.player2.user.username}</h3>
                    <form onSubmit={leave}>
                        <button style={{
                                background: "linear-gradient(81.4deg, #BC8F8F 0%, #CD5C5C 100%)",
                                padding: "13px 0",
                                width: "200px",
                                height: "100px",
                                border: "ridge",
                                borderColor: "gray",
                                borderRadius: "20px",
                                color: "white",
                                fontWeight: "bold",
                                fontFamily: "Optima, sans-serif"
                        }} type="submit">Leave Game</button>
                    </form>
                </div>
                </Card.Body>
            </Card>
        </Wrapper>
    );
}

export default GameArea;
import React, { useEffect, useState } from "react";
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
    const [redirect, setRedirect] = useState(false);
    var oldURL = window.location.href;

    const style = {
        border: '5px solid black',
    };

    useEffect(() => {
        window.onbeforeunload = function() {
            var url_string = oldURL;
            var url = new URL(url_string);
            const temp = url.searchParams.get('gamename');
            socket?.emit('leaveGameToServer', { room: temp });
        };
        const intervalId = setInterval(() => {
            if(window.location.href !== oldURL){
                var url_string = oldURL;
                var url = new URL(url_string);
                const temp = url.searchParams.get('gamename');
                socket?.emit('leaveGameToServer', { room: temp });
                clearInterval(intervalId);
            }
        }, 200);
    }, []);

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

    useEffect(() => {
        if (socket === null)
        {
            setRedirect(true);
        }
    }, [socket]);

    if (redirect === true)
    {
      return <Navigate to={'/game'} />;
    }

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
                            // preserveAspectRatio="xMaxYMax none"
                            style={style}
                            width="400px"
                            height="200px"
                        >
                            <line x1="200" y1="400" x2="200" y2="0" stroke="red" strokeDasharray="6" />
                            <rect x={10} y={gameUpdate?.player1.y} width={10} height={gameUpdate?.options.paddleSize} stroke="red" />
                            <rect x={370} y={gameUpdate?.player2.y} width={10} height={gameUpdate?.options.paddleSize} stroke="red" />
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
                </div>
                </Card.Body>
            </Card>
        </Wrapper>
    );
}

export default GameArea;
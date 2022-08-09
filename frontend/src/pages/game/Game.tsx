import React, { SyntheticEvent, useEffect, useState } from "react";
import Wrapper from "../../components/Wrapper";
import { Socket } from 'socket.io-client';
import pongImage from "../../assets/the_pong.png";
import axios from "axios";
import { gameNames, Invite } from "../../models/game";
import { Navigate } from "react-router";
import 'bootstrap/dist/css/bootstrap.min.css';
import { Card, Form, Stack, Table } from 'react-bootstrap';

type Props = {
    socket: Socket | null,
    games: gameNames[],
    invites: any[],
    gameWinner: string,
};

const Game = ({socket, games, invites, gameWinner}: Props) =>
{
    const [place, setPlace] = useState<string | null>(null);
    const [paddleSize, setPaddleSize] = useState(40);
    const [paddleSpeed, setPaddleSpeed] = useState(6);
    const [ballSpeed, setBallSpeed] = useState(4);
    const [invitedUser, setInvitedUser] = useState<string | null>(null);
    const [name, setName] = useState('');
    const [inviter, setInviter] = useState<string | null>(null);

    useEffect(() => {
        setPlace(null);
    }, []);

    const spectatorJoin = async (e: SyntheticEvent) => {
      e.preventDefault();
      socket?.emit('newSpectatorToServer', { room: name } );
      setPlace("queue");
    }

    const submit = async (e: SyntheticEvent) => {
        e.preventDefault();
        setPlace("option");
    }

    const submit_spectator = async (e: SyntheticEvent) => {
        e.preventDefault();
        socket?.emit('getGamesToServer');
        setPlace("matches_list");
    }

    const options = async (e: SyntheticEvent) => {
        e.preventDefault();
        try {
            const {data} = await axios.get('http://' + process.env.REACT_APP_HOST + ':3000' + `/user/get/user?username=${invitedUser}`);
            const resp = await axios.get('/user');
            if (data === '' || data.username === resp.data.username)
            {
                window.alert(`User: (${invitedUser}) doesn't exists or you invited yourself, try again!`);
                setPlace(null);
                return ;
            }
            const id = data.id;
            socket?.emit('addInviteToServer', {id, paddleSize, paddleSpeed, ballSpeed});
            setPlace("queue");
        } catch {
            window.alert(`There was an error when getting users`);
        }
    }

    const queue = async (e: SyntheticEvent) => {
        e.preventDefault();
        if (gameWinner === '')
        {
            setPlace("join");
            socket?.emit('JoinQueueToServer');
        }
        //     setPlace("join");
        // socket?.emit('JoinQueueToServer');
        // var temp: boolean = true;
        // for (var i = 0; i < games.length; i++)
        // {
        //     if (name === games[i].name)
        //         temp = false;
        // }
        // if (temp === true)
        //     setPlace("queue");
    }

    const back = async (e: SyntheticEvent) => {
        e.preventDefault();
        setPlace(null);
    } 

    const Join = async (e: SyntheticEvent) => {
        e.preventDefault();
        if (gameWinner === '')
            setPlace("join");
    }

    if (place === "join")
    {
        socket?.emit('acceptInviteToServer', { sender2: inviter });
        return <Navigate to={'/gamewaitingroom'} />;
    }
    
    if (place === "queue") {
        return <Navigate to={'/gamewaitingroom'} />;
    }

    if (place === "matches_list")
    {
        // useEffect(() => {
        //     socket?.emit('getGamesToServer');
        // } , [socket]);

        return(
            <Wrapper>
                <Card bg="light">
                    <Card.Img src={pongImage} style={{height: '320px'}} />
                    <Card.Body>
                    <div className="col-md-12 text-center">
                        <form onSubmit={back}>
                            <button style={buttonStyle_3} type="submit">Back</button>
                        </form>
                    </div>
                    <br />
                    <Table striped bordered hover variant="dark">
                    <thead>
                        <tr>
                            <th scope="col">#</th>
                            <th scope="col">name</th>
                            <th scope="col">test</th>
                        </tr>
                        </thead>
                        <tbody>
                        {games.map((game: gameNames) => {
                            return (
                            <tr key={game.id}>
                                <td>{game.id}</td>
                                <td>{game.name}</td>
                                <td>
                                <form onSubmit={spectatorJoin}>
                                    <button onClick={e => setName(game.name)} type="submit">Join</button>
                                </form>
                                </td>
                            </tr>  
                            )
                        })}
                        </tbody>
                    </Table>
                    </Card.Body>
                </Card>
            </Wrapper>
        )
    }

    if (place === "option")
    {
        return(
            <Wrapper>
                <Card bg="light" className="mb-3" style={{ color: '#000' }}>
                    <Card.Img src={pongImage} style={{height: '320px'}} />
                        <Form>
                            <Stack direction="horizontal" gap={4}>
                                <div>
                                    <Form.Label><h5 style={{backgroundColor: '#ddd', borderRadius: '5px', paddingLeft: '5px', paddingRight: '5px', paddingBottom: '5px', paddingTop: '2px'}}>Paddle size:</h5></Form.Label> <br />
                                    <input type={"radio"} name="radio" onChange={e => setPaddleSize(30)}/> small <br/>
                                    <input type={"radio"} name="radio" onChange={e => setPaddleSize(40)}/> medium <br/>
                                    <input type={"radio"} name="radio" onChange={e => setPaddleSize(50)}/> large <br/><br />
                                </div>
                                <div>
                                    <Form.Label><h5 style={{backgroundColor: '#ddd', borderRadius: '5px', paddingLeft: '5px', paddingRight: '5px', paddingBottom: '5px', paddingTop: '2px'}}>Paddle speed:</h5></Form.Label> <br />
                                    <input type={"radio"} name="lol" onChange={e => setPaddleSpeed(4)}/> slow <br/>
                                    <input type={"radio"} name="lol" onChange={e => setPaddleSpeed(6)}/> medium <br/>
                                    <input type={"radio"} name="lol" onChange={e => setPaddleSpeed(9)}/> fast <br/><br />
                                </div>
                                <div>
                                    <Form.Label><h5 style={{backgroundColor: '#ddd', borderRadius: '5px', paddingLeft: '5px', paddingRight: '5px', paddingBottom: '5px', paddingTop: '2px'}}>Ball speed:</h5></Form.Label> <br />
                                    <input type={"radio"} name="boom" onChange={e => setBallSpeed(3)}/> slow <br/>
                                    <input type={"radio"} name="boom" onChange={e => setBallSpeed(4)}/> medium <br/>
                                    <input type={"radio"} name="boom" onChange={e => setBallSpeed(5)}/> fast <br/><br />
                                </div>
                                <div>
                                    <Form.Control style={{
                                        background: "linear-gradient(81.4deg, #BC8F8F 0%, #CD5C5C 100%)",
                                        padding: "13px 0",
                                        width: "100px",
                                        height: "50px",
                                        border: "ridge",
                                        borderColor: "gray",
                                        borderRadius: "20px",
                                        color: "white",
                                        fontSize: "18px",
                                        textAlign: "center",
                                        fontWeight: "bold",
                                        fontFamily: "Optima, sans-serif"
                                    }} placeholder="invitedUser" onChange={e => setInvitedUser(e.target.value)} onKeyPress={(e) => { e.key === 'Enter' && e.preventDefault(); }}/>
                                </div>
                            </Stack>
                        </Form>
                        <Stack direction="horizontal" gap={3}>
                        <div>
                            <form onSubmit={options}>
                                <button style={buttonStyle_2} type="submit">Start Game With Invited User</button>
                            </form>
                        </div>
                        <div>
                            <form onSubmit={queue}>
                                <button style={buttonStyle_2} type="submit">Join Queue And Start Game</button>
                            </form>
                        </div>
                        <div>
                            <form onSubmit={back}>
                                <button style={buttonStyle_2} type="submit">Back</button>
                            </form>
                        </div>
                        </Stack>
                    <Card.Body>
                        <Table striped bordered hover variant="dark">
                            <thead>
                                <tr>
                                    <th scope="col">#</th>
                                    <th scope="col">Player who invited</th>
                                    <th scope="col">Join to game</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invites.map((invite: Invite) => {
                                    return (
                                    <tr key={invite.id}>
                                        <td>{invite.id}</td>
                                        <td>{invite.username}</td>
                                        <td>
                                        <form onSubmit={Join}>
                                            <button onClick={e => setInviter(invite.username)} type="submit">Join</button>
                                        </form>
                                        </td>
                                    </tr>  
                                    )
                                })}
                            </tbody>
                        </Table>
                    </Card.Body>
                    </Card>
            </Wrapper>
        )
    }

    return(
        <Wrapper>
            <Card bg="light">
                <Card.Img src={pongImage} style={{height: '320px'}} />
                <Card.Body>
                    <Stack direction="horizontal" gap={2}>
                    <div>
                        <form onSubmit={submit}>
                            <button style={buttonStyle} type="submit">Game Options</button>
                        </form>
                    </div>
                    <div>
                        <form onSubmit={submit_spectator}>
                            <button style={buttonStyle} type="submit">On Going Games</button>
                        </form>
                    </div>
                </Stack>
            </Card.Body>
            </Card>
        </Wrapper>
    );
}
export default Game;

const buttonStyle = {
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
}

const buttonStyle_2 = {
    background: "linear-gradient(81.4deg, #BC8F8F 0%, #CD5C5C 100%)",
    width: "150px",
    height: "100px",
    border: "ridge",
    borderColor: "gray",
    borderRadius: "20px",
    color: "white",
    fontWeight: "bold",
    fontFamily: "Optima, sans-serif"
}

const buttonStyle_3 = {
    background: "linear-gradient(81.4deg, #BC8F8F 0%, #CD5C5C 100%)",
    width: "200px",
    height: "50px",
    border: "ridge",
    borderColor: "gray",
    borderRadius: "20px",
    color: "white",
    fontWeight: "bold",
    fontFamily: "Optima, sans-serif"
}
import React, { SyntheticEvent, useEffect, useState } from "react";
import { Navigate } from "react-router";
import { Socket } from "socket.io-client";
import Wrapper from "../../components/Wrapper";
import { MessageI } from "../../models/Chat";
import styled from "styled-components"
import { Link } from 'react-router-dom';
import { GiSleepy } from "react-icons/gi";
import axios from "axios";
import { tmpdir } from "os";
import { channel } from "diagnostics_channel";

type Props = {
    socket: Socket | null,
    joinMsg: string,
    channelName: string,
    messages: MessageI[],
};

const Chat = ({socket, joinMsg, channelName, messages}: Props) =>
{
    const [newMessage, setNewMessage] = useState('');
    const [infoMsg, setInfoMsg] = useState(joinMsg);
    const [game, setGame] = useState(false);
    const [redirect, setRedirect] = useState(false);
    const [base64, setBase64] = useState();
    const [name, setName] = useState('');
 
    const pongGame = async (e: SyntheticEvent) =>
    {
        e.preventDefault();
        const {data} = await axios.get(`http://localhost:3000/user/get/user?username=${name}`);
        const resp = await axios.get('/user');
        if (data === '' || data.username === resp.data.username)
        {
            window.alert(`User: (${name}) doesn't exists or you invited yourself, try again!`);
            setGame(false);
            return ;
        }
        const id = data.id;
        socket?.emit('addInviteToServer', {id, paddleSize: 40, paddleSpeed: 6, ballSpeed: 3});
        setGame(true);
    }

    const newMsg = async (e: SyntheticEvent) =>
    {
        e.preventDefault();
        
        socket?.emit('msgToServer', { name: channelName, message: newMessage });
        
        setNewMessage("");
        window.scrollTo(0,document.body.scrollHeight);
    }

    useEffect(() => {
        console.log(messages);
        // window.scrollTo(0,document.body.scrollHeight);
        if (socket === null)
            setRedirect(true);
        setInfoMsg(joinMsg);
        return () => {
            // leave channel emit here
          }
    }, [joinMsg, socket]);

    if (redirect === true)
    {
        // leave channel emit here
        return <Navigate to={'/channels'} />;
    }

    if (game === true)
    {
        return <Navigate to={'/gamewaitingroom'} />;
    }
    
    return (
        <Wrapper>

            <div>{infoMsg}</div>
            <Link to={`/chat/chatsettings?ChatSettingsId=${channelName}`} type="submit">settings</Link>
            <ChatContainer>
            <ChatInputContainer>
            <form onSubmit={newMsg}>
                <input placeholder="message" id="inputMessage" value={newMessage} size={19} required onChange={e => setNewMessage(e.target.value)}/>
                <button> send </button>
            </form>
            </ChatInputContainer>
            <div>
            {messages.map((message: MessageI) => {
                console.log(message.author.picture);
                return (
                    <li key={message.id}>
                        <form onSubmit={pongGame}>
                            <button onClick={e => setName(message.author.username)} type="submit">Play</button>
                        </form>
                        <h5>{message.author.username}</h5>
                        <h4>{message.content}</h4>
                        <hr></hr>      
                    </li>
                );
            })}
            </div>
            </ChatContainer>
        </Wrapper>
    );
}

export default Chat;


const ChatContainer = styled.div`

  flex: 0.7;
  flex-frow: 1;
  overflow-y: scroll;
  margin-top: 40px;
`
const ChatInputContainer = styled.div`
    
  border-radius: 20px;
    
    > form {
      position: relative;
      display: flex;
      justify-content: center;
    }

    > form > input {
      position: fixed;
      bottom: 4px;
      width: 80%;
      border: 1px solid gray;
      border-radius: 20px;
      padding: 10px;
      outline: none; 
    }
    
    > form > button {
      display: none !important ;
    }
`;
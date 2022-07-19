import React, { useEffect, useState } from 'react';
import './App.css';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Users from './pages/users/Users';
import SingIn from './pages/SignIn';
import Profile from './pages/profile/Profile';
import Channels from './pages/chat/Channels';
import Game from './pages/game/Game';
import Settings from './pages/settings/Settings';
import { io, Socket } from 'socket.io-client';
import Chat from './pages/chat/Chat';
import ChatSettings from './pages/chat/ChatSettings';
import { gameUpdate } from './models/game';
import GameArea from './pages/game/GameArea';
import GameFinished from './pages/game/GameFinished';
import GameWaitingRoom from './pages/game/GameWaitingRoom';

export const TodoContext = React.createContext<any>(null);

function App() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [joinMsg, setJoinMsg] = useState('');
  const [channelName, setChannelName] = useState('');
  const [messages, setMessages] = useState([]);
  const [games, setGames] = useState([]);
  const [gameStart, setGameStart] = useState<string | null>(null);
  const [gameUpdate, setGameUpdate] = useState<gameUpdate | null>(null);
  const [spectator, setSpectator] = useState<string | null>(null);
  const [gameWinner, setGameWinner] = useState('');
  const [invites, setInvites] = useState<any[]>([]);
  const [channels, setChannels] = useState([]);
  const [lastPage, setLastPage] = useState(0);

  useEffect(() => {
    const newSocket = io(`http://localhost:3000`, {withCredentials: true, transports: ['websocket']});
    newSocket.on('joinToClient', (data) => {
      setJoinMsg(data.msg);
      setChannelName(data.channel);
      setMessages(data.messages);
    });
    newSocket.on('leaveToClient', (data) => {
      console.log(data);
    });
    newSocket.on('msgToClient', (data) => {
      setMessages(data);
    });
    newSocket.on('getGamesToClient', (data) => {
      setGames(data);
    });
    newSocket.on('addUpdatedInviteToClient', (data) => {
      invites.splice(data, 1);
      setInvites(invites);
    });
    newSocket.on('addInviteToClient', (data) => {
      window.alert(`${data.username} invited you to play pong! Good luck!`);
      setInvites(invites => [...invites, data]);
    });
    newSocket.on('leaveQueueToClient', (data) => {
      console.log(data);
    });
    newSocket.on('gameEndToClient', (data) => {
      setGameWinner(data);
    });
    newSocket.on('newSpectatorToClient', (data) => {
      setSpectator(data.room);
    });
    newSocket.on('gameStartsToClient', (data) => {
      setGameStart(data);
    });
    newSocket.on('gameUpdateToClient', (data) => {
      setGameUpdate(data);
    });
    newSocket.on('getChannelsToClient', (data) => {
      setChannels(data.data);
      setLastPage(data.meta.last_page);
    })
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    }
  }, []);

  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/game" element={<Game socket={socket} games={games} invites={invites} />}></Route>
          <Route path="/" element={<Profile socket={socket}/>}></Route>
          <Route path="/profile"  element={<Profile socket={socket} key={2}/>}></Route>
          <Route path="/profile/settings" element={<Settings/>}></Route>
          <Route path="/users" element={<Users />}></Route>
          <Route path="/signin" element={<SingIn />}></Route>
          <Route path="/channels" element={<Channels socket={socket} channels={channels} lastPage={lastPage} />}></Route>
          <Route path="/chat" element={<Chat socket={socket} joinMsg={joinMsg} channelName={channelName} messages={messages}/>}></Route>
          <Route path="chat/chatSettings" element={<ChatSettings/>}></Route>
          <Route path="/gamearea" element={<GameArea socket={socket} gameUpdate={gameUpdate} gameWinner={gameWinner} />}></Route>
          <Route path='/gamefinished' element={<GameFinished winner={gameWinner} />}></Route>
          <Route path="/gamewaitingroom" element={<GameWaitingRoom gameStart={gameStart} spectator={spectator} socket={socket}/>}></Route>
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
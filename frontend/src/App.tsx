import React, { useEffect, useState } from 'react';
import './App.css';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import {NotificationContainer, NotificationManager} from 'react-notifications';
import 'react-notifications/lib/notifications.css';
import Users from './pages/users/Users';
import SignIn from './pages/auth/SignIn';
import Auth from './pages/auth/Auth';
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
import Error404 from './pages/errors/Error404';
import Error500 from './pages/errors/Error500';
import ModalMessage from "./pages/chat/ModalMessage";

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
  const [inviteUser, setInviteUser] = useState('');
  const [invites, setInvites] = useState<any[]>([]);
  const [channels, setChannels] = useState([]);
  const [lastPage, setLastPage] = useState(0);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [banned, setBanned] = useState('');
  const [popupMessage, setPopupMessage] = useState("");

  useEffect(() => {
    const newSocket = io('http://' + process.env.REACT_APP_HOST + ':3000', {withCredentials: true, transports: ['websocket']});
    newSocket.on('joinToClient', (data) => {
      setJoinMsg(data.msg);
      setChannelName(data.channel);
      setMessages(data.messages);
      setOnlineUsers(data.onlineUsers);
    });
    newSocket.on('leaveToClient', (data) => {
      setJoinMsg(data.msg);
      setOnlineUsers(data.onlineUsers);
    });
    newSocket.on('msgToClient', (data) => {
      setMessages(data);
    });
    newSocket.on('getGamesToClient', (data) => {
      setGames(data);
    });
    newSocket.on('isBannedToClient', (data) => {
      setBanned(data);
    });
    newSocket.on('addUpdatedInviteToClient', (data) => {
      setInvites((invites:any) => invites.filter((_:any, index:any) => index !== data));
    });
    newSocket.on('updateInviteToClient', (data) => {
      const index = invites.findIndex(function (Invite:any) {
        return Invite.sender === data.username;
      });
      invites.splice(index, 1);
      setInvites(invites);
    });
    newSocket.on('addInviteToClient', (data) => {
      NotificationManager.success(`${data.username} invited you to a game, good luck`, 'Invite', 5000);
      setInvites((invites: any) => [...invites, data]);
    });
    newSocket.on('leaveQueueToClient', (data) => {
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
          <Route path="/game" element={<Game socket={socket} games={games} invites={invites} gameWinner={gameWinner} />}></Route>
          <Route path="/profile"  element={<Profile socket={socket} key={2}/>}></Route>
          <Route path="/profile/settings" element={<Settings socket={socket}/>}></Route>
          <Route path="/users" element={<Users />}></Route>
          <Route path="/" element={<SignIn socket={socket}/>}></Route>
          <Route path="/auth/tfa" element={<Auth />}></Route>
          <Route path="/channels" element={<Channels socket={socket} channels={channels} lastPage={lastPage} />}></Route>
          <Route path="/chat" element={<Chat socket={socket} joinMsg={joinMsg} channelName={channelName} messages={messages} onlineUsers={onlineUsers} banned={banned}/>}></Route>
          <Route path="chat/chatSettings" element={<ChatSettings socket={socket} banned={banned}/>}></Route>
          <Route path="/gamearea" element={<GameArea socket={socket} gameUpdate={gameUpdate} gameWinner={gameWinner} />}></Route>
          <Route path='/gamefinished' element={<GameFinished winner={gameWinner} />}></Route>
          <Route path="/gamewaitingroom" element={<GameWaitingRoom gameStart={gameStart} spectator={spectator} socket={socket}/>}></Route>
          <Route path="/error500" element={<Error500></Error500>}></Route>
          <Route path="*" element={<Error404></Error404>}></Route>
        </Routes>
      </BrowserRouter>
      <NotificationContainer />
    </div>
  );
}

export default App;
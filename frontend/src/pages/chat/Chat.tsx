import React, { SyntheticEvent, useEffect, useState } from "react";
import { Navigate } from "react-router";
import { Socket } from "socket.io-client";
import Wrapper from "../../components/Wrapper";
import { MessageI } from "../../models/Chat";
import { User } from "../../models/user";
import { Link } from 'react-router-dom';
import axios from "axios";
import chatImage from '../../assets/chat2.png';
import ModalMessage from "./ModalMessage";
import './Chat.css' 

type Props = {
    socket: Socket | null,
    joinMsg: string,
    channelName: string,
    messages: MessageI[],
    onlineUsers: string[],
    banned: string,
};

const Chat = ({socket, joinMsg, channelName, messages, onlineUsers, banned}: Props) =>
{
  const [newMessage, setNewMessage] = useState('');
  const [infoMsg, setInfoMsg] = useState(joinMsg);
  const [game, setGame] = useState(false);
  const [redirect, setRedirect] = useState(false);
  const [name, setName] = useState('');
  const [myName, setMyName] = useState('');
  const [blockUser, setBlockuser] = useState('');
  const [myBlockedUsers, setMyBlockedUsers] = useState<User[]>([]);
	const [popupMessage, setPopupMessage] = useState("");
  var oldURL = window.location.href;

  const pongGame = async (e: SyntheticEvent) =>
  {
      setPopupMessage("");

      e.preventDefault();
      try{
      const {data} = await axios.get('http://' + process.env.REACT_APP_HOST + ':3000' + `/user/get/user?username=${name}`);
      const id = data.id;
      socket?.emit('addInviteToServer', {id, paddleSize: 40, paddleSpeed: 6, ballSpeed: 4});
      setGame(true);}
      catch (e) {
        setPopupMessage("There was an error");
      }
  }

  const blockUserFunc = async (e: SyntheticEvent) =>
  {
    e.preventDefault();
    setPopupMessage("");
    try {
        const {data} = await axios.get(`/user/get/user?username=${blockUser}`);
        await axios.post(`/user/block/${data.id}`);
        setBlockuser('');
        getBlockedUsers().then(data => {
          setMyBlockedUsers(data);
        });
    } catch (error: any) {
      setPopupMessage(error.response.data.message);
    }
  }

  const unblockUserFunc = async (e: SyntheticEvent) =>
  {
    e.preventDefault();
    setPopupMessage("");
    try {
        const {data} = await axios.get(`/user/get/user?username=${blockUser}`);
        await axios.post(`/user/unblock/${data.id}`);
        setBlockuser('');
        getBlockedUsers().then(data => {
          setMyBlockedUsers(data);
        });
        } catch (error) {
          setPopupMessage("There was an error");
    }
  }

  const getBlockedUsers = async () =>
  {
    setPopupMessage("");
    try {
      const {data} = await axios.get(`/user/get/blocked`);
      return data;
    } catch (error) {
      setPopupMessage("There was an error");
    }
  }

  const newMsg = async (e: SyntheticEvent) =>
  {
    e.preventDefault();
    socket?.emit('msgToServer', { name: channelName, message: newMessage });
    setNewMessage("");
    window.scrollTo(0,document.body.scrollHeight);
  }
   
  useEffect(() => {
      window.onbeforeunload = function() {
        var url_string = oldURL;
        var url = new URL(url_string);
        const temp = url.searchParams.get('chatId');
        socket?.emit('leaveChannelToServer', { name: temp });
      };
      const intervalId = setInterval(() => {
        if(window.location.href != oldURL){
              var url_string = oldURL;
              var url = new URL(url_string);
              const temp = url.searchParams.get('chatId');
              socket?.emit('leaveChannelToServer', { name: temp });
              clearInterval(intervalId);
          }
      }, 1000);
      getBlockedUsers().then((blockedUsers) => {
        setMyBlockedUsers(blockedUsers);
      }, (error) => {
        
      });
  }, []);

  useEffect(() => {
    setPopupMessage("");
      (async () => {
        try {
            const {data} = await axios.get('/user');
            setMyName(data.username);} catch {
              setPopupMessage("There was an error");
            }
      }) ()
      if (socket === null || banned === "banned")
      {
        socket?.emit('unBanToServer', { username: myName });
        setRedirect(true);
      }
      setInfoMsg(joinMsg);
  }, [joinMsg, socket, banned]);

  const findUser = (username: string) =>
  {
    for (let i = 0; i < myBlockedUsers.length; i++)
    {
      if (myBlockedUsers[i].username === username)
        return true;
    }
    return false;
  }

  if (redirect === true)
  {
    return <Navigate to={'/channels'} />;
  }

  if (game === true)
  {
      return <Navigate to={'/gamewaitingroom'} />;
  }

  return (
    <Wrapper>
      <div className="chat_name">
        <h2>{channelName}</h2>
        <div className="col-md-12 text-center"><b>{infoMsg}</b></div>
      </div>
      <div className="chat_container">
        <div className="chat_members_list">
          <h5 style={{ padding: '1px' }}><u>Online chat members:</u></h5>
          {onlineUsers.map((onlineUser, index) => {
            if (myName === onlineUser)
            {
              return (
                  
              <li style={{ listStyleType : 'none' }} key={index}>
                  <h6 style={{ padding: '1px', color: 'green' }}>
                      {onlineUser}
                  </h6>
              </li>
              );
            }
            else if (!findUser(onlineUser))
            {
              return (
                <div key={index}>
                  <li style={{ listStyleType : 'none' }} key={index}>
                    <h6 style={{ padding: '1px', color: 'green' }}>
                      <form onSubmit={pongGame}>
                        {onlineUser} <button onClick={e => setName(onlineUser)} type="submit" >Invite to game</button>
                      </form>
                      <form onSubmit={blockUserFunc}>
                        <button onClick={e => setBlockuser(onlineUser)} type="submit" >block user</button>
                      </form>
                    </h6>
                  </li>
                </div>
              );
            }
            else
            {
              return (
                <li style={{ listStyleType : 'none' }} key={index}>
                  <h6 style={{ padding: '1px', color: 'green' }}>
                    <form onSubmit={unblockUserFunc}>
                      {onlineUser} <button onClick={e => setBlockuser(onlineUser)} type="submit" >unblock user</button>
                    </form>
                  </h6>
                </li>
              )
            }
          }
          )}
        </div>
        <Link className="chat_setting_link" to={`/chat/chatsettings?ChatSettingsId=${channelName}`} type="submit">
          <button className=" btn chat_setting_button">
            settings
          </button>
        </Link>
        <div className="chat_message_container" style={{ backgroundImage: `url(${chatImage})`, borderRadius: '20px', padding: '20px' }}>

          <div className="messages" >
            {messages.map((message: MessageI) => {
              if (myName === message.author.username)
              {
                return (
                  <div className="own_message_element" key={message.id}>
                    <h6 className="own_message_content">
                      {message.content}
                    </h6>
                  </div>
                );
              }
              else
              {
                if (findUser(message.author.username) === false)
                {
                  return (
                    <div className="message_element" key={message.id}>
                      <h5 className="message_content">
                      <Link className="link_to_profile" to={`/profile?userId=${message.author.id}`}>
                        <h6 className="message_author">
                          {message.author.username}
                        </h6>
                      </Link>
                          {message.content}
                      </h5>
                    </div>
                  );
                }
                else
                {
                  return (
                    <div className="message_element" key={message.id}>
                      <h5 className="message_content">
                        message from a blocked user
                      </h5>
                    </div>
                  );
                }
              }
            })}
          </div>
        </div>
        <div className="chat_input_container">
          <form className="input_container_form" onSubmit={newMsg}>
              <input className="input_container_input" placeholder="message" value={newMessage} size={19} required onChange={e => setNewMessage(e.target.value)}/>
              <button className="input_container_button">send</button>
          </form>
        </div>
    </div >
    {popupMessage != "" && <ModalMessage message={popupMessage} success={false}/>}
    </Wrapper>
  );
}

export default Chat;
import axios from "axios";
import React, { SyntheticEvent, useEffect, useState } from "react";
import Wrapper from "../../components/Wrapper";
import { Channel, ChannelStatus } from "../../models/channel";
import { Socket } from 'socket.io-client';
import { Navigate } from "react-router";
import ModalMessage from "./ModalMessage";
import { Button, Card, Form, Table } from 'react-bootstrap';
import Modal from 'react-bootstrap/Modal';
import { SetPasswordDto } from "./chatSettings.dto";
import liveChat from "../../assets/liveChat.png";

type Props = {
  socket: Socket | null,
  channels: Channel[],
  lastPage: number,
};

const validName = new RegExp(
  '^[a-zA-Z0-9-_]{1,20}$'
);

const Channels = ({socket, channels, lastPage}: Props) =>
{
  const [page, setPage] = useState(1);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [isPrivate, setIsPrivate] = useState<boolean>(false);
	const [popupMessage, setPopupMessage] = useState("");
	const [actionSuccess, setActionSuccess] = useState(false);
  const [username, setUsername] = useState('');
  const [gotUsername, setGotUsername] = useState(false);
  const [currentChannel, setCurrentChannel] = useState<any>("");
  const [checkPwd, setCheckPwd ] = useState(0);

  useEffect(() => {
    if (socket) {
      socket.connect();
      socket.emit('getChannelsToServer', { page });
    }
    getUser().then((username) => {
      setUsername(username);
      setGotUsername(true);
    }, (error) => {
    } 
    );
  }, [page, socket, username]);

  const getUser = async () => {
      try {
        let temp = await axios.get('/user');
        return temp.data.username;
      }catch (e) {
      }
  }

  const submit = async (e: SyntheticEvent) =>
  {
    e.preventDefault();
    setPopupMessage("");

    console.log(name);
    console.log(validName.test(name));
    if (!validName.test(name)) {
      window.alert("Invalid format for channel name");
      return;
    }

    try {
    if (isPrivate === false){
      if (password)
        await axios.post('chat/protected', { name, password });
      else
        await axios.post('chat/public', { name });
    }
    else if (isPrivate === true)
      await axios.post('chat/private', { name });
    socket?.emit('getChannelsToServer', { page });
    setPopupMessage("Channel " + name + " successfully created");
    setActionSuccess(true);}
    catch (e:any) {
      setPopupMessage(e.response.data.error);
      setActionSuccess(false);
    }
  }

  const join = async (e: SyntheticEvent, channel:Channel) =>
  {
    e.preventDefault();
    setCheckPwd(0);
    setPopupMessage("");
  
    try {
      const data = await axios.get(`chat/${name}`);
      setCurrentChannel(data.data);
      const adminForm : SetPasswordDto = { name : data.data.name, password : "" };
      await axios({
          method: 'post',
          url: "chat/join",
          data: adminForm,
          headers: {'content-type': 'application/json'}
        });
    } catch (e:any) {
      if ( e.response.data.message === 'You have been banned from this channel' )
      {
        setPopupMessage(e.response.data.message);
        return ;
      }
    }
    setCheckPwd(1);
  }

  const leave = async (e: SyntheticEvent, channelId: number) =>
  {
    e.preventDefault();
    setPopupMessage("");

    try {
      await axios.delete(`chat/leave/${channelId}`);
      socket?.emit('getChannelsToServer', { page });
      setPopupMessage("Channel successfully left");
      setActionSuccess(true);
    }
    catch (e:any) {
      setPopupMessage(e.response.data.message);
      setActionSuccess(false);
    }
  }

  const chanDelete = async (e: SyntheticEvent, channelId: number) =>
  {
    e.preventDefault();
    setPopupMessage("");

    try {
      await axios.delete(`chat/delete/${channelId}`);
      socket?.emit('getChannelsToServer', { page });
      setPopupMessage("Channel successfully deleted");
      setActionSuccess(true);
    }
      catch(e:any)
    {
      setPopupMessage(e.response.data.message);
      setActionSuccess(false);
    }
  }

  const next = () =>
  {
    if (page < lastPage)
      setPage(page + 1);
  }

  const prev = () =>
  {
    if (page >= 2)
      setPage(page - 1);
  }
  
  const channelHasMember = (channel: Channel) =>
  {
    if (channel.members.length > 0)
    {
      for (let i = 0; i < channel.members.length; i++)
      {
        if (channel.members[i].username === username)
          return true;
      }
    }
    return false;
  }

  if (checkPwd == 1)
  {
    if (currentChannel.status === "protected" && channelHasMember(currentChannel) === false)
      setCheckPwd(2);
    else
    {
      socket?.emit('joinToServer', { name });
      return (<Navigate to={`/chat?chatId=${name}`} />);
    }
  }

  if (gotUsername)
  {
    return (
      <Wrapper>
        <br />
        <Card className="card flex-row" border="dark" bg="light" style={{ height: '22rem' }}>
          <div className="card-body">
            <Form onSubmit={submit}>
                <Form.Group className="mb-3" controlId="formBasicName">
                  <Form.Label>Name</Form.Label>
                  <Form.Control placeholder="Enter channel name" required onChange={e => setName(e.target.value)}/>
                </Form.Group>
                <Form.Group className="mb-3" controlId="formBasicPassword">
                  <Form.Label>Password</Form.Label>
                  <Form.Control type="password" placeholder="Password" onChange={e => setPassword(e.target.value)}/>
                </Form.Group>
                <input type={"checkbox"} name="radio" onClick={(e:any) => {setIsPrivate(e.target.checked)}}/> private <br/><br />
                <Button variant="primary" type="submit">
                  Create
                </Button>
              </Form>
          </div><img className="card-img-sm-right example-card-img-responsive" src={liveChat}/>
        </Card>
        <Card border="dark" bg="light">
          <Card.Body>
            <Table striped bordered hover variant="light">
              <thead>
                <tr>
                  <th scope="col">#</th>
                  <th scope="col">name</th>
                  <th scope="col">status</th>
                  <th scope="col">join</th>
                  <th scope="col">leave</th>
                  <th scope="col">delete</th>
                </tr>
              </thead>
              <tbody>
              {
                channels.map((channel: Channel) => 
                {
                  {
                    return (
                      ((channel.status !== ChannelStatus.direct && channel.status !== ChannelStatus.private) || channelHasMember(channel) === true) &&
                        (<tr key={channel.id}>
                          <td>{channel.id}</td>
                          <td>{channel.name}</td>
                          <td>{channel.status}</td>
                          <td>
                            <form onSubmit={e => join(e, channel)}>
                              <button onClick={e => setName(channel.name)} type="submit">Join</button>
                            </form>
                          </td>
                          <td>
                              <button onClick={e => leave(e, channel.id)} type="submit">Leave</button>
                          </td>
                          <td>
                            <button onClick={e => chanDelete(e, channel.id)} type="submit">Delete</button>
                          </td>
                        </tr>
                        )
                      )
                  }
                }
                )
              }
              </tbody>
            </Table>
            <nav>
              <ul className="pagination">
                  <li className="page-item">
                    <a href="#" className="page-link" onClick={prev}>Previous</a>
                  </li>
                  <li className="page-item">
                    <a href="#" className="page-link" onClick={next}>Next</a>
                  </li>
              </ul>
            </nav>
          </Card.Body>    
        </Card>   		
        { checkPwd == 2 && <ModalPwd socket={socket} chatName={name} />}
        { popupMessage != "" && <ModalMessage message={popupMessage} success={actionSuccess} /> }
      </Wrapper>
    );
  }
  else
  {
    return <div>Loading...</div>
  }
}

interface prop {
	chatName: string,
  socket: Socket | null
}

function ModalPwd({chatName, socket}:prop) {
  const [show, setShow] = useState(true);
  const [goodPwd, setGoodPwd] = useState(0);

  const handleClose = () => setShow(false);

  const handleConfirm = async() => {
      setGoodPwd(0);
			const newpwd = (document.getElementById("new password") as HTMLInputElement).value;

			const adminForm : SetPasswordDto = { name : chatName!, password : newpwd }
      try {
        const data = await axios({
            method: 'post',
            url: "chat/join",
            data: adminForm,
            headers: {'content-type': 'application/json'}
          });
        socket?.emit('joinToServer', { name: adminForm.name, password: adminForm.password });
        setGoodPwd(1);
      } catch (e) {
        setGoodPwd(2);
      }
	};

  if (goodPwd === 1)
  {
      return (<Navigate to={`/chat?chatId=${chatName}`} />);
  }

  return (
    <>
      <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Please enter password</Modal.Title>
        </Modal.Header>
        <Modal.Body>
					<input id='new password' type="text" placeholder="Enter the new password"></input>
				</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleConfirm}>
            Confirm
          </Button>
        </Modal.Footer>
      </Modal>
      {goodPwd == 2 && <ModalMessage message="Wrong password" success={false}/>}
    </>
  );
}

export default Channels;
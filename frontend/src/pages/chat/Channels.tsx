import axios from "axios";
import React, { SyntheticEvent, useEffect, useState } from "react";
import Wrapper from "../../components/Wrapper";
import { Channel, ChannelStatus } from "../../models/channel";
import io, { Socket } from 'socket.io-client';
import {Link} from "react-router-dom"
import { Navigate } from "react-router";

type Props = {
  socket: Socket | null,
  channels: Channel[],
  lastPage: number,
};

const Channels = ({socket, channels, lastPage}: Props) =>
{
  const [page, setPage] = useState(1);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState(ChannelStatus.public);
  const [place, setPlace] = useState(false);

  const submit = async (e: SyntheticEvent) =>
  {
    e.preventDefault();

    if (status === ChannelStatus.public)
      await axios.post('chat/public', { name });
    else if (status === ChannelStatus.protected)
      await axios.post('chat/protected', { name, password });
    else if (status === ChannelStatus.private)
      await axios.post('chat/private', { name });
    socket?.emit('getChannelsToServer', page);
  }

  const join = async (e: SyntheticEvent) =>
  {
    e.preventDefault();
    setPlace(true);
  }

  const leave = async (e: SyntheticEvent, channelId: number) =>
  {
    e.preventDefault();

    await axios.delete(`chat/leave/${channelId}`);
  }

  const deleteChannel = async (e: SyntheticEvent, channelId: number) =>
  {
    e.preventDefault();
    await axios.delete(`chat/delete/${channelId}`);
    socket?.emit('getChannelsToServer', page);
  }

  if (place === true)
  {
    useEffect(() => {
      socket?.emit('joinToServer', { name });
    });
    return <Navigate to={`/chat?chatId=${name}`} />;
  }

  useEffect(() => {
    socket?.emit('getChannelsToServer', page);
  }, [page, socket]);

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

  return (
    <Wrapper>
        <div className="table-responsive">
          <form onSubmit={submit}>
            <h4>Create a channel</h4>
            <input placeholder="name" size={19} required onChange={e => setName(e.target.value)}/>
            <br />
            <input placeholder="password" size={19} onChange={e => setPassword(e.target.value)}/>
            <br />
            <input type={"radio"} name="radio" onChange={e => setStatus(ChannelStatus.public)}/> public <br/>
            <input type={"radio"} name="radio" onChange={e => setStatus(ChannelStatus.protected)}/> protected <br/>
            <input type={"radio"} name="radio" onChange={e => setStatus(ChannelStatus.private)}/> private <br/>
            <button type="submit">Create</button>
          </form>
          <br/>
          <br/>
          <table className="table table-striped table-sm">
            
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
            {channels.map((channel: Channel) => {
                return (
                  <tr key={channel.id}>
                    <td>{channel.id}</td>
                    <td>{channel.name}</td>
                    <td>{channel.status}</td>
                    <td>
                      <form onSubmit={join}>
                        <button onClick={e => setName(channel.name)} type="submit">Join</button>
                      </form>
                    </td>
                    <td>
                        <button onClick={e => leave(e, channel.id)} type="submit">Leave</button>
                    </td>
                    <td>
                        <button onClick={e => deleteChannel(e, channel.id)} type="submit">Delete</button>
                    </td>
                  </tr>  
                )
              })}
            </tbody>
          </table>
        </div>
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
    </Wrapper>
  );
}

export default Channels;
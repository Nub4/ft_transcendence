import axios from "axios";
import React, { SyntheticEvent, useEffect, useState } from "react";
import Wrapper from "../../components/Wrapper";
import { User } from "../../models/user";
import minigames from "../../assets/minigames.png";
import 'bootstrap/dist/css/bootstrap.min.css';
import { Button, Card, Table } from 'react-bootstrap';
import { Navigate } from "react-router";
import ModalMessage from "../chat/ModalMessage";

const Users = () =>
{
  const [users, setUsers] = useState([]);
  const [userId, setUserId] = useState(0);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(0);
  const [place, setPlace] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [actionSuccess, setActionSuccess] = useState(false);
  const [myBlockedUsers, setMyBlockedUsers] = useState<User[]>([]);
  const [friends, setFriends] = useState<User[]>([]);


  useEffect(() => {
    setTimeout(async() => {
      try {
      const {data} = await axios.get(`user/allusers?page=${page}`);
      setUsers(data.data);
      setLastPage(data.meta.last_page);
      } catch (error) {
        window.alert(`There was an error`);
      }
    }, 40);
    getBlockedUsers().then((blockedUsers) => {
      setMyBlockedUsers(blockedUsers);
    }, (error) => {
    });
    getFriends().then((friends) => {
      setFriends(friends);
    }, (error) => {
    });

  }, [page]);

  const findUser = (username: string) =>
  {
    for (let i = 0; i < myBlockedUsers.length; i++)
    {
      if (myBlockedUsers[i].username === username)
        return true;
    }
    return false;
  }

  const isFriend = (username: string) =>
  {
    try {
      for (let i = 0; i < friends.length; i++)
      {
        if (friends[i].username === username)
          return false;
      }
      return true;
    }
    catch (error) {
    }
  }
  const getBlockedUsers = async () =>
  {
    try {
      const {data} = await axios.get(`/user/get/blocked`);
      return data;
    } catch (error) {
    }
  }

  const getFriends = async () =>
  {
    try {
      const {data} = await axios.get(`/user/friend`);
      return data;
    } catch (error) {
    }
  }


  const join = async (e: SyntheticEvent) => {
    e.preventDefault();
    setPlace(true);
  }

  if (place === true) {
    return <Navigate to={`/profile?userId=${userId}`} />;
  }

  const next = () => {
    if (page < lastPage)
      setPage(page + 1);
  }

  const prev = () => {
    if (page >= 2)
      setPage(page - 1);
  }

  return (
    // <>
      <Wrapper>
        <Card bg="light">
          <Card.Img src={minigames} />
          <Card.Body>
            <Table striped bordered hover variant="dark">
              <thead>
                <tr>
                  <th scope="col">#</th>
                  <th scope="col">username</th>
                  <th scope="col">status</th>
                  <th scope="col">level</th>
                  <th scope="col">wins</th>
                  <th scope="col">losses</th>
                  <th scope="col">rank</th>
                  <th scope="col">block/unblock</th>
                  <th scope="col">add friend</th>
                </tr>
              </thead>
              <tbody>
              {users.map((user: User) => {
                  return (
                    <tr key={user.id}>
                      <td>{user.id}</td>
                      <td>
                        <form onSubmit={join}>
                          <Button variant="link" onClick={() => setUserId(user.id)} type="submit">{user.username}</Button>
                        </form>
                      </td>
                      <td>{user.status}</td>
                      <td>{user.level}</td>
                      <td>{user.wins}</td>
                      <td>{user.losses}</td>
                      <td>{user.rank}</td>
                      {(findUser(user.username)) ? (<td><button  className="btn btn-light" onClick={
                        async () => {
                          setPopupMessage("");
                          try {
                            const {data} = await axios.get(`/user/get/user?username=${user.username}`);
                            await axios.post(`/user/unblock/${data.id}`);
                            setPopupMessage(`${user.username} unblocked`);
                            setActionSuccess(true);
                            getBlockedUsers().then(data => {
                            setMyBlockedUsers(data);
                          });
                          } catch (error) {
                            setActionSuccess(false);
                            setPopupMessage(`${user.username} is not blocked`);
                          }
                        }
                      }>unblock user</button> </td>) : 
                      (<td><button  className="btn btn-light" onClick={
                        async () => {
                          setPopupMessage("");
                          try {
                            await axios.post(`/user/block/${user.id}`);
                            setPopupMessage(`${user.username} blocked`);
                            setActionSuccess(true);
                            getBlockedUsers().then(data => {
                              setMyBlockedUsers(data);
                            });  
                          }
                          catch (e:any) {
                            setPopupMessage(e.response.data.message);
                            setActionSuccess(false);
                          }
                        }
                      }>block user</button> </td>)}
                      {(isFriend(user.username)) ?(<td>
                      <button className="btn btn-light" onClick={
                        async () => {
                          setPopupMessage("");
                          try {
                            await axios.post(`/user/friend/${user.id}`);
                            setPopupMessage('Friend added');
                            setActionSuccess(true);
                            getFriends().then((friends) => {
                              setFriends(friends);
                            }, (error) => {
                            });
                        
                          }
                          catch (e:any) {
                            setPopupMessage(e.response.data.message);
                            setActionSuccess(false);
                          }
                        }
                        }>add friend</button> </td>) : 
                        (<td>
                          <button className="btn btn-light" onClick={
                            async () => {
                              setPopupMessage("");
                              try {
                                await axios.delete(`/user/friend/${user.id}`);
                                setPopupMessage('friend removed');
                                setActionSuccess(true);
                                getFriends().then((friends) => {
                                  setFriends(friends);
                                }, (error) => {
                                });
                            
                              }
                              catch (e:any) {
                                setPopupMessage(e.response.data.message);
                                setActionSuccess(false);
                              }
                            }
                          }>remove friend</button>
                         </td>)
                         }
                    </tr>
                  )
                })}
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
        {(popupMessage != "") && <ModalMessage message={popupMessage} success={actionSuccess} />}
      </Wrapper>
    // </>
  );
}

export default Users;
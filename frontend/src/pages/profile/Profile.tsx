import * as React from "react";
import axios from "axios";
import {Socket} from "socket.io-client";
import Wrapper from "../../components/Wrapper";
import { User, UserLevel, UserStatus } from "../../models/user";
import UserProfile from "./UserProfile";
import './Profile.css'
import OtherProfile from "./OtherProfile";

interface Props {
  socket: Socket | null;
}

const Profile = (props: Props) => {
  const [user, setUser] = React.useState<User>(new User(0, '', '',false, '', UserStatus.offline, UserLevel.beginner, 0, 0, 0));
  const [ownUser, setOwnUser] = React.useState<User>(new User(0, '', '', false, '', UserStatus.offline, UserLevel.beginner, 0, 0, 0));
  const [friends, setFriends] = React.useState<User[]>([]);
  var urlParam: string | null = '';
  const [gotUser, setGotUser] = React.useState<boolean>(false);
  const [gotOwnUser, setGotOwnUser] = React.useState<boolean>(false);
  const [gotFriends, setGotFriends] = React.useState<boolean>(false);
  var [shouldUpdate, setShouldUpdate] = React.useState<boolean>(false);
  const [error, setError] = React.useState<boolean>(false);

  React.useEffect(() => {
    setGotFriends(false);
    setGotUser(false);
    setGotOwnUser(false);

    if (props.socket?.connected === false)
      props.socket.connect();

    const query = new URLSearchParams(window.location.search);
    urlParam = query.get('userId');
    

    getUserById(urlParam).then(answer => {
      setUser(answer);
      setGotUser(true);
    }, error => {
      setError(true);
    });
    
    getUserById(null).then(user => {
      setOwnUser(user);
      setGotOwnUser(true);
    }, error => {
      setError(true);
    })

    getFriends().then(friends => {
      setFriends(friends);
      setGotFriends(true);
    }, error => {
      setError(true);
    });

    setShouldUpdate(false);
  }, [shouldUpdate, error]);

  function setUpdate() {
    setShouldUpdate(true);
  }

  async function getFriends() {
    return axios.get(`/user/friend`).then(answer => {
      return answer.data;
    }, error => {
      setError(true);
    });
  }

  async function getUserById(userId: string | null) {
    if (userId) {
      return axios.get(`/user/${userId}`).then(user =>{
        return user.data;
      }, error => {
        setError(true);
        return null;
      });
    }
    else {
        return axios.get('/user').then(response => {
          return response.data;
        }, error => {
          setError(true);
          return null;
        }
      );
    }
  }

  window.onpopstate = function(event) {
    setUpdate();
  }

  if (gotUser && gotOwnUser && gotFriends)
  {
    return (
      <Wrapper setParentState={setUpdate}>
        <div className="profile-container">
        {((user?.id != ownUser?.id) ?
            (<OtherProfile user={user} friends={friends} socket={props.socket} setParentState={setShouldUpdate} />) :
            (<UserProfile friends={friends} user={ownUser} socket={props.socket} setParentState={setShouldUpdate}/>))}
        </div>{/*)*/}
      </Wrapper>
    );
  }
  else {
    return (
      <Wrapper setParentState={setUpdate}>
      <div>
        <h1>Loading...</h1>
      </div>
      </Wrapper>
    );
  }
}

export default Profile;
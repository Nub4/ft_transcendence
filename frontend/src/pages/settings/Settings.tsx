import axios from "axios";
import { useState, useEffect } from "react";
import { Navigate } from "react-router";
import Wrapper from "../../components/Wrapper";
import { encode } from "base64-arraybuffer";
import { User } from "../../models/user";
import './Settings.css'
import { Socket } from "socket.io-client";


export interface tfaDto {
  tfa: boolean;
}

type Props = {
  socket: Socket | null,
};

const validName = new RegExp(
  '^[a-zA-Z0-9-_]{1,20}$'
);

const Settings = ({socket}: Props) => {  

  const [user, setUser] = useState<User>();
  var [username, setUsername] = useState<string>('');
  var [tfaImage, setTfaImage] = useState<string | null>(null);
  const [picturefile, setPictureFile] = useState<File>();
  var [picture, setPicture] = useState<string | undefined>(undefined);
  var [error, setError] = useState<boolean>(false);
  var [tfaCode, setTfaCode] = useState<string>('');
  var [shouldUpdate, setShouldUpdate] = useState<boolean>(false);

  const [gotUser, setGotUser] = useState<boolean>(false)
  
  useEffect(() => {
  (async () => {
    try {
      const { data } = await axios.get("user");
      setUser(data);
      setGotUser(true);
    } catch (e) {
      <Navigate to={'/error500'} />
    }
  }
  )();
  setShouldUpdate(false);
  }, [shouldUpdate]);

  const handleTfaSubmit = async(event: any) => {
    event.preventDefault();
    try {
    const data = await axios({
      method: 'post',
      url: "/user/tfa/secret/",
      responseType: 'arraybuffer'
    });
    setTfaImage('data:image/jpeg;base64,' + encode(data.data));} catch {
      window.alert("There was an error");
    }
  }

  const handleUsernameSubmit = async(event: any) => {
    event.preventDefault();

    console.log(!validName.test(username));
    if (!validName.test(username)) {
      window.alert("Invalid format for username: only alphanumeric characters and dashes are allowed");
      return;
    }
    
    if (!username || user?.username === username){
      return;
    }
    try {
      await axios.post("/user/username", { username: username });
      socket?.emit('changeUsernameToServer', { username: username });
    }
    catch (e:any) {
      if (e.response.status === 401 ) {
        window.alert("Username already taken");
      }
      else {
        setError(true);
      }
    }
    setUsername('');
    setShouldUpdate(true);
  }

  const handlePictureSubmit = async(event: any) => {
    event.preventDefault();
    let formData = new FormData();
    if (picturefile !== undefined) {
      formData.append("picture", picturefile, picturefile.name);    
    }
    try {
      await axios.post("/user/picture", formData, { headers: {'content-type': 'multipart/form-data'}} );
    }
    catch (e) {
      <Navigate to={'/error500'} />
    }
  }

  const handleTfaTurnOn = async(event: any) => {
    event.preventDefault();
    try {
      await axios.post("/user/tfa/turn-on", { tfaCode: tfaCode });
    }
    catch (e) {
      window.alert(`There was an error`);
    }
  }

  const handleTfaTurnOff = async(event: any) => {
    event.preventDefault();
    try {
      await axios.post("/user/tfa/turn-off", { tfaCode: tfaCode });
      const { data } = await axios.get("user");
      setUser(data);
    }
    catch (e) {
      window.alert(`There was an error`);
    }
  }

  const handleChange = (event: any) => {
    setUsername(event.target.value);
  }

  const handleTfaCodeChange = (event: any) => {
    setTfaCode(event.target.value);
  }	

  const handlePictureChange = (event: any) => {
    setPicture(URL.createObjectURL(event.target.files[0]));
    setPictureFile(event.target.files[0]);
  }

  if (error)
  {
    return <Navigate to={'/error500'} />
  }

  return (
    <Wrapper>
      <div className="settings">
        <h1 className="title">Settings</h1>
        {(gotUser) ? (
         <>
         <div className="user-name">
            {
              (picture) ?
              (<img className="profile-picture" src={picture} alt="avatar" />) : 
              (<img className="profile-picture" src={'http://' + process.env.REACT_APP_HOST + ':3000' + `/user/picture/${user?.picture}`} alt="avatar" />)
            }
            {(username) && (<h1>{username}'s profile</h1>)}
            {(!username && user?.username) && (<h1>{user?.username}'s profile</h1>)}
          </div>
        <form onSubmit={handleUsernameSubmit}>
          <input
            className="username input"
            type="string"
            name="username"
            placeholder={user?.username}
            value={username}
            onChange={handleChange}
          />
          <input type="submit" value="Save"/>
        </form>

        <form onSubmit={handlePictureSubmit}>
            <input
              className="picture input"
              type="file"
              name="picture"
              accept="image/png, image/jpeg"
              onChange={handlePictureChange}
            />
            <input type="submit" value="Save"/>
        </form>
        {(user && !user.tfaEnabled === true) ? (
        <form onSubmit={handleTfaSubmit}>
          <div className="tfa input">
          <input type="submit" value="Enable Two Factor Authentication"/>
          </div>
        </form>) : (
        <form onSubmit={handleTfaTurnOff}>
          <div className="tfa input">
            <h2>deactivate TFA</h2>
            <input type="text" name="tfaCode" placeholder="Enter TFA Code" value={tfaCode} onChange={handleTfaCodeChange}/>
            <input type="submit" value="Turn Off TFA"/>
          </div>
        </form>
        )}
        { (tfaImage) && (
          <div>
            <div className="tfa-qr">
              <img src={tfaImage} alt="tfa-qr" />
            </div>
            <div>
              <h1>Scan the QR code to setup your two factor authentication</h1>
            </div>
            <form onSubmit={handleTfaTurnOn}>
            <input className="tfa-code input" type="string" name="tfa-code" placeholder="Enter code" onChange={handleTfaCodeChange} />
            <input type="submit" value="Save"/>
        </form>
          </div>
        )}
        </>
        ) : 
        (<div><h1>Loading</h1></div>)
      }
      </div>
    </Wrapper>
  );

};

export default Settings;
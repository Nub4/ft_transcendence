import axios from "axios";
import { useState, useEffect } from "react";
import { Navigate } from "react-router";
import Wrapper from "../../components/Wrapper";
import { encode } from "base64-arraybuffer";
import './Settings.css'


export interface tfaDto {
  tfa: boolean;
}

const Settings = () => {  

  
  var [username, setUsername] = useState<string>('');
  const [prevusername, setPrevUsername] = useState<string>();
  var [tfa, setTfa] = useState<boolean>(false);
  var [tfaImage, setTfaImage] = useState<string | null>(null)
  const [picturefile, setPictureFile] = useState<File>();
  var [picture, setPicture] = useState<string>('');
  var [prevpicture, setPrevPicture] = useState<string>();
  
  useEffect(() => {
  (async () => {
    const { data } = await axios.get("user");
    try {
      setPrevUsername(data.username);
      setPrevPicture(data.picture);
      // setTfa(data.tfa);
    } catch (e) {
      <Navigate to={'/error500'} />
    }
  }
  )();
  }, []);

  const handleTfaSubmit = async(event: any) => {
    event.preventDefault();
    const tfaForm: tfaDto = { tfa: tfa };
    const data = await axios({
      method: 'post',
      url: "/user/tfa/secret/",
      data: tfaForm,
      headers: {'content-type': 'application/json'},
      responseType: 'arraybuffer'
    });
    console.log(data.data);
    setTfaImage('data:image/jpeg;base64,' + encode(data.data));

    
  }

  const handleUsernameSubmit = async(event: any) => {
    event.preventDefault();

    const formData = new FormData();
    if (username)
      formData.append("username", username);
    else if (prevusername && !username)
      formData.append("username", prevusername);
    try {
     
      const { data } = await axios.post("/user/username", { username: username });
      console.log(data);
    }
    catch (e) {
      <Navigate to={'/error500'} />
    }
  }

  const handlePictureSubmit = async(event: any) => {
    event.preventDefault();
    let formData = new FormData();
    if (picturefile !== undefined) {
      formData.append("picture", picturefile, picturefile.name);
      console.log(picturefile.name);
    
    }
    try {
      const { data } = await axios.post("/user/picture", formData, { headers: {'content-type': 'multipart/form-data'}} );
    }
    catch (e) {
      <Navigate to={'/error500'} />
    }
  }

  const handleChange = (event: any) => {
    setUsername(event.target.value);
  }

  const handlePictureChange = (event: any) => {
    setPicture(URL.createObjectURL(event.target.files[0]));
    setPictureFile(event.target.files[0]);
  }

  const handleTfaChange = (event: any) => {
    console.log("checked : " + event.target.checked);
    setTfa(event.target.checked);
    console.log(tfa);
    console.log(tfa);
    console.log(tfa);

  }

  return (
    <Wrapper>
      <div className="settings">
        <h1 className="title">Settings</h1>
        { (username) && (
            <div className="user-name">
            <img className="profile-picture" src={picture} alt="avatar" />
            <h1>{username}'s profile</h1>
            </div>
          )}
          { (prevusername) && (!username) && (
            <div className="user-name">
            <img className="profile-picture" src={picture} alt="avatar" />
            <h1>{prevusername}'s profile</h1>
            </div>
          )}
          
        <form onSubmit={handleUsernameSubmit}>
          <input
            className="username input"
            type="string"
            name="username"
            placeholder={prevusername}
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

        <form onSubmit={handleTfaSubmit}>
          <div className="tfa input">
            <input
              className="tfa"
              type="checkbox"
              name="Two Factor Auth"
              value="Two Factor Auth"
              onChange={handleTfaChange}/>
              Two Factor Auth
          </div>
          <input type="submit" value="Save"/>
        </form>
        { (tfaImage) && (
        <div className="tfa-qr">
          <img src={tfaImage} alt="tfa-qr" />
        </div>)}
      </div>
    </Wrapper>
  );
};

export default Settings;
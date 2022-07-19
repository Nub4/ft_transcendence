import axios from "axios";
import { useLocation } from "react-router";
import React, { SyntheticEvent, useEffect, useState } from "react";

import { AiOutlineUserAdd, AiOutlineUserDelete, AiOutlineAudioMuted, } from 'react-icons/ai';
import { GoMute, GoUnmute } from 'react-icons/go';
import { RiRotateLockFill, RiAdminLine } from 'react-icons/ri';
import { GiPadlock, GiPadlockOpen } from 'react-icons/gi';
import Popup from 'reactjs-popup';
import { Link } from 'react-router-dom';
import { User } from "../../models/user";
import { ChannelEntity } from "../../models/Chat";
import './SettingsPage.css'
import Wrapper from "../../components/Wrapper";
import { AdminUserDto, JoinedUserStatusDto, SetPasswordDto } from "./chatSettings.dto";



// 1 = owner 2 = admin 3 = password=true 4 = channel=private

const ChatSettings = () =>{
	const queryParams = new URLSearchParams(useLocation().search);
	const ChatName = queryParams.get("ChatSettingsId");

	// const [UserStatus, setUserStatus] = useState('');
	// const [currentChannel, setCurrentChannel] = useState('');


	// useEffect(() => {
	// 	(
	// 	  async () => {
	// 		const {data} = await axios.get(`chat/${ChatName}`);
	// 		console.log(data);
	// 		setCurrentChannel(data);
	// 	  }
	// 	)();
	//   }, []);

    return (
	<Wrapper>
		<div className='new-user'>
			<h1>
				<u>
					SETTINGS : <p/>
				</u> 
			</h1>
			{/* { 4 && <AddUser chatName={ChatName}/>} */}
			{ 1 && <AdminUser chatName={ChatName}/>} 
			{ (1 || 2) && (<BanUser chatName={ChatName}/>)}
			{ 1 && 3 && (<AddPassword chatName={ChatName}/>)}
			{ 1 && 3 && (<ModifyPassword chatName={ChatName}/>)}
			{ 1 && 3 && (<RemovePassword chatName={ChatName}/>)}
			{ (1 || 2) && (<MuteUser chatName={ChatName}/>)}
			{ (1 || 2) && (<UnmuteUser chatName={ChatName}/>)}
		</div>
		<Link to={`/chat?chatId=${ChatName}`} className="button-return" type="submit">Return</Link>
    </Wrapper>
    );
}

interface prop {
	chatName: string | null
}

interface prop2 {
	message: string,
	success: boolean
}

// const AddUser = (ChatName:prop) => {
// 	const [state, setState] = useState(false); 
// 	const handleOpen = () => {setState(true);}
// 	const handleClose = () => {setState(false);}
// 	const [userToAdd, setUserToAdd] = useState('');

// 	const handleClick = async() => {
// 		try {
// 			const username = (document.getElementById("add user") as HTMLInputElement).value;
// 			const {data} = await axios.get(`user/get/user?username=${username}`)
// 			setUserToAdd(data);
// 			if (data == "")
// 				window.alert("Wrong username");
// 			// await axios.post('chat/add', { ChatName, '' })
// 		} catch (e) {
// 			console.log("here");
// 		}
// 	};

// 	return (
// 	<h2>
// 		Add user : &nbsp;&nbsp;
// 		<Popup
// 			trigger={<button><AiOutlineUserAdd/></button>}
// 			on='click'
// 			open={state}
// 			onClose={handleClose}
// 			onOpen={handleOpen}
// 			position='top right' modal nested>
// 			<div className="modal2">
// 				<button className="close" onClick={handleClose}>&times;</button>
// 				<div className="header"> Add user</div>
// 				<div className="content">
// 				{' '}
// 				<pre>      Select user to add      </pre>
// 				</div>
// 				<div className="actions">
// 					<div className="actions">
// 						<input className="input-width" id='add user' type="text" placeholder="Enter the user name"></input>
// 						<button className="button-return" onClick={() => handleClick()}>Invite user</button>
// 					</div>
// 				</div>
// 			</div>
// 		</Popup>
// 	</h2>)
// }

const AdminUser = (ChatName:prop) => {
	const [state, setState] = useState(false); 
	const handleOpen = () => {setState(true); onModalOpen()};
	const handleClose = () => {setState(false);}
	const [userList, setUserList] = useState([]);
	const [popupMessage, setPopupMessage] = useState("");
	const [actionSuccess, setActionSuccess] = useState(false);

	const onModalOpen = async() => {
	try {
		setPopupMessage("");
		const {data} = await axios.get(`chat/getusers/${ChatName.chatName}`);
		setUserList(data);
		} catch (e) {
			console.log("here")
		}
	};

	const handleClick = async( userId:number ) => {
		try {
			const name = ChatName.chatName!;
			const adminForm : AdminUserDto = { name : name, adminId : userId }
			const data = await axios({
					method: 'post',
					url: "chat/admin",
					data: adminForm,
					headers: {'content-type': 'application/json'}
				})
			setPopupMessage("User successfully set as admin");
			setActionSuccess(true);
			handleClose();
		} catch (e:any) {
			setPopupMessage(e.response.data.message);
			setActionSuccess(false);
			handleClose();
		}
	};

	return (
	<h2>
		Make a chat user admin : &nbsp;&nbsp;
		<Popup trigger={<button>
			<RiAdminLine /></button>}
			on='click'
			open={state}
			onClose={handleClose}
			onOpen={handleOpen}
			position='top right' modal nested>
			<div className='modal2'>
				<button className="close" onClick={handleClose}>
				&times;
				</button>
				<div className="header"> Make user admin</div>
				<div className="content">
				{' '}
				<pre>  Select a user to give him administrator role  </pre>
				</div>
				<div className="actions">
				<Popup
					trigger={<button className="button-return"> Select user </button>}
					modal nested>
						{userList.map((user: User) => {
							return (
								<div key={user.id}>
									<div className="menu-settings">
										<div className="menu-item-settings" onClick={() => handleClick(user.id)}>{user.username}</div>
									</div>
								</div>
							)
						})}
				</Popup>
				</div>
			</div>
		</Popup>
		{ popupMessage != "" && <ModalMessage message={popupMessage} success={actionSuccess} /> }
	</h2>)
}

const BanUser = (ChatName:prop) => {
	const [state, setState] = useState(false); 
	const handleOpen = () => {setState(true); onModalOpen();}
	const handleClose = () => {setState(false);}
	const [userList, setUserList] = useState([]);
	const [popupMessage, setPopupMessage] = useState("");
	const [actionSuccess, setActionSuccess] = useState(false);

	const onModalOpen = async() => {
	try {
		setPopupMessage("");
		const {data} = await axios.get(`chat/getusers/${ChatName.chatName}`);
		setUserList(data);
		} catch (e) {
			console.log("here")
		}
	};

	const handleClick = async( userId:number ) => {
		try {
			const name = ChatName.chatName!;
			const adminForm : JoinedUserStatusDto = { name : name, targetId : userId }
			const data = await axios({
					method: 'patch',
					url: "chat/ban",
					data: adminForm,
					headers: {'content-type': 'application/json'}
				})
				setPopupMessage("User successfully banned");
				setActionSuccess(true);
				handleClose();
			} catch (e:any) {
				setPopupMessage(e.response.data.message);
				setActionSuccess(false);
				handleClose();
			}
	};

	
	return (
	<h2>
		Ban user : &nbsp;&nbsp;
		<Popup trigger={<button>
			<AiOutlineUserDelete /></button>}
			on='click'
			open={state}
			onClose={handleClose}
			onOpen={handleOpen}
			position='top right' modal nested>
			<div className='modal2'>
				<button className="close" onClick={handleClose}>
				&times;
				</button>
				<div className="header"> Ban user</div>
				<div className="content">
				{' '}
				<pre>      Select user to ban from the chanel     </pre>
				</div>
				<div className="actions">
				<Popup
					trigger={<button className="button-return"> Select user </button>}
					modal nested>
						{userList.map((user: User) => {
							return (
								<div key={user.id}>
									<div className="menu-settings">
										<div className="menu-item-settings" onClick={() => handleClick(user.id)}>{user.username}</div>
									</div>
								</div>
							)
						})}
				</Popup>
				</div>
			</div>
		</Popup>
		{ popupMessage != "" && <ModalMessage message={popupMessage} success={actionSuccess} /> }
	</h2>)
}

const AddPassword = (ChatName:prop) => {
	const [state, setState] = useState(false); 
	const handleOpen = () => {setPopupMessage(""); setState(true);}
	const handleClose = () => {setState(false);}
	const [popupMessage, setPopupMessage] = useState("");
	const [actionSuccess, setActionSuccess] = useState(false);
	// const [newPassword, setNewPassword] = useState('');

	const handleClick = async() => {
		try {
			const newpwd = (document.getElementById("new password") as HTMLInputElement).value;

			const adminForm : SetPasswordDto = { name : ChatName.chatName!, password : newpwd }
			const data = await axios({
					method: 'patch',
					url: "chat/password",
					data: adminForm,
					headers: {'content-type': 'application/json'}
				});
				setPopupMessage("Password successfully added");
				setActionSuccess(true);
				handleClose();
			} catch (e:any) {
				setPopupMessage(e.response.data.message);
				setActionSuccess(false);
				handleClose();
		}
	};

	return (
	<h2>
		Add password : &nbsp;&nbsp;
		<Popup trigger={<button>
			<GiPadlock /></button>}
			on='click'
			open={state}
			onClose={handleClose}
			onOpen={handleOpen}
			position='top right' modal nested>
			<div className='modal2'>
				<button className="close" onClick={handleClose}>
					&times;
				</button>
				<div className="header"> Add password to channel</div>
				<div className="content">
					{' '}
					<pre>   Please enter a new password   </pre>
				</div>
				<div className="actions">
					<input className="input-width" id='new password' type="text" placeholder="Enter the new password"></input>
					<button className="button-return" onClick={() => handleClick()}>Set password</button>
				</div>
			</div>
		</Popup>
		{ popupMessage != "" && <ModalMessage message={popupMessage} success={actionSuccess} /> }
	</h2>)
}

const ModifyPassword = (ChatName:prop) => {
	const [state, setState] = useState(false); 
	const handleOpen = () => {setPopupMessage(""); setState(true);}
	const handleClose = () => {setState(false);}
	const [popupMessage, setPopupMessage] = useState("");
	const [actionSuccess, setActionSuccess] = useState(false);
	
	const handleClick = async() => {
		try {
			const newpwd = (document.getElementById("modify password") as HTMLInputElement).value;

			const adminForm : SetPasswordDto = { name : ChatName.chatName!, password : newpwd }
			const data = await axios({
					method: 'patch',
					url: "chat/modifypassword",
					data: adminForm,
					headers: {'content-type': 'application/json'}
				})
				setPopupMessage("Password modified successfully");
				setActionSuccess(true);
				handleClose();
			} catch (e:any) {
				setPopupMessage(e.response.data.message);
				setActionSuccess(false);
				handleClose();
		}
	};

	return (
	<h2>
		Modify password : &nbsp;&nbsp;
		<Popup trigger={<button>
			<RiRotateLockFill /></button>}
			on='click'
			open={state}
			onClose={handleClose}
			onOpen={handleOpen}
			position='top right' modal nested>
			<div className='modal2'>
				<button className="close" onClick={handleClose}>
				&times;
				</button>
				<div className="header"> Modify password</div>
				<div className="content">
				{' '}
				<pre>      Enter a new password      </pre>
				</div>
				<div className="actions">
					<input className="input-width" id='modify password' type="text" placeholder="Enter the new password"></input>
					<button className="button-return" onClick={() => handleClick()}>Change password</button>
				</div>
			</div>
		</Popup>
		{ popupMessage != "" && <ModalMessage message={popupMessage} success={actionSuccess} /> }
	</h2>)
}

const RemovePassword = (ChatName:prop) => {
	const [state, setState] = useState(false); 
	const handleOpen = () => {setPopupMessage(""); setState(true);}
	const handleClose = () => {setState(false);}
	const [popupMessage, setPopupMessage] = useState("");
	const [actionSuccess, setActionSuccess] = useState(false);
	
	const handleClick = async() => {
		try {
			const data = await axios({
					method: 'patch',
					url: "chat/removepassword",
					data: ChatName,
					headers: {'content-type': 'application/json'}
				})
				setPopupMessage("Password successfully removed");
				setActionSuccess(true);
				handleClose();
			} catch (e:any) {
				setPopupMessage(e.response.data.message);
				setActionSuccess(false);
				handleClose();
		}
	};

	return (
	<h2>
		Remove password : &nbsp;&nbsp;
		<Popup trigger={<button>
			<GiPadlockOpen /></button>}
			on='click'
			open={state}
			onClose={handleClose}
			onOpen={handleOpen}
			position='top right' modal nested>
			<div className='modal2'>
				<button className="close" onClick={handleClose}>
				&times;
				</button>
				<div className="header"> Remove password</div>
				<div className="content">
				{' '}
				<pre>    Remove the password   </pre>
				</div>
				<div className="actions">
					<button onClick={handleClick} className="button-return"> Remove password </button>
				</div>
			</div>
		</Popup>
		{ popupMessage != "" && <ModalMessage message={popupMessage} success={actionSuccess} /> }
	</h2>)
}

const MuteUser = (ChatName:prop) => {
	const [state, setState] = useState(false); 
	const handleOpen = () => {setState(true); onModalOpen();}
	const handleClose = () => {setState(false);}
	const [userList, setUserList] = useState([]);
	const [popupMessage, setPopupMessage] = useState("");
	const [actionSuccess, setActionSuccess] = useState(false);

	const onModalOpen = async() => {
	try {
		setPopupMessage("");
		const {data} = await axios.get(`chat/getusers/${ChatName.chatName}`);
		setUserList(data);
		} catch (e) {
			console.log("here")
		}
	};

	const handleClick = async( userId:number ) => {
		try {
			const name = ChatName.chatName!;
			const adminForm : JoinedUserStatusDto = { name : name, targetId : userId }
			const data = await axios({
					method: 'patch',
					url: "chat/mute",
					data: adminForm,
					headers: {'content-type': 'application/json'}
				})
				setPopupMessage("User successfully muted");
				setActionSuccess(true);
				handleClose();
			} catch (e:any) {
				setPopupMessage(e.response.data.message);
				setActionSuccess(false);
				handleClose();
		}
	};

	return (
	<h2>
		Mute user : &nbsp;&nbsp;
		<Popup trigger={<button>
			<GoMute /></button>}
			on='click'
			open={state}
			onClose={handleClose}
			onOpen={handleOpen}
			position='top right' modal nested>
			<div className='modal2'>
				<button className="close" onClick={handleClose}>
				&times;
				</button>
				<div className="header"> Mute user</div>
				<div className="content">
				{' '}
				<pre>      Select user to mute      </pre>
				</div>
				<div className="actions">
				<Popup
					trigger={<button className="button-return"> Select user </button>}
					modal nested>
					{userList.map((user: User) => {
						return (
							<div key={user.id}>
								<div className="menu-settings">
									<div className="menu-item-settings" onClick={() => handleClick(user.id)}>{user.username}</div>
								</div>
							</div>
						)
					})}
				</Popup>
				</div>
			</div>
		</Popup>
		{ popupMessage != "" && <ModalMessage message={popupMessage} success={actionSuccess} /> }
	</h2>)
}

const UnmuteUser = (ChatName:prop) => {
	const [state, setState] = useState(false); 
	const handleOpen = () => {setState(true); onModalOpen();}
	const handleClose = () => {setState(false);}
	const [userList, setUserList] = useState([]);
	const [popupMessage, setPopupMessage] = useState("");
	const [actionSuccess, setActionSuccess] = useState(false);

	const onModalOpen = async() => {
	try {
		setPopupMessage("");
		const {data} = await axios.get(`chat/getusers/${ChatName.chatName}`);
		setUserList(data);
		} catch (e) {
			console.log("here")
		}
	};

	const handleClick = async( userId:number ) => {
		try {
			const name = ChatName.chatName!;
			const adminForm : JoinedUserStatusDto = { name : name, targetId : userId }
			handleClose();
			const data = await axios({
					method: 'patch',
					url: "chat/unmute",
					data: adminForm,
					headers: {'content-type': 'application/json'}
				});
				setPopupMessage("User successfully unmuted");
				setActionSuccess(true);
				handleClose();
			} catch (e:any) {
				setPopupMessage(e.response.data.message);
				setActionSuccess(false);
				handleClose();
		}
	};

	return (
	<h2>
		Unmute user : &nbsp;&nbsp;
		<Popup trigger={<button>
			<GoUnmute /></button>}
			on='click'
			open={state}
			onClose={handleClose}
			onOpen={handleOpen}
			position='top right' modal nested>
			<div className='modal2'>
				<button className="close" onClick={handleClose}>
				&times;
				</button>
				<div className="header"> Unmute user</div>
				<div className="content">
				{' '}
				<pre>      Select user to unmute      </pre>
				</div>
				<div className="actions">
					<Popup
						trigger={<button className="button-return"> Select user </button>}
						modal nested>
						{userList.map((user: User) => {
							return (
								<div key={user.id}>
									<div className="menu-settings">
										<div className="menu-item-settings" onClick={() => handleClick(user.id)}>{user.username}</div>
									</div>
								</div>
							)
						})}
					</Popup>
				</div>
			</div>
		</Popup>
		{ popupMessage != "" && <ModalMessage message={popupMessage} success={actionSuccess} /> }
	</h2>)
}


const ModalMessage = (prop:prop2) => {
	const [state, setState] = useState(true);
	const handleOpen = () => {setState(true);}
	const handleClose = () => {console.log("yoo");setState(false);}

	return (
		<Popup
			open={state}
			onClose={handleClose}
			onOpen={handleOpen}
			position='top right' modal nested>
			<div className='modal2'>
				{prop.success && (<div className="content">
				{' '}
					<h1 color="green">{prop.message}</h1>
				</div>)}
				{!prop.success && (<div className="content">
				{' '}
					<h1 color="red">{prop.message}</h1>
				</div>)}
				<button onClick={handleClose}>close&times;</button>
			</div>
		</Popup>
	)
}

export default ChatSettings;
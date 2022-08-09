import axios from "axios";
import { Navigate, useLocation } from "react-router";
import React, { useEffect, useState } from "react";
import { AiOutlineUserAdd, AiOutlineUserDelete, AiOutlineUsergroupAdd } from 'react-icons/ai';
import { GoMute, GoUnmute } from 'react-icons/go';
import { RiRotateLockFill, RiAdminLine } from 'react-icons/ri';
import { GiPadlock, GiPadlockOpen } from 'react-icons/gi';
import Popup from 'reactjs-popup';
import { User } from "../../models/user";
import './SettingsPage.css'
import Wrapper from "../../components/Wrapper";
import { AdminUserDto, JoinedUserStatusDto, SetPasswordDto } from "./chatSettings.dto";
import ModalMessage from "./ModalMessage"
import { Socket } from "socket.io-client";

type Props = {
	  socket: Socket | null,
	  banned: string,
}

const ChatSettings = ({socket, banned}:Props) =>{
	const queryParams = new URLSearchParams(useLocation().search);
	const chatName = queryParams.get("ChatSettingsId");
    const [redirect, setRedirect] = useState(false);
	const [redirectToChat, setRedirectToChat] = useState(false);
	const [currentChatStatus, setCurrentChatStatus] = useState("");
	const [popupMessage, setPopupMessage] = useState("");
	const [myName, setMyName] = useState('');


	useEffect(() => {
		setPopupMessage("");
		const chatStatus = async () => {
		try {
		  const data = await axios.get(`chat/${chatName}`);
			return data.data.status;
		} catch {
			setPopupMessage("There was an error");
		}
		}
		chatStatus().then(Status => {
			setCurrentChatStatus(Status);
		});
	}, [])

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
	  }, [socket, banned]);

    if (redirect === true)
    {
        return <Navigate to={'/channels'} />;
    }

	if (redirectToChat === true)
    {
        return <Navigate to={`/chat?chatId=${chatName}`} />;
    }

    return (
	<Wrapper>
		<div className='new-user'>
			<h1>
				<u>
					SETTINGS : <p/>
				</u> 
			</h1>
			{ currentChatStatus == "private" && <AddUser chatName={chatName}/>}
			{ <AdminUser chatName={chatName}/>}
			{ (<BanUser chatName={chatName} socket={socket}/>)}
			{ (<UnbanUser chatName={chatName}/>)}
			{ currentChatStatus !== "private" && (<AddPassword chatName={chatName}/>)}
			{ currentChatStatus !== "private" && (<ModifyPassword chatName={chatName}/>)}
			{ currentChatStatus !== "private" && (<RemovePassword chatName={chatName}/>)}
			{ (<MuteUser chatName={chatName}/>)}
			{ (<UnmuteUser chatName={chatName}/>)}
		</div>
		<button className='back-button' onClick={() => {
			      socket?.emit('joinToServer', { name: chatName });
				  setRedirectToChat(true);
		}}>Return</button>
	{ popupMessage != "" && <ModalMessage message={popupMessage} success={false} /> }
    </Wrapper>
    );
}

interface prop {
	chatName: string | null
}

const AddUser = (chatName:prop) => {
	const [state, setState] = useState(false); 
	const handleOpen = () => {setState(true);}
	const handleClose = () => {setState(false);}
	const [popupMessage, setPopupMessage] = useState("");
	const [actionSuccess, setActionSuccess] = useState(false);

	const handleClick = async() => {
		try {
			setPopupMessage("");
			const username = (document.getElementById("add user") as HTMLInputElement).value;
			const {data} = await axios.get(`user/get/user?username=${username}`)
			if (data == "")
			{
				setPopupMessage("User not found");
				setActionSuccess(false);
				return ;
			}
			const adminForm : JoinedUserStatusDto = { name : chatName.chatName!, targetId : data.id }
			await axios({
				method: 'post',
				url: "chat/invite",
				data: adminForm,
				headers: {'content-type': 'application/json'}
			})
			setPopupMessage("User added");
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
		Add user : &nbsp;&nbsp;
		<Popup
			trigger={<button><AiOutlineUserAdd/></button>}
			on='click'
			open={state}
			onClose={handleClose}
			onOpen={handleOpen}
			position='top right' modal nested>
			<div className="modal2">
				<button className="close" onClick={handleClose}>&times;</button>
				<div className="header"> Add user</div>
				<div className="content">
				{' '}
				<pre>      Select user to add      </pre>
				</div>
				<div className="actions">
					<div className="actions">
						<input className="input-width" id='add user' type="text" placeholder="Enter the user name"></input>
						<button className="button-return" onClick={() => handleClick()}>Invite user</button>
					</div>
				</div>
			</div>
		</Popup>
		{ popupMessage != "" && <ModalMessage message={popupMessage} success={actionSuccess} /> }
	</h2>)
}

const AdminUser = (chatName:prop) => {
	const [state, setState] = useState(false); 
	const handleOpen = () => {setState(true); onModalOpen()};
	const handleClose = () => {setState(false);}
	const [userList, setUserList] = useState([]);
	const [popupMessage, setPopupMessage] = useState("");
	const [actionSuccess, setActionSuccess] = useState(false);

	const onModalOpen = async() => {
	try {
		setPopupMessage("");
		const {data} = await axios.get(`chat/getusers/${chatName.chatName}`);
		setUserList(data);
		} catch (e) {
			setPopupMessage("There was an error");
			setActionSuccess(false);
		}
	};

	const handleClick = async( userId:number ) => {
		try {
			const name = chatName.chatName!;
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

type Props2 = {
	socket: Socket | null,
	chatName: string | null,
}

const BanUser = ({chatName, socket}: Props2) => {
	const [state, setState] = useState(false); 
	const handleOpen = () => {setState(true); onModalOpen();}
	const handleClose = () => {setState(false);}
	const [userList, setUserList] = useState([]);
	const [popupMessage, setPopupMessage] = useState("");
	const [actionSuccess, setActionSuccess] = useState(false);

	const onModalOpen = async() => {
	try {
		setPopupMessage("");
		const {data} = await axios.get(`chat/getusers/${chatName}`);
		setUserList(data);
		} catch (e) {
			
		}
	};

	const handleClick = async( userId:number ) => {
		try {
			const name = chatName!;
			const adminForm : JoinedUserStatusDto = { name : name, targetId : userId }
			const data = await axios({
					method: 'patch',
					url: "chat/ban",
					data: adminForm,
					headers: {'content-type': 'application/json'}
				});
				socket?.emit('isBannedToServer', { id: userId });
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


const UnbanUser = (chatName:prop) => {
	const [state, setState] = useState(false); 
	const handleOpen = () => {setState(true); onModalOpen();}
	const handleClose = () => {setState(false);}
	const [userList, setUserList] = useState([]);
	const [popupMessage, setPopupMessage] = useState("");
	const [actionSuccess, setActionSuccess] = useState(false);

	const onModalOpen = async() => {
	try {
		setPopupMessage("");
		const {data} = await axios.get(`chat/getusers/${chatName.chatName}`);
		setUserList(data);
		} catch (e) {
			setPopupMessage("There was an error");
			setActionSuccess(false);			
		}
	};

	const handleClick = async( userId:number ) => {
		try {
			const name = chatName.chatName!;
			const adminForm : JoinedUserStatusDto = { name : name, targetId : userId }
			handleClose();
			const data = await axios({
					method: 'patch',
					url: "chat/unban",
					data: adminForm,
					headers: {'content-type': 'application/json'}
				});
				setPopupMessage("User successfully unbanned");
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
		Unban user : &nbsp;&nbsp;
		<Popup trigger={<button>
			<AiOutlineUsergroupAdd /></button>}
			on='click'
			open={state}
			onClose={handleClose}
			onOpen={handleOpen}
			position='top right' modal nested>
			<div className='modal2'>
				<button className="close" onClick={handleClose}>
				&times;
				</button>
				<div className="header"> Unban user</div>
				<div className="content">
				{' '}
				<pre>      Select user to unban      </pre>
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

const AddPassword = (chatName:prop) => {
	const [state, setState] = useState(false); 
	const handleOpen = () => {setPopupMessage(""); setState(true);}
	const handleClose = () => {setState(false);}
	const [popupMessage, setPopupMessage] = useState("");
	const [actionSuccess, setActionSuccess] = useState(false);

	const handleClick = async() => {
		try {
			const newpwd = (document.getElementById("new password") as HTMLInputElement).value;

			const adminForm : SetPasswordDto = { name : chatName.chatName!, password : newpwd }
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

const ModifyPassword = (chatName:prop) => {
	const [state, setState] = useState(false); 
	const handleOpen = () => {setPopupMessage(""); setState(true);}
	const handleClose = () => {setState(false);}
	const [popupMessage, setPopupMessage] = useState("");
	const [actionSuccess, setActionSuccess] = useState(false);
	
	const handleClick = async() => {
		try {
			const newpwd = (document.getElementById("modify password") as HTMLInputElement).value;

			const adminForm : SetPasswordDto = { name : chatName.chatName!, password : newpwd }
			const data = await axios({
					method: 'patch',
					url: "chat/password",
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

const RemovePassword = (chatName:prop) => {
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
					data: {name:chatName.chatName},
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

const MuteUser = (chatName:prop) => {
	const [state, setState] = useState(false); 
	const handleOpen = () => {setState(true); onModalOpen();}
	const handleClose = () => {setState(false);}
	const [userList, setUserList] = useState([]);
	const [popupMessage, setPopupMessage] = useState("");
	const [actionSuccess, setActionSuccess] = useState(false);

	const onModalOpen = async() => {
	try {
		setPopupMessage("");
		const {data} = await axios.get(`chat/getusers/${chatName.chatName}`);
		setUserList(data);
		} catch (e) {
			setPopupMessage("There was an error");
			setActionSuccess(false);			
		}
	};

	const handleClick = async( userId:number ) => {
		try {
			const name = chatName.chatName!;
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

const UnmuteUser = (chatName:prop) => {
	const [state, setState] = useState(false); 
	const handleOpen = () => {setState(true); onModalOpen();}
	const handleClose = () => {setState(false);}
	const [userList, setUserList] = useState([]);
	const [popupMessage, setPopupMessage] = useState("");
	const [actionSuccess, setActionSuccess] = useState(false);

	const onModalOpen = async() => {
	try {
		setPopupMessage("");
		const {data} = await axios.get(`chat/getusers/${chatName.chatName}`);
		setUserList(data);
		} catch (e) {
			setPopupMessage("There was an error");
			setActionSuccess(false);
		}
	};

	const handleClick = async( userId:number ) => {
		try {
			const name = chatName.chatName!;
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

export default ChatSettings;
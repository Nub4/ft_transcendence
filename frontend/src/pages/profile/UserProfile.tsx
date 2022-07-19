import * as React from "react";
import { Component } from "react";
import axios from "axios";
import {Socket} from "socket.io-client";
import Wrapper from "../../components/Wrapper";
import { User, UserLevel, UserStatus } from "../../models/user";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import { faGear } from '@fortawesome/free-solid-svg-icons'
import { Link, Navigate } from "react-router-dom";
import './Profile.css'


interface State {
  user: User;
  friends: User[];
  matchHistory: any[];
  socket: Socket | null;
}

interface Props {
  socket: Socket | null;
  user: User;
  setParentState: any;
  friends: User[];
}

export default class UserProfile extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      user: this.props.user,
      friends: this.props.friends,
      matchHistory: [],
      socket: this.props.socket,
    };
    this.componentDidMount = this.componentDidMount.bind(this); 
    console.log("user", this.props.user);
  }
  
  componentDidMount() {
    if (this.state.socket?.connected === false) {
      this.state.socket?.connect();
    }
    this.getMatchHistory().then(matchHistory => {
      this.setState({matchHistory: matchHistory});
    }, error => {
      console.log(error);
    })

  }

  async getMatchHistory() {
    const data = await axios.get(`/match/${this.state.user.id}`)
    try {
      return(data.data);
    } catch (e) {
      return <Navigate to={'/error500'} />;
    }
  }

  async getUser() {
    const data = await axios.get(`/user`)
    try {
      return(data.data);
    } catch (e) {
      return <Navigate to={'/error500'} />;
    }
  }

  render() {
    // console.log("this.state.user", this.state.user);
    // console.log("this.props.user", this.props.user);
    
    return (
      <div>
        <div className="user-profile">
          <div className="user-name">
            <img className="profile-picture" src={`http://localhost:3000/user/picture/${this.state.user.picture}`} alt="avatar" />
            <h1>{this.state.user.username}'s profile</h1>
              <span className="status-online">Online</span>
          </div>
        </div>
        <div className="settings">
          <div className="settings-gear">
            <Link to="/profile/settings">
                <button className="btn btn-primary">
                <FontAwesomeIcon icon={faGear}/>
                </button>
            </Link>
          </div>
        </div>
        <div className="user-stats">
          <div className="stats">
            <div className="level">
              <div className="level-item">
                <h2 className="title">Level</h2>
                <h5>{this.state.user.level} </h5>
              </div>
            </div>
            <div className="gamesWon">
              <div className="gamesWom-item">
                <h2 className="title">Games Won</h2>
                <h5>{this.state.user.wins} </h5>
              </div>
            </div>
            <div className="gamesLost">
              <div className="gamesLost-item">
                <h2 className="title">Games Lost</h2>
                <h5>{this.state.user.losses} </h5>
              </div>
            </div>
            <div className="gamesPlayed">
              <div className="gamesPlayed-item">
                <h2 className="title">Games Played</h2>
                <p>{this.state.user.wins + this.state.user.losses} </p>
              </div>
            </div>
            {
            (this.state.user.wins + this.state.user.losses) === 0 ? (
              <div className="win-loss-ratio">
                <div className="win-loss-ratio-item">
                    <h2 className="title">Win/Loss Ratio</h2>
                    <p>0</p>
                </div>
              </div>
            ) : (
              ((this.state.user.wins / (this.state.user.wins + this.state.user.losses)) > 0.5) ? (
                <div className="win-loss-ratio positive">
                  <div className="win-loss-ratio-item">
                    <h2 className="title">Win/Loss Ratio</h2>
                    <p className="">
                    {(this.state.user.wins / (this.state.user.wins + this.state.user.losses)).toFixed(2)}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="win-loss-ratio negative">
                  <div className="win-loss-ratio-item">
                    <h2 className="title">Win/Loss Ratio</h2>
                    <p className="">
                        {(this.state.user.wins / (this.state.user.wins + this.state.user.losses)).toFixed(2)}  
                    </p>
                  </div>
                </div>
              )
            )
          }
        </div>
        <div className="gameHistory">
          <div className="gameHistory-item">
            <h2 className="title">Game History</h2>
            {/* {(user.gameHistory.size() > 0) ? ( */}
            {/* ) : ( */}
            <p className="">{this.state.user.username} has not played any games yet.</p>
            {/* ) */}
          </div>
        </div>
      </div>
      <div className="user-friends">
      {
        <div className="friends-list">
          <div className="friends-list-item">
            <h2 className="title">Friends</h2>
            {(this.state.friends.length > 0) ? (
              <ul>
                {this.state.friends.map((friend:User) => (
                  <li key={friend.id}>
                    <Link to={`/profile?userId=${friend.id}`} onClick={this.props.setParentState}> {friend.username} </Link>
                  {/* <a href={`/profile/removefriend?userId=${friend.id}`}>Remove</a> */}
                  </li>
                ))}
              </ul>
            ) : (
              <p>{this.state.user.username} has no friends yet.</p>
            )}
            </div>
        </div>
        }
      </div>
    </div>
    );
  }
}
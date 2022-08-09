import * as React from "react";
import { Component } from "react";
import axios from "axios";
import {Socket} from "socket.io-client";
import { User } from "../../models/user";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import { faGear } from '@fortawesome/free-solid-svg-icons'
import { Link, Navigate } from "react-router-dom";
import './Profile.css'


interface State {
  user: User;
  friends: User[];
  matchHistory: any[];
  socket: Socket | null;
  error: boolean;
  redirect: boolean;
  chatName: string;
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
      error: false,
      redirect: false,
      chatName: ''
    };
    this.componentDidMount = this.componentDidMount.bind(this); 
  }
  
  componentDidMount() {
    if (this.state.socket?.connected === false) {
      this.state.socket?.connect();
    }
    this.getMatchHistory().then(matchHistory => {
      this.setState({matchHistory: matchHistory});
    }, error => {
      this.setState({error: true});
    })

  }

  async getMatchHistory() {
    try {
      const data = await axios.get(`/match/${this.state.user.id}`);
      return(data.data);
    } catch (e) {
      this.setState({error: true});
    }
  }

  async getUser() {
    try {
      const data = await axios.get(`/user`)
      return(data.data);
    } catch (e) {
      this.setState({error: true});
    }
  }

  async directMessage(friendId : number, userId : number){

    try{
      await axios.post(`/chat/createdirect/${friendId}`);
    }
    catch {
    }
    try {
      let channelName = await axios.get(`/chat/direct/${friendId}`);
      this.setState({chatName: channelName.data});}

    catch {
      window.alert(`There was an error`);
    } 
  }

  
  render() {   
    if (this.state.error) {
      return <Navigate to={'/error500'} />;
    }
    if(this.state.chatName != '')
    {
      this.state.socket?.emit('joinToServer', {name: this.state.chatName});
      return <Navigate to={`/chat?chatId=${this.state.chatName}`}/>
    }
    return (
      <div>
        <div className="user-profile">
          <div className="user-name">
            <img className="profile-picture" src={'http://' + process.env.REACT_APP_HOST + ':3000' + `/user/picture/${this.state.user.picture}`} alt="avatar" />
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
            <div className="ladder_rank">
              <div className="ladder_rank-item">
                <h2 className="title">Ladder Rank</h2>
                <p>{this.state.user.rank} </p>
              </div>
            </div>

          </div>
          <div className="history-friends-container">
            <div className="game-history">
              <h2 className="title">Game History</h2>
              {(this.state.matchHistory.length > 0) ? (
                <div className="gameHistory-list">
                  {this.state.matchHistory.map(match => {
                    return (
                      <div key={match.id} className="game-history-item">
                        <div className="gameHistory-item-left">
                          {(match.winner.id === match.homePlayer.id) ?
                          (
                            <div className="positive">
                              <h5>{match.homePlayer.username}</h5>
                              <p>{match.homeScore}</p>
                            </div>
                          ) :
                          (
                            <div className="negative">
                              <h5>{match.homePlayer.username}</h5>
                              <p>{match.homeScore}</p>
                            </div>
                          )
                          }
                        </div>
                        <div className="gameHistory-item-right">
                          {(match.winner.id === match.awayPlayer.id) ?
                            (
                              <div className="positive">
                                <h5>{match.awayPlayer.username}</h5>
                                <p>{match.awayScore}</p>
                              </div>
                            ) :
                            (
                              <div className="negative">
                                <h5>{match.awayPlayer.username}</h5>
                                <p>{match.awayScore}</p>
                              </div>
                            )
                          }
                        </div>
                      </div>
                    )
                  }
                  )}
                </div>
              ) : (
              <p className="">{this.state.user.username} has not played any games yet.</p>
              )
              }
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
                            <button onClick={() => this.directMessage(friend.id, this.state.user.id)}>direct message</button>
                            {(
                            <button className="btn" onClick={
                              async () => {
                                try {
                                  await axios.delete(`/user/friend/${friend.id}`)
                                  let friends = await axios.get(`/user/friend`)
                                  this.setState({friends: friends.data})
                                } catch (e) {
                                  this.setState({error: true});
                                }
                                this.setState
                              }
                            }> remove friend</button>
                            )}
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
        </div>
      </div>
    );
  }
}
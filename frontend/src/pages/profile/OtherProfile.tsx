import * as React from "react";
import { Component } from "react";
import axios from "axios";
import {Socket} from "socket.io-client";
import { User } from "../../models/user";
import { Navigate } from "react-router-dom";
import './Profile.css'


interface State {
  user: User;
  matchHistory: any[];
  showAddFriend: boolean;
  socket: Socket | null;
}

interface Props {
  socket: Socket | null;
  user: User;
  friends: User[];
  setParentState: any;
}

export default class OtherProfile extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      user: this.props.user,
      matchHistory: [],
      showAddFriend: true,
      socket: this.props.socket,
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
      <Navigate to="/err500" />;
    });

    for (let friend of this.props.friends) {
      if (friend.id === this.state.user.id) {
        this.setState({showAddFriend: false});
        break;
      }
    }
  }

  async getMatchHistory() {
    try {
      const data = await axios.get(`/match/${this.state.user.id}`)
      return(data.data);
    } catch (e) {
      return <Navigate to={'/error500'} />;
    }
  }

  render() {
    return (
      <div>
        <div className="user-profile">
          <div className="user-name">
            <img className="profile-picture" src={'http://' + process.env.REACT_APP_HOST + ':3000' + `/user/picture/${this.state.user.picture}`} alt="avatar" />
            <h1>{this.state.user.username}'s profile</h1>
            {
              (this.state.user.status === "online") && (
              <span className="status-online">Online</span>)
            }
            {
              (this.state.user.status === "offline") && (
                <span className="status-offline">Offline</span>) 
            }
            {
              (this.state.user.status === "playing") && (
                <span className="status-playing">Playing</span>) 
            }
            {
              (this.state.showAddFriend) && (
                <button className="btn btn-primary" onClick={() => 
                  {
                    (
                      async () => {
                        try {
                          await axios.post(`user/friend/${this.state.user.id}`);
                        } catch (e) {
                          window.alert(`There was an error while adding friend`);
                        }
                      }
                    )();
                    this.setState({showAddFriend: false});
                  }
                }>Add friend</button>
                )
            }
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
                  })}
                </div>
              ) : (
              <p className="">{this.state.user.username} has not played any games yet.</p>
              )
            }
            </div>
          </div>
        </div>
      </div>
    );
  }
}
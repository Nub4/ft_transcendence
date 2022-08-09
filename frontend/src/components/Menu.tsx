import { getSuggestedQuery } from "@testing-library/react";
import axios from "axios";
import React from "react";
import { NavLink, Navigate } from "react-router-dom";
import { User, UserLevel, UserStatus } from "../models/user";

export const Menu = (props: any) => 
{
  const [user, setUser] = React.useState<User>(new User(0, '', '', false, '', UserStatus.offline, UserLevel.beginner, 0, 0, 0));

  async function getUser() {
    try{
      const response = await axios.get("/user");
      return response.data;
    } catch (e) {
      return <Navigate to={'/error500'} />;
    }
  }

  React.useEffect(() => {
    getUser().then(user => {
      setUser(user);
    } , error => {
    });
  },[]);

  return (
    <nav id="sidebarMenu" className="col-md-3 col-lg-2 d-md-block bg-light sidebar collapse">
      <div className="position-sticky pt-3">
        <ul className="nav flex-column">
        <li className="nav-item">
            <NavLink to={'/game'} className={({isActive}) => (isActive ? "nav-link active" : "nav-link")}>
              <h2 style={{backgroundColor: '#ddd', borderRadius: '5px', paddingLeft: '20px', paddingBottom: '5px', paddingTop: '2px'}}>Game</h2>
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink to={`/profile`} key={1} className={({isActive}) => (isActive ? "nav-link active" : "nav-link")} onClick={props.setParentState}>
              <h2 style={{backgroundColor: '#ddd', borderRadius: '5px', paddingLeft: '20px', paddingBottom: '5px', paddingTop: '2px'}}>Profile</h2>
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink to={'/users'} className={({isActive}) => (isActive ? "nav-link active" : "nav-link")}>
              <h2 style={{backgroundColor: '#ddd', borderRadius: '5px', paddingLeft: '20px', paddingBottom: '5px', paddingTop: '2px'}}>Users</h2>
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink to={'/channels'} className={({isActive}) => (isActive ? "nav-link active" : "nav-link")}>
              <h2 style={{backgroundColor: '#ddd', borderRadius: '5px', paddingLeft: '20px', paddingBottom: '5px', paddingTop: '2px'}}>Channels</h2>
            </NavLink>
          </li>
        </ul>
      </div>
    </nav>
  );
}
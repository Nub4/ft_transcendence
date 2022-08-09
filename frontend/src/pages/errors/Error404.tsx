import React from 'react';
import { Link } from 'react-router-dom';
import Wrapper from "../../components/Wrapper";
import errorPng from "../../assets/Error404.png"

const Error404 = () => (
  <div>
    <img src={errorPng}/>
      <Link to="/profile">Go Home</Link>
  </div>
);

export default Error404;
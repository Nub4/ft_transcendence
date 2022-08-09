import axios from "axios";
import React, { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";

const Nav = () =>
{
    const logout = async () => {
        await axios.post('user/logout', {});
    }

    return (
        <header className="navbar navbar-dark sticky-top bg-dark flex-md-nowrap p-0 shadow">
            <a className="navbar-brand col-md-3 col-lg-2 me-0 px-3 fs-6" href="/">Ft_transcendence</a>
            <div className="navbar-nav">
                <div className="nav-item text-nowrap">
                <Link to={'/'} className="nav-link px-3" onClick={logout}>Sign out</Link>
                </div>
            </div>
        </header>
    )
}

export default Nav
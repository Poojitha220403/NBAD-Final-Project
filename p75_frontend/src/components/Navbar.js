import React from 'react';
import { Link, useHistory } from 'react-router-dom';
import './css/Navbar.css';

function Navbar({ token }) {
  const history = useHistory();

  const handleLogout = () => {
    localStorage.removeItem('token');
    token();
    history.push('/');
  };

  return (
    <nav className="navbar" aria-label="Main Navigation">
      <ul className="navbar-list">
        <li className="navbar-item"><Link to="/dashboard" className="navbar-link">Dashboard</Link></li>
        <li className="navbar-item"><Link to="/summary" className="navbar-link">Summary</Link></li>
        <li className="navbar-item"><Link to="/reports" className="navbar-link">Reports</Link></li>
        <li className="navbar-item"><button onClick={handleLogout} className="navbar-button">Logout</button></li>
      </ul>
    </nav>
  );
}

export default Navbar;
import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import './css/Login.css';

function Login({ setToken }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const history = useHistory();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Username and password cannot be empty.');
      toast.error('Username and password cannot be empty.');
      return;
    }
    try {
      const response = await axios.post('https://poojithabackend.devhost.my/login', { username, password });
      setToken(response.data.access_token);
      history.push('/dashboard');
      toast.success('Login successful!');
    } catch (error) {
      setError('Login failed. Please check your username and password.');
      toast.error('Login failed. Please check your username and password.');
      console.error('Login failed', error);
    }
  };

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'Enter') {
        handleSubmit(e);
      }
    };

    window.addEventListener('keypress', handleKeyPress);
    return () => {
      window.removeEventListener('keypress', handleKeyPress);
    };
  }, [username, password]);

  return (
    <div className="login-page">
      <div className="login-container">
        <h2 className="login-title">Login</h2>
        <form onSubmit={handleSubmit} className="login-form" aria-label="Login Form">
          <div className="form-group">
            <label htmlFor="username">Username:</label>
            <input 
              type="text" 
              id="username" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              required 
              aria-required="true"
              aria-label="Username"
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password:</label>
            <input 
              type="password" 
              id="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              aria-required="true"
              aria-label="Password"
            />
          </div>
          <button type="submit" className="login-button" aria-label="Login">Login</button>
          <a href="/" className="back-link">
            <button type="button" className="login-button" aria-label="Back" style={{ marginTop: '10px'  }}>Back</button>
          </a>
        </form>
        {error && <p className="error-message" role="alert">{error}</p>}
      </div>
    </div>
  );
}

export default Login;
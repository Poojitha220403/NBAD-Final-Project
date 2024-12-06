import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import DOMPurify from 'dompurify';
import './css/Dashboard.css';

function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No token found');
        toast.error('No token found');
        setLoading(false);
        return;
      }
      try {
        const response = await axios.get('https://poojithabackend.devhost.my/dashboard', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setData(response.data);
        setLoading(false);
      } catch (error) {
        setError('Failed to fetch data');
        toast.error('Failed to fetch data');
        console.error('Error fetching dashboard data', error);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const renderContent = (content) => {
    return (
      <div 
        className="content-section"
        dangerouslySetInnerHTML={{ 
          __html: DOMPurify.sanitize(content.html_content) 
        }} 
      />
    );
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <p className="error" role="alert">{error}</p>;

  return (
    <div className="dashboard-container" role="main">
      <h2>Dashboard</h2>
      <div className="content-container">
        {data?.contents?.map((content, index) => (
          <div key={content.id || index} className="content-wrapper">
            {renderContent(content)}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Dashboard;
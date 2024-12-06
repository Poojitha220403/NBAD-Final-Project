import React, { useState, useEffect } from 'react';
import { EditorState, convertToRaw, ContentState, convertFromHTML } from 'draft-js';
import { Editor } from 'react-draft-wysiwyg';
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useHistory } from 'react-router-dom';
import './css/Admin.css';

function Admin() {
  const [editorState, setEditorState] = useState(EditorState.createEmpty());
  const [pageType, setPageType] = useState('dashboard');
  const [orderId, setOrderId] = useState(1);
  const [chartType, setChartType] = useState('bar');
  const [chartData, setChartData] = useState('');
  const [contents, setContents] = useState([]);
  const [charts, setCharts] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const history = useHistory();

  const pageTypes = ['dashboard', 'summary', 'reports'];
  const chartTypes = ['bar', 'line', 'pie'];

  const sampleChartData = {
    bar: JSON.stringify({
      chart: {
        type: 'bar',
        series: [{
          data: [65, 59, 80, 81, 56],
          name: 'AI Models Released',
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May']
        }],
        yScale: {
          minimum: 0,
          maximum: 100
        },
        title: 'Monthly AI Model Releases',
        colors: ['#4CAF50'],
        caption: 'This bar chart shows the number of AI models released each month, highlighting the trends over a 5-month period.'
      }
    }, null, 2),
    line: JSON.stringify({
      chart: {
        type: 'line',
        series: [{
          data: [28, 48, 40, 19, 86],
          name: 'Performance Improvements',
          labels: ['Jun', 'Jul', 'Aug', 'Sep', 'Oct']
        }],
        yScale: {
          minimum: 0,
          maximum: 100
        },
        title: 'AI Model Performance Trends',
        colors: ['#2196F3'],
        caption: 'This line chart illustrates the performance improvements of AI models from June to October, showcasing significant fluctuations.'
      }
    }, null, 2),
    pie: JSON.stringify({
      chart: {
        type: 'pie',
        series: [{
          data: [
            { name: 'Language Models', value: 45 },
            { name: 'Vision Models', value: 25 },
            { name: 'Multimodal Models', value: 30 }
          ]
        }],
        title: 'AI Model Types Distribution',
        colors: ['#FF9800', '#9C27B0', '#E91E63'],
        caption: 'This pie chart shows the distribution of AI models by type, with the largest portion dedicated to Language Models.'
      }
    }, null, 2)
  };

  useEffect(() => {
    fetchData();
  }, [pageType]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [contentsRes, chartsRes] = await Promise.all([
        axios.get(`https://poojithabackend.devhost.my/admin/contents/${pageType}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`https://poojithabackend.devhost.my/admin/charts/${pageType}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      setContents(contentsRes.data);
      setCharts(chartsRes.data);
    } catch (error) {
      handleError(error);
    }
  };

  const handleSubmitContent = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    
    if (!token) {
      toast.error('Not authorized. Please login again.');
      history.push('/login');
      return;
    }

    const contentState = convertToRaw(editorState.getCurrentContent());
    const content = JSON.stringify(contentState);
    
    try {
      const endpoint = editMode === 'content' ? 
        `https://poojithabackend.devhost.my/admin/content/${editId}` : 
        'https://poojithabackend.devhost.my/admin/add_content';

      const method = editMode === 'content' ? 'PUT' : 'POST';

      const data = {
        page_type: pageType,
        content,
        order_id: orderId
      };

      await axios({
        method,
        url: endpoint,
        data,
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      toast.success(`Content ${editMode === 'content' ? 'updated' : 'added'} successfully!`);
      resetForm();
      fetchData();
    } catch (error) {
      handleError(error);
    }
  };

  const handleSubmitChart = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    
    if (!token) {
      toast.error('Not authorized. Please login again.');
      history.push('/login');
      return;
    }
    
    try {
      const endpoint = editMode === 'chart' ? 
        `https://poojithabackend.devhost.my/admin/chart/${editId}` : 
        'https://poojithabackend.devhost.my/admin/add_chart';

      const method = editMode === 'chart' ? 'PUT' : 'POST';

      const data = {
        page_type: pageType,
        chart_type: chartType,
        chart_data: JSON.parse(chartData),
        order_id: orderId
      };

      await axios({
        method,
        url: endpoint,
        data,
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      toast.success(`Chart ${editMode === 'chart' ? 'updated' : 'added'} successfully!`);
      resetForm();
      fetchData();
    } catch (error) {
      handleError(error);
    }
  };

  const handleDelete = async (id, type) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`https://poojithabackend.devhost.my/admin/${type}/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Deleted successfully!');
      fetchData();
    } catch (error) {
      handleError(error);
    }
  };

  const handleEditContent = (item) => {
    setEditMode('content');
    setEditId(item.id);
    setPageType(item.page_type);
    setOrderId(item.order_id);
    
    const blocksFromHTML = convertFromHTML(item.html_content);
    const contentState = ContentState.createFromBlockArray(
      blocksFromHTML.contentBlocks,
      blocksFromHTML.entityMap
    );
    setEditorState(EditorState.createWithContent(contentState));
  };

  const handleEditChart = (item) => {
    setEditMode('chart');
    setEditId(item.id);
    setPageType(item.page_type);
    setOrderId(item.order_id);
    setChartType(item.chart_type);
    setChartData(item.chart_data);
  };

  const resetForm = () => {
    setEditMode(false);
    setEditId(null);
    setEditorState(EditorState.createEmpty());
    setChartData('');
    setOrderId(1);
  };

  const handleError = (error) => {
    if (error.response?.status === 401) {
      toast.error('Session expired. Please login again.');
      history.push('/login');
    } else {
      toast.error('Operation failed.');
      console.error('Error:', error);
    }
  };

  const handleChartTypeChange = (e) => {
    setChartType(e.target.value);
    setChartData(sampleChartData[e.target.value]);
  };

  return (
    <div className="admin-container" role="main">
      <h2>Content Management</h2>
      <form onSubmit={handleSubmitContent} aria-label="Content Management Form">
        <div className="form-group">
          <label htmlFor="pageType">Page Type:</label>
          <select 
            id="pageType" 
            value={pageType} 
            onChange={(e) => setPageType(e.target.value)}
            aria-label="Select Page Type"
          >
            {pageTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="orderId">Order ID:</label>
          <input
            type="number"
            id="orderId"
            value={orderId}
            onChange={(e) => setOrderId(parseInt(e.target.value))}
            min="1"
            required
            aria-label="Order ID"
          />
        </div>

        <div className="form-group">
          <label htmlFor="contentEditor">Content:</label>
          <Editor
            editorState={editorState}
            wrapperClassName="editor-wrapper"
            editorClassName="editor"
            toolbarClassName="toolbar"
            onEditorStateChange={setEditorState}
            aria-label="Content Editor"
          />
        </div>

        <button type="submit" className="submit-button" aria-label={editMode === 'content' ? 'Update Content' : 'Add Content'}>
          {editMode === 'content' ? 'Update' : 'Add'} Content
        </button>
        {editMode === 'content' && (
          <button type="button" onClick={resetForm} className="cancel-button" aria-label="Cancel Edit">
            Cancel
          </button>
        )}
      </form>

      {pageType !== 'dashboard' && (
        <form onSubmit={handleSubmitChart} aria-label="Chart Management Form">
          <div className="form-group">
            <label htmlFor="chartType">Chart Type:</label>
            <select 
              id="chartType" 
              value={chartType} 
              onChange={handleChartTypeChange}
              aria-label="Select Chart Type"
            >
              {chartTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="chartData">Chart Data (JSON):</label>
            <textarea
              id="chartData"
              value={chartData}
              onChange={(e) => setChartData(e.target.value)}
              rows="10"
              required
              aria-label="Chart Data"
            />
          </div>

          <button type="submit" className="submit-button" aria-label={editMode === 'chart' ? 'Update Chart' : 'Add Chart'}>
            {editMode === 'chart' ? 'Update' : 'Add'} Chart
          </button>
          {editMode === 'chart' && (
            <button type="button" onClick={resetForm} className="cancel-button" aria-label="Cancel Edit">
              Cancel
            </button>
          )}
        </form>
      )}

      <div className="data-tables">
        <h3>Existing Content</h3>
        <table role="table">
          <thead>
            <tr>
              <th scope="col">ID</th>
              <th scope="col">Page Type</th>
              <th scope="col">Order ID</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {contents.map(item => (
              <tr key={item.id}>
                <td>{item.id}</td>
                <td>{item.page_type}</td>
                <td>{item.order_id}</td>
                <td>
                  <button onClick={() => handleEditContent(item)} aria-label={`Edit content ${item.id}`}>Edit</button>
                  <button onClick={() => handleDelete(item.id, 'content')} aria-label={`Delete content ${item.id}`}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {pageType !== 'dashboard' && (
          <>
            <h3>Existing Charts</h3>
            <table role="table">
              <thead>
                <tr>
                  <th scope="col">ID</th>
                  <th scope="col">Page Type</th>
                  <th scope="col">Chart Type</th>
                  <th scope="col">Order ID</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {charts.map(item => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{item.page_type}</td>
                    <td>{item.chart_type}</td>
                    <td>{item.order_id}</td>
                    <td>
                      <button onClick={() => handleEditChart(item)} aria-label={`Edit chart ${item.id}`}>Edit</button>
                      <button onClick={() => handleDelete(item.id, 'chart')} aria-label={`Delete chart ${item.id}`}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  );
}

export default Admin;
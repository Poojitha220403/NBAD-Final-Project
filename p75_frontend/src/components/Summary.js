import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import * as d3 from 'd3';
import DOMPurify from 'dompurify';
import './css/Summary.css';

function Summary() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const chartRefs = useRef({});

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No token found');
        setLoading(false);
        return;
      }
      try {
        const response = await axios.get('https://poojithabackend.devhost.my/summary', {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('API Response:', response.data); // Debug log
        setItems(response.data.items);
      } catch (error) {
        setError('Failed to fetch data');
        console.error('Error fetching Summary data', error);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  useEffect(() => {
    items.forEach(item => {
      if (item.type === 'chart' && chartRefs.current[item.data.id]) {
        try {
          const chartData = JSON.parse(item.data.chart_data);
          const chartConfig = chartData.chart;
          const svg = d3.select(chartRefs.current[item.data.id])
            .attr('width', 500)
            .attr('height', 300)
            .attr('role', 'img')
            .attr('aria-label', chartConfig.title);

          // Clear previous content
          svg.selectAll('*').remove();

          // Use chartData.chart.type instead of item.data.chart_type
          if (chartConfig.type === 'bar') {
            renderBarChart(svg, chartConfig);
          } else if (chartConfig.type === 'line') {
            renderLineChart(svg, chartConfig);
          } else if (chartConfig.type === 'pie') {
            renderPieChart(svg, chartConfig);
          }
        } catch (error) {
          console.error('Error rendering chart:', error);
        }
      }
    });
  }, [items]);

  const renderBarChart = (svg, config) => {
    const margin = { top: 40, right: 20, bottom: 60, left: 60 };
    const width = 500 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    const g = svg
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand()
      .domain(config.series[0].labels)
      .range([0, width])
      .padding(0.2);

    const y = d3.scaleLinear()
      .domain([0, config.yScale?.maximum || d3.max(config.series[0].data) * 1.1])
      .nice()
      .range([height, 0]);

    // Add grid
    g.append('g')
      .attr('class', 'grid')
      .call(d3.axisLeft(y)
        .tickSize(-width)
        .tickFormat('')
      );

    // Add X axis
    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .attr('transform', 'rotate(-45)')
      .style('text-anchor', 'end');

    // Add Y axis
    g.append('g')
      .call(d3.axisLeft(y));

    // Add bars with animation
    g.selectAll('.bar')
      .data(config.series[0].data)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', (d, i) => x(config.series[0].labels[i]))
      .attr('width', x.bandwidth())
      .attr('y', height)
      .attr('height', 0)
      .attr('fill', config.colors?.[0] || '#4CAF50')
      .transition()
      .duration(1000)
      .attr('y', d => y(d))
      .attr('height', d => height - y(d));

    // Add chart title inside the SVG
    g.append('text')
      .attr('class', 'chart-title')
      .attr('x', width / 2)
      .attr('y', -margin.top / 2)
      .attr('text-anchor', 'middle')
      .text(config.title);

    // Add axis labels
    g.append('text')
      .attr('class', 'axis-label')
      .attr('x', width / 2)
      .attr('y', height + margin.bottom - 30)
      .attr('text-anchor', 'middle')
      .text(config.series[0].name);

    // Add caption inside the SVG
    if (config.caption) {
      console.log('Caption:', config.caption); // Debug log
      g.append('text')
        .attr('class', 'chart-caption')
        .attr('x', width / 2)
        .attr('y', height + margin.bottom - 10)
        .attr('text-anchor', 'middle')
        .style('font-size', '12px')
        .style('fill', '#555')
        .text(config.caption);
    }
  };

  const renderLineChart = (svg, config) => {
    const margin = { top: 40, right: 20, bottom: 60, left: 60 };
    const width = 500 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom + 70;

    const g = svg
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand()
      .domain(config.series[0].labels)
      .range([0, width])
      .padding(0.1);

    const y = d3.scaleLinear()
      .domain([0, config.yScale?.maximum || d3.max(config.series[0].data) * 1.1])
      .nice()
      .range([height, 0]);

    // Add grid
    g.append('g')
      .attr('class', 'grid')
      .call(d3.axisLeft(y)
        .tickSize(-width)
        .tickFormat('')
      );

    // Add X axis
    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .attr('transform', 'rotate(-45)')
      .style('text-anchor', 'end');

    // Add Y axis
    g.append('g')
      .call(d3.axisLeft(y));

    // Add line with animation
    const line = d3.line()
      .x((d, i) => x(config.series[0].labels[i]) + x.bandwidth() / 2)
      .y(d => y(d));

    const path = g.append('path')
      .datum(config.series[0].data)
      .attr('class', 'line')
      .attr('stroke', config.colors?.[0] || '#2196F3')
      .attr('d', line);

    // Add points
    g.selectAll('.dot')
      .data(config.series[0].data)
      .enter()
      .append('circle')
      .attr('class', 'dot')
      .attr('cx', (d, i) => x(config.series[0].labels[i]) + x.bandwidth() / 2)
      .attr('cy', d => y(d))
      .attr('r', 4)
      .attr('fill', config.colors?.[0] || '#2196F3');

    // Add chart title inside the SVG
    g.append('text')
      .attr('class', 'chart-title')
      .attr('x', width / 2)
      .attr('y', -margin.top / 2)
      .attr('text-anchor', 'middle')
      .text(config.title);

    // Add axis labels
    g.append('text')
      .attr('class', 'axis-label')
      .attr('x', width / 2)
      .attr('y', height + margin.bottom - 30)
      .attr('text-anchor', 'middle')
      .text(config.series[0].name);

    // Add caption inside the SVG
    if (config.caption) {
      g.append('text')
        .attr('class', 'chart-caption')
        .attr('x', width / 2)
        .attr('y', height + margin.bottom - 10)
        .attr('text-anchor', 'middle')
        .style('font-size', '12px')
        .style('fill', '#555')
        .text(config.caption);
    }
  };

  const renderPieChart = (svg, config) => {
    const width = 500;
    const height = 300;
    const radius = Math.min(width, height) / 2;

    const g = svg.append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`);

    const pie = d3.pie()
      .value(d => d.value);

    const arc = d3.arc()
      .innerRadius(0)
      .outerRadius(radius - 50);

    const arcs = g.selectAll('.arc')
      .data(pie(config.series[0].data))
      .enter()
      .append('g')
      .attr('class', 'arc');

    arcs.append('path')
      .attr('d', arc)
      .style('fill', (d, i) => config.colors[i])
      .style('opacity', 0.8)
      .on('mouseover', function() {
        d3.select(this)
          .style('opacity', 1)
          .attr('stroke', '#fff')
          .attr('stroke-width', 2);
      })
      .on('mouseout', function() {
        d3.select(this)
          .style('opacity', 0.8)
          .attr('stroke', 'none');
      });

    arcs.append('text')
      .attr('transform', d => `translate(${arc.centroid(d)})`)
      .attr('dy', '.35em')
      .style('text-anchor', 'middle')
      .style('fill', '#fff')
      .text(d => `${d.data.name}: ${d.data.value}%`);

    // Add chart title inside the SVG
    g.append('text')
      .attr('class', 'chart-title')
      .attr('x', 0)
      .attr('y', -radius + 20)
      .attr('text-anchor', 'middle')
      .text(config.title);

    // Add caption inside the SVG
    if (config.caption) {
      g.append('text')
        .attr('class', 'chart-caption')
        .attr('x', 0)
        .attr('y', radius - 30)
        .attr('text-anchor', 'middle')
        .style('font-size', '12px')
        .style('fill', '#555')
        .text(config.caption);
    }
  };

  const renderContent = (content) => {
    return (
      <div dangerouslySetInnerHTML={{ 
        __html: DOMPurify.sanitize(content.data.html_content) 
      }} />
    );
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <p style={{ color: 'red' }} role="alert">{error}</p>;

  return (
    <div className="summary-container"  role="main">
      <h2>Summary</h2>
      {items.map((item) => (
        <div key={`${item.type}-${item.data.id}`} className="item-container">
          {item.type === 'content' ? (
            renderContent(item)
          ) : (
            <div className="chart-container">
              <svg 
                ref={el => chartRefs.current[item.data.id] = el}
                className="chart"
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default Summary;

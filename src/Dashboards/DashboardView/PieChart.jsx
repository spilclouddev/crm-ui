import React, { useState, useEffect } from 'react';
import CanvasJSReact from '@canvasjs/react-charts';
import config from '../../config';

const CanvasJSChart = CanvasJSReact.CanvasJSChart;

// API base URL - change this to match your backend

const API_URL = config.API_URL;


const PieChart = () => {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalValue, setTotalValue] = useState(0);

  // Function to get auth headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    };
  };

  // Fetch leads data
  const fetchLeads = async () => {
    try {
      setLoading(true);
      
      // Get auth headers
      const headers = getAuthHeaders();
      
      // Fetch leads
      const leadsResponse = await fetch(`${API_URL}/leads`, { headers });
      if (!leadsResponse.ok) {
        throw new Error(`Failed to fetch leads: ${leadsResponse.status}`);
      }
      
      const leadsData = await leadsResponse.json();
      processLeadData(leadsData);
    } catch (err) {
      console.error("Error fetching leads data:", err);
      setError("Failed to load chart data. Please refresh the page.");
      setLoading(false);
    }
  };

  // Process lead data to aggregate by country
  const processLeadData = (leads) => {
    // Group leads by country and sum implementation values
    const countryData = {};
    let total = 0;
    
    leads.forEach(lead => {
      // Use a default country if none is specified
      const country = lead.country || 'Unknown';
      const value = parseFloat(lead.value || 0);
      
      // Skip leads with zero value
      if (value <= 0) return;
      
      // Add value to the country total
      if (!countryData[country]) {
        countryData[country] = value;
      } else {
        countryData[country] += value;
      }
      
      total += value;
    });
    
    // Convert to array format needed for the chart
    const chartPoints = Object.entries(countryData).map(([country, value]) => ({
      label: country,
      y: value,
      // Format the display for tooltip and label
      formattedValue: `$${value.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}`
    }));
    
    // Sort by value (largest first)
    chartPoints.sort((a, b) => b.y - a.y);
    
    setChartData(chartPoints);
    setTotalValue(total);
    setLoading(false);
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchLeads();
  }, []);

  // Prepare chart options
  const options = {
    animationEnabled: true,
    theme: "light2",
    title: {
      text: ""
    },
    subtitles: [{
      text: `Total: $${totalValue.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}`,
      verticalAlign: "center",
      fontSize: 18,
      dockInsidePlotArea: true
    }],
    data: [{
      type: "doughnut",
      showInLegend: true,
      indexLabel: "{label}: ${y}",
      yValueFormatString: "#,###.##",
      toolTipContent: "<b>{label}</b>: {formattedValue} ({percentage}%)",
      legendText: "{label}",
      dataPoints: chartData.map(point => ({
        ...point,
        // Calculate percentage of total
        percentage: ((point.y / totalValue) * 100).toFixed(1)
      }))
    }]
  };

  if (loading) {
    return <div className="text-center p-4">Loading chart data...</div>;
  }

  if (error) {
    return (
      <div className="text-center p-4 text-red-600">
        <p>{error}</p>
        <button 
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={fetchLeads}
        >
          Retry
        </button>
      </div>
    );
  }
  
  // If no meaningful data is available
  if (chartData.length === 0 || totalValue === 0) {
    return (
      <div className="text-center p-4 text-gray-500">
        No implementation value data available by country.
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <CanvasJSChart options={options} />
    </div>
  );
};

export default PieChart;
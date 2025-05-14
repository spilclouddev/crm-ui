import React, { useState, useEffect } from 'react';
import CanvasJSReact from '@canvasjs/react-charts';
import config from "../../config";

const CanvasJSChart = CanvasJSReact.CanvasJSChart;

// API base URL - change this to match your backend

const API_URL = config.API_URL;

const DoughnutChart = () => {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalSubscription, setTotalSubscription] = useState(0);

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

  // Process lead data to aggregate subscription values by country
  const processLeadData = (leads) => {
    // Group leads by country and sum subscription values
    const countryData = {};
    let total = 0;
    
    leads.forEach(lead => {
      // Use a default country if none is specified
      const country = lead.country || 'Unknown';
      const subscriptionValue = parseFloat(lead.subscription || 0);
      
      // Skip leads with zero subscription
      if (subscriptionValue <= 0) return;
      
      // Add subscription value to the country total
      if (!countryData[country]) {
        countryData[country] = subscriptionValue;
      } else {
        countryData[country] += subscriptionValue;
      }
      
      total += subscriptionValue;
    });
    
    // Convert to array format needed for the chart
    const chartPoints = Object.entries(countryData).map(([country, value]) => ({
      name: country,
      y: value,
      percentage: 0, // Will calculate after getting total
      formattedValue: `$${value.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}`
    }));
    
    // Calculate percentage for each country
    chartPoints.forEach(point => {
      point.percentage = ((point.y / total) * 100).toFixed(1);
    });
    
    // Sort by value (largest first)
    chartPoints.sort((a, b) => b.y - a.y);
    
    setChartData(chartPoints);
    setTotalSubscription(total);
    setLoading(false);
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchLeads();
  }, []);

  // Find the top country by subscription value
  const getTopCountryText = () => {
    if (chartData.length === 0) return "";
    
    const topCountry = chartData[0];
    return `${topCountry.name}: ${topCountry.percentage}%`;
  };

  // Prepare chart options
  const options = {
    animationEnabled: true,
    title: {
      text: ""
    },
    subtitles: [{
      text: `$${totalSubscription.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}`,
      verticalAlign: "center",
      fontSize: 20,
      dockInsidePlotArea: true
    }],
    data: [{
      type: "doughnut",
      showInLegend: true,
      indexLabel: "{name}: ${y}",
      yValueFormatString: "#,###.##",
      toolTipContent: "<b>{name}</b>: {formattedValue} ({percentage}%)",
      legendText: "{name}",
      dataPoints: chartData
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
  if (chartData.length === 0 || totalSubscription === 0) {
    return (
      <div className="text-center p-4 text-gray-500">
        No subscription data available by country.
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <CanvasJSChart options={options} />
    </div>
  );
};

export default DoughnutChart;
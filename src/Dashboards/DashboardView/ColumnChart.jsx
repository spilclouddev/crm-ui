import React, { useState, useEffect } from 'react';
import CanvasJSReact from '@canvasjs/react-charts';
import config from "../../config";

const CanvasJSChart = CanvasJSReact.CanvasJSChart;

// API base URL - change this to match your backend
const API_URL = config.API_URL;

const ColumnChart = () => {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  // Process lead data to get subscription values by company
  const processLeadData = (leads) => {
    // Map companies to their subscription values
    const companyData = leads
      .filter(lead => lead.subscription && parseFloat(lead.subscription) > 0) // Filter out leads with no subscription value
      .map(lead => ({
        label: lead.company || 'Unnamed Company',
        y: parseFloat(lead.subscription || 0), // Use subscription value as y
        formattedSubscription: `${parseFloat(lead.subscription || 0).toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })}`
      }));
    
    // Sort by subscription value (highest first)
    companyData.sort((a, b) => b.y - a.y);
    
    // Limit to top 15 companies for better visualization
    const topCompanies = companyData.slice(0, 15);
    
    setChartData(topCompanies);
    setLoading(false);
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchLeads();
  }, []);

      // Define an array of colors for dynamic coloring
  const colorPalette = [
    "#4F81BC", "#C0504E", "#9BBB59", "#8064A2", "#4BACC6", 
    "#F79646", "#5A9BD4", "#FF6D6D", "#46BFBD", "#FDB45C", 
    "#949FB1", "#4D5360", "#784BA0", "#2B908F", "#3A8DC1"
  ];

  // Prepare chart options
  const options = {
    animationEnabled: true,
    theme: "light2",
    title: {
      text: ""
    },
    axisX: {
      title: "Companies",
      labelAngle: -45, // Angle the labels to prevent overlap
      labelFontSize: 12,
      interval: 1
    },
    axisY: {
      title: "Subscription Value ($)",
      includeZero: true,
      prefix: "$",
      valueFormatString: "#,###.##"
    },
    toolTip: {
      contentFormatter: function (e) {
        return `<strong>${e.entries[0].dataPoint.label}</strong><br/>
                Subscription: ${e.entries[0].dataPoint.formattedSubscription}`;
      }
    },
    data: [
      {
        type: "column",
        name: "Subscription Value",
        // No single color defined here as we'll use dynamic colors
        indexLabel: "${y}",
        indexLabelFontSize: 12,
        indexLabelPlacement: "outside",
        indexLabelOrientation: "horizontal",
        indexLabelFontColor: "#555",
        dataPoints: chartData.map((point, index) => ({
          label: point.label,
          y: point.y,
          formattedSubscription: point.formattedSubscription,
          color: colorPalette[index % colorPalette.length] // Assign a color from the palette based on index
        }))
      }
    ]
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
  if (chartData.length === 0) {
    return (
      <div className="text-center p-4 text-gray-500">
        No subscription data available by company.
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <CanvasJSChart options={options} />
    </div>
  );
};

export default ColumnChart;
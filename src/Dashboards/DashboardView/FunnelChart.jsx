import React, { Component } from 'react';
import CanvasJSReact from '@canvasjs/react-charts';
import config from "../../config";

const CanvasJSChart = CanvasJSReact.CanvasJSChart;

// API base URL - change this to match your backend

const API_URL = config.API_URL;

// Define the expected order of lead stages for the funnel
const LEAD_STAGE_ORDER = [
  "New Lead",
  "Contacted",
  "Qualified", 
  "Demo Done",
  "Proposal Sent",
  "Negotiation",
  "Won - Deal Closed",
  "Lost - Not Interested",
  "Lost - Competitor Win",
  "Lost - No Budget",
  "Follow-up Later"
];

class FunnelChart extends Component {
  constructor(props) {
    super(props);
    this.state = {
      pipelineData: [],
      loading: true,
      error: null
    };
  }

  componentDidMount() {
    // Fetch pipeline data when component mounts
    this.fetchPipelineData();
  }

  // Function to get auth headers
  getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    };
  };

  // Fetch pipeline data from API
  fetchPipelineData = async () => {
    try {
      this.setState({ loading: true });
      
      // Get auth headers
      const headers = this.getAuthHeaders();
      
      // Fetch pipeline summary
      const pipelineResponse = await fetch(`${API_URL}/leads/pipeline/summary`, { headers });
      if (!pipelineResponse.ok) {
        throw new Error(`Failed to fetch pipeline data: ${pipelineResponse.status}`);
      }
      
      const pipelineData = await pipelineResponse.json();
      this.setState({ 
        pipelineData,
        loading: false
      });
    } catch (err) {
      console.error("Error fetching pipeline data:", err);
      this.setState({ 
        error: "Failed to load pipeline data.",
        loading: false
      });
    }
  };

  // Transform pipeline data for the funnel chart - use actual pipeline stages
  transformPipelineToFunnelData = () => {
    const { pipelineData } = this.state;
    const { usePredefinedData } = this.props;
    
    // If using predefined data or no pipeline data, return default data points
    if (usePredefinedData || !pipelineData || pipelineData.length === 0) {
      return this.props.dataPoints;
    }
    
    // Create a map of stage name to its value
    const stageValueMap = {};
    pipelineData.forEach(stage => {
      stageValueMap[stage._id] = parseFloat(stage.totalValue || 0);
    });
    
    // Generate data points based on the ordered stages (but only include stages that have data)
    let dataPoints = LEAD_STAGE_ORDER
      .filter(stageName => stageValueMap[stageName] !== undefined)
      .map(stageName => ({
        label: stageName,
        y: stageValueMap[stageName]
      }))
      .filter(point => point.y > 0); // Only include stages with values greater than 0
    
    // If there's no meaningful data, return default data
    if (dataPoints.length === 0) {
      return this.props.dataPoints;
    }
    
    // Sort by value in descending order to make a proper funnel
    // (optional - remove this if you want to maintain exact stage order)
    // dataPoints.sort((a, b) => b.y - a.y);
    
    return dataPoints;
  };

  render() {
    const { title } = this.props;
    const { loading, error } = this.state;
    
    // Get data points from pipeline data or use defaults
    const dataPoints = this.transformPipelineToFunnelData();
    
    // Calculate percentages
    const total = dataPoints.reduce((sum, point) => sum + point.y, 0); // Use total sum instead of first value
    const processedDataPoints = dataPoints.map(point => {
      return {
        ...point,
        percentage: ((point.y / total) * 100).toFixed(2)
      };
    });
    
    const options = {
      animationEnabled: true,
      title: {
        text: title || ""
      },
      data: [{
        type: "funnel",
        toolTipContent: "<b>{label}</b>: ${y} <b>({percentage}%)</b>",
        indexLabelPlacement: "inside",
        indexLabel: "{label} (${y}, {percentage}%)",
        dataPoints: processedDataPoints
      }]
    };
    
    // Show loading state
    if (loading) {
      return (
        <div className="text-center p-4">
          <p>Loading pipeline data...</p>
        </div>
      );
    }
    
    // Show error state
    if (error) {
      return (
        <div className="text-center p-4 text-red-600">
          <p>{error}</p>
          <button 
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={this.fetchPipelineData}
          >
            Retry
          </button>
        </div>
      );
    }
    
    return (
      <div>
        <CanvasJSChart 
          options={options}
          onRef={ref => this.chart = ref}
        />
      </div>
    );
  }
}

// Default props
FunnelChart.defaultProps = {
  dataPoints: [
    { y: 1400, label: "New Lead" },
    { y: 1200, label: "Contacted" },
    { y: 1000, label: "Qualified" },
    { y: 800, label: "Demo Done" },
    { y: 600, label: "Proposal Sent" },
    { y: 400, label: "Negotiation" },
    { y: 200, label: "Won - Deal Closed" }
  ],
  usePredefinedData: false // Set to true to use the default data points instead of API data
};

export default FunnelChart;
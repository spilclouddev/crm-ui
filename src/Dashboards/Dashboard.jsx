import React, { useState } from 'react';
import ColumnChart from '../Dashboards/DashboardView/ColumnChart';
import PieChart from '../Dashboards/DashboardView/PieChart';
import LineChart from '../Dashboards/DashboardView/LineChart';
import BarChart from '../Dashboards/DashboardView/BarChart';
import DoughnutChart from '../Dashboards/DashboardView/DoughnutChart';
import { TrendingUp, Users, BarChart2, PieChart as PieChartIcon, Activity } from 'lucide-react';

const Dashboard = () => {
  // State to track which chart is currently selected
  const [selectedChart, setSelectedChart] = useState('trafficSources');

  // Chart options for the dropdown
  const chartOptions = [
    { id: 'trafficSources', name: 'Traffic Sources', description: 'Breakdown of traffic sources to your platform' },
    { id: 'customerFeedback', name: 'Customer Feedback', description: 'Summary of customer satisfaction ratings' },
    { id: 'Statistics', name: 'Statistics', description: 'Comparison of different fruit quantities' },
    { id: 'bounceRateTrends', name: 'Bounce Rate Trends', description: 'Weekly bounce rate metrics over time' },
    { id: 'socialMediaPresence', name: 'Social Media Presence', description: 'Comparison of followers across platforms' }
  ];

  // Function to render the selected chart
  const renderChart = () => {
    switch (selectedChart) {
      case 'trafficSources':
        return <PieChart />;
      case 'customerFeedback':
        return <DoughnutChart />;
      case 'Statistics':
        return <ColumnChart />;
      case 'bounceRateTrends':
        return <LineChart />;
      case 'socialMediaPresence':
        return <BarChart />;
      default:
        return <PieChart />;
    }
  };

  return (
    <div className="w-full h-full bg-gray-50 p-6 md:p-8">
      {/* Dashboard Header */}
      {/* <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard Overview</h1>
        <p className="text-gray-600">Select a chart to view detailed metrics</p>
      </div> */}

      {/* Chart Selection and Display */}
      <div className="grid grid-cols-1 gap-8">
        {/* Quick stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
          <div className="bg-white rounded-lg shadow-md p-6 flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Total Contacts</p>
              <p className="text-xl font-bold">1,483</p>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6 flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Open Leads</p>
              <p className="text-xl font-bold">64</p>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6 flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600 mr-4">
              <Activity className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Tasks Due</p>
              <p className="text-xl font-bold">12</p>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6 flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600 mr-4">
              <BarChart2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Conversion Rate</p>
              <p className="text-xl font-bold">18.3%</p>
            </div>
          </div>
        </div>
        
        {/* Chart Selection Dropdown */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="mb-6">
            <label htmlFor="chartSelector" className="block text-sm font-medium text-gray-700 mb-2">
              Select Chart
            </label>
            <div className="relative">
              <select
                id="chartSelector"
                value={selectedChart}
                onChange={(e) => setSelectedChart(e.target.value)}
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                {chartOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              {chartOptions.find(option => option.id === selectedChart)?.description}
            </p>
          </div>
          
          {/* Chart Display Area */}
          <div className="bg-white rounded-lg h-96 flex flex-col">
            <h2 className="text-xl font-semibold mb-4">
              {chartOptions.find(option => option.id === selectedChart)?.name}
            </h2>
            <div className="flex-grow flex items-center justify-center">
              {renderChart()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
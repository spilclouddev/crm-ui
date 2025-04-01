import React from 'react';
import CanvasJSReact from '@canvasjs/react-charts';

const CanvasJS = CanvasJSReact.CanvasJS;
const CanvasJSChart = CanvasJSReact.CanvasJSChart;

const BarChart = () => {
  const options = {
    animationEnabled: true,
    theme: "light2",
    title: {
      text: ""  // Remove title from chart as it's already in the panel header
    },
    axisX: {
      title: "Social Network",
      reversed: true,
    },
    axisY: {
      title: "Monthly Active Users",
      includeZero: true,
      labelFormatter: addSymbols
    },
    data: [{
      type: "bar",
      dataPoints: [
        { y: 2200000000, label: "Facebook" },
        { y: 1800000000, label: "YouTube" },
        { y: 800000000, label: "Instagram" },
        { y: 563000000, label: "Qzone" },
        { y: 376000000, label: "Weibo" },
        { y: 336000000, label: "Twitter" },
        { y: 330000000, label: "Reddit" }
      ]
    }]
  };

  function addSymbols(e) {
    const suffixes = ["", "K", "M", "B"];
    let order = Math.max(Math.floor(Math.log(Math.abs(e.value)) / Math.log(1000)), 0);
    
    if (order > suffixes.length - 1) {
      order = suffixes.length - 1;
    }
    
    const suffix = suffixes[order];
    return CanvasJS.formatNumber(e.value / Math.pow(1000, order)) + suffix;
  }

  return (
    <div className="w-full h-full">
      <CanvasJSChart options={options} />
    </div>
  );
};

export default BarChart;
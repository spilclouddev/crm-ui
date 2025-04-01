import React from 'react';
import CanvasJSReact from '@canvasjs/react-charts';

const CanvasJSChart = CanvasJSReact.CanvasJSChart;

const ColumnChart = () => {
  const options = {
    animationEnabled: true,
    theme: "light2",
    title: {
      text: ""  // Remove title from chart as it's already in the panel header
    },
    axisY: {
      includeZero: true
    },
    data: [
      {
        type: "column",
        dataPoints: [
          { label: "Apple", y: 10 },
          { label: "Orange", y: 15 },
          { label: "Banana", y: 25 },
          { label: "Mango", y: 30 },
          { label: "Grape", y: 28 }
        ]
      }
    ]
  };

  return (
    <div className="w-full h-full">
      <CanvasJSChart options={options} />
    </div>
  );
};

export default ColumnChart;
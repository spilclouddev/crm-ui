import React from 'react';
import CanvasJSReact from '@canvasjs/react-charts';

const CanvasJSChart = CanvasJSReact.CanvasJSChart;

const DoughnutChart = () => {
  const options = {
    animationEnabled: true,
    title: {
      text: ""  // Remove title from chart as it's already in the panel header
    },
    subtitles: [{
      text: "71% Positive",
      verticalAlign: "center",
      fontSize: 24,
      dockInsidePlotArea: true
    }],
    data: [{
      type: "doughnut",
      showInLegend: true,
      indexLabel: "{name}: {y}",
      yValueFormatString: "#,###'%'",
      dataPoints: [
        { name: "Unsatisfied", y: 5 },
        { name: "Very Unsatisfied", y: 31 },
        { name: "Very Satisfied", y: 40 },
        { name: "Satisfied", y: 17 },
        { name: "Neutral", y: 7 }
      ]
    }]
  };

  return (
    <div className="w-full h-full">
      <CanvasJSChart options={options} />
    </div>
  );
};

export default DoughnutChart;
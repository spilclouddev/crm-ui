import React, { Component } from 'react';
import CanvasJSReact from '@canvasjs/react-charts';

const CanvasJSChart = CanvasJSReact.CanvasJSChart;

class FunnelChart extends Component {
  render() {
    const { title, dataPoints } = this.props;
    
    // Calculate percentages
    const total = dataPoints[0].y;
    const processedDataPoints = dataPoints.map((point, index) => {
      return {
        ...point,
        percentage: index === 0 
          ? 100 
          : ((point.y / total) * 100).toFixed(2)
      };
    });
    
    const options = {
      animationEnabled: true,
      title: {
        text: title || "Sales Analysis"
      },
      data: [{
        type: "funnel",
        toolTipContent: "<b>{label}</b>: {y} <b>({percentage}%)</b>",
        indexLabelPlacement: "inside",
        indexLabel: "{label} ({percentage}%)",
        dataPoints: processedDataPoints
      }]
    };
    
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
    { y: 1400, label: "Prospects" },
    { y: 1212, label: "Qualified Prospects" },
    { y: 1080, label: "Proposals" },
    { y: 665, label: "Negotiation" },
    { y: 578, label: "Final Sales" }
  ]
};

export default FunnelChart;
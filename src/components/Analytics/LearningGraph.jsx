import React from 'react';

const LearningGraph = ({ data }) => {
  // This would likely use a charting library like Chart.js or Recharts
  return (
    <div>
      <h3>Learning Graph</h3>
      <div style={{ height: '200px', border: '1px solid #ccc', padding: '1rem' }}>
        <p>(Chart will be rendered here)</p>
      </div>
    </div>
  );
};

export default LearningGraph;

import React from 'react';

const ProgressIndicator = ({ current, total }) => {
  const progressPercentage = total > 0 ? (current / total) * 100 : 0;

  return (
    <div>
      <span>Progress: {current} / {total}</span>
      <div style={{ width: '100%', backgroundColor: '#e0e0e0', borderRadius: '4px' }}>
        <div
          style={{
            width: `${progressPercentage}%`,
            height: '8px',
            backgroundColor: '#4caf50',
            borderRadius: '4px',
          }}
        />
      </div>
    </div>
  );
};

export default ProgressIndicator;

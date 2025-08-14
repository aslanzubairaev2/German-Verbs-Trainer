import React from 'react';

const DifficultySelector = ({ selected, onChange }) => {
  return (
    <div>
      <h4>Select Difficulty</h4>
      <label>
        <input
          type="radio"
          name="difficulty"
          value="auto"
          // checked={selected === 'auto'}
          // onChange={onChange}
        />
        Automatic
      </label>
      <label>
        <input
          type="radio"
          name="difficulty"
          value="manual"
          // checked={selected === 'manual'}
          // onChange={onChange}
        />
        Manual
      </label>
    </div>
  );
};

export default DifficultySelector;

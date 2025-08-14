import React, { useState } from 'react';

const AnswerInput = ({ onSubmit, disabled }) => {
  const [answer, setAnswer] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (answer.trim()) {
      onSubmit(answer);
      setAnswer('');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="Type your answer..."
        disabled={disabled}
        autoFocus
      />
      <button type="submit" disabled={disabled}>
        Check
      </button>
    </form>
  );
};

export default AnswerInput;

import React from 'react';

const ResultFeedback = ({ feedback }) => {
  if (!feedback) {
    return null;
  }

  const { isCorrect, correctAnswer } = feedback;

  return (
    <div style={{ color: isCorrect ? 'green' : 'red' }}>
      {isCorrect ? (
        <p>Correct! ✓</p>
      ) : (
        <p>Incorrect. The correct answer is: <strong>{correctAnswer}</strong></p>
      )}
    </div>
  );
};

export default ResultFeedback;

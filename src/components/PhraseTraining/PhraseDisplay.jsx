import React from 'react';

const PhraseDisplay = ({ phrase }) => {
  if (!phrase) {
    return <div>Loading phrase...</div>;
  }

  return (
    <div>
      <p>Translate the phrase:</p>
      <h2>{phrase.fullPhraseRussian}</h2>
    </div>
  );
};

export default PhraseDisplay;

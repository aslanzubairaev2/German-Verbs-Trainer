import React from 'react';
// import { PRONOUNS } from '../../data/pronouns';

const PronounSelector = ({ selected, onChange }) => {
  const PRONOUNS = []; // Placeholder
  return (
    <div>
      <h4>Select Pronouns</h4>
      {PRONOUNS.map(pronoun => (
        <label key={pronoun.base}>
          <input
            type="checkbox"
            // checked={selected.includes(pronoun.base)}
            // onChange={() => onChange(pronoun.base)}
          />
          {pronoun.german} ({pronoun.russian})
        </label>
      ))}
    </div>
  );
};

export default PronounSelector;

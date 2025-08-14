import { useState, useCallback } from 'react';
import SpacedRepetition from '../services/SpacedRepetition';

/**
 * Custom hook for managing spaced repetition logic for phrases.
 */
const useSpacedRepetition = (phraseHistory) => {
  const [reviewList, setReviewList] = useState([]);

  const getPhrasesForReview = useCallback(() => {
    const phrasesToReview = SpacedRepetition.getPhrasesForReview(phraseHistory);
    setReviewList(phrasesToReview);
    return phrasesToReview;
  }, [phraseHistory]);

  const updatePhraseAfterReview = useCallback((phrase, result) => {
    SpacedRepetition.updateRepetitionData(phrase, result);
    // This would likely trigger a re-fetch or update of the main user progress object.
  }, []);

  return { reviewList, getPhrasesForReview, updatePhraseAfterReview };
};

export default useSpacedRepetition;

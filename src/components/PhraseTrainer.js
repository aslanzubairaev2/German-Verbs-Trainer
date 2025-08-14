import React, { useState, useEffect, useRef, useCallback } from 'react';
import useSpeechSynthesis from '../hooks/useSpeechSynthesis';
import useProgress from '../hooks/useProgress';
import useSettings from '../hooks/useSettings';
import PhraseGenerator from '../services/PhraseGenerator';
import ProgressTracker from '../services/ProgressTracker';
import GeminiChatModal from './GeminiChatModal';
import CardPhrase from './CardPhrase'; // Assuming this can be adapted
import { Sparkles, Volume2, ChevronLeft, HelpCircle } from 'lucide-react';

/**
 * A completely refactored PhraseTrainer component that uses services and hooks
 * for adaptive learning, as per the technical specification.
 */
function PhraseTrainer({ onBackToMain, onNavigateToVerb }) {
  const [loading, setLoading] = useState(true);
  const [phrase, setPhrase] = useState(null);
  const [isFlipped, setIsFlipped] = useState(false);

  // --- New Architecture Hooks & Services ---
  const { settings } = useSettings();
  // NOTE: In a real multi-user app, the user ID would be dynamic.
  const { progress, setProgress } = useProgress('main_user');
  const { speak, isSpeaking } = useSpeechSynthesis();

  // --- Local UI State ---
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const cardRef = useRef(null);

  const fetchNextPhrase = useCallback(async () => {
    setLoading(true);
    setIsFlipped(false);
    // Add a small delay to make the transition smoother
    await new Promise(res => setTimeout(res, 200));

    const nextPhrase = PhraseGenerator.generateNext(progress, settings);
    setPhrase(nextPhrase);
    setLoading(false);
  }, [progress, settings]);

  useEffect(() => {
    if (progress) { // Ensure progress is loaded before fetching
      fetchNextPhrase();
    }
  }, [progress, fetchNextPhrase]);

  const handleAnswer = (isCorrect) => {
    if (!phrase) return;

    // Update progress using the tracker service
    const updatedProgress = ProgressTracker.updateProgress(progress, phrase, { isCorrect });
    setProgress(updatedProgress); // This will save to localStorage via the hook

    // Fetch the next phrase. The useEffect will trigger this automatically
    // when the `progress` state changes, but we can also call it directly
    // if we want a more immediate response.
    fetchNextPhrase();
  };

  // --- UI Handlers ---

  const flipCard = () => {
    if (loading) return;
    setIsFlipped(!isFlipped);
  };

  const speakGerman = () => {
    if (phrase && phrase.fullPhraseGerman) {
      speak(phrase.fullPhraseGerman, "de-DE");
    }
  };

  const openChatWithGemini = () => {
    if (!phrase) return;
    const initialMessage = `Explain the phrase: "${phrase.fullPhraseGerman}" (Russian: "${phrase.fullPhraseRussian}")`;
    // setInitialChatMessage(initialMessage); // This state needs to be added back if chat is used
    setShowChatModal(true);
  };

  // --- Swipe Handlers ---
  const handleTouchStart = (e) => {
    if (loading) return;
    const touch = e.touches[0];
    setSwipeOffset(0);
    setIsSwiping(true);
    cardRef.current.startX = touch.clientX;
  };

  const handleTouchMove = (e) => {
    if (!isSwiping || loading) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - cardRef.current.startX;
    setSwipeOffset(deltaX);
  };

  const handleTouchEnd = () => {
    if (!isSwiping || loading) return;
    const threshold = 100;
    if (swipeOffset > threshold) {
      handleAnswer(false); // Swipe right = incorrect/need more practice
    } else if (swipeOffset < -threshold) {
      handleAnswer(true); // Swipe left = correct
    }
    setSwipeOffset(0);
    setIsSwiping(false);
  };

  // The card display logic
  const renderCard = () => {
    if (loading) {
      return <div>Loading...</div>; // Replace with a proper skeleton loader
    }
    if (!phrase) {
      return <div>No phrases available.</div>;
    }
    return (
       <div
        ref={cardRef}
        onClick={flipCard}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          width: "100%",
          height: "250px", // Increased height for better display
          position: "relative",
          cursor: "pointer",
          transformStyle: "preserve-3d",
          transition: isSwiping ? "none" : "transform 0.6s ease",
          transform: `rotateY(${isFlipped ? '180deg' : '0deg'}) translateX(${swipeOffset}px)`,
          WebkitTapHighlightColor: "transparent",
        }}
      >
        {/* Front Side (Russian) */}
        <div style={{...styles.card, ...styles.cardFront}}>
          <div style={styles.cardHeader}>Переведите на немецкий:</div>
          <div style={styles.cardText}>{phrase.fullPhraseRussian || phrase.russian}</div>
          <div style={styles.cardFooter}>Нажмите для проверки</div>
        </div>
        {/* Back Side (German) */}
        <div style={{...styles.card, ...styles.cardBack}}>
          <div style={styles.cardHeader}>Правильный ответ:</div>
          <div style={styles.cardText}>{phrase.fullPhraseGerman || phrase.german}</div>
           <button onClick={speakGerman} disabled={isSpeaking} style={styles.speakButton}>
             <Volume2 size={20} />
           </button>
          <div style={styles.cardFooter}>Смахните влево (понятно) или вправо (повторить)</div>
        </div>
      </div>
    );
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={onBackToMain} style={styles.backButton} title="Вернуться">
          <ChevronLeft size={24} />
        </button>
        <h2 style={styles.title}>Тренировка фраз</h2>
      </div>

      <div style={{ perspective: "1000px", minHeight: "300px" }}>
        {renderCard()}
      </div>

      <div style={styles.controls}>
        <button style={{...styles.controlButton, ...styles.wrongButton}} onClick={() => handleAnswer(false)}>Повторить</button>
        <button style={{...styles.controlButton, ...styles.correctButton}} onClick={() => handleAnswer(true)}>Понятно</button>
      </div>

    </div>
  );
}

// Basic styles to make the component usable without external CSS
const styles = {
  container: {
    maxWidth: 500, margin: '1rem auto', textAlign: 'center', padding: '0 1rem', fontFamily: 'sans-serif'
  },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', position: 'relative'
  },
  backButton: {
    position: 'absolute', left: 0, background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem', color: '#64748b'
  },
  title: {
    color: '#1e293b', fontSize: '1.8rem', fontWeight: 600, margin: 0
  },
  card: {
    position: 'absolute', width: '100%', height: '100%', backfaceVisibility: 'hidden',
    borderRadius: '1rem', color: 'white', display: 'flex', flexDirection: 'column',
    justifyContent: 'center', alignItems: 'center', padding: '1.5rem', boxSizing: 'border-box',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
  },
  cardFront: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
  cardBack: {
    background: 'linear-gradient(135deg, #38ef7d 0%, #11998e 100%)',
    transform: 'rotateY(180deg)'
  },
  cardHeader: {
    fontSize: '1rem', opacity: 0.8, marginBottom: '1rem'
  },
  cardText: {
    fontSize: '1.5rem', fontWeight: 600, lineHeight: 1.4
  },
  cardFooter: {
    fontSize: '0.8rem', opacity: 0.7, marginTop: '1rem', fontStyle: 'italic'
  },
  speakButton: {
    background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white',
    borderRadius: '50%', width: '40px', height: '40px', cursor: 'pointer',
    position: 'absolute', bottom: '1rem', right: '1rem'
  },
  controls: {
    marginTop: '2rem', display: 'flex', justifyContent: 'center', gap: '1rem'
  },
  controlButton: {
    padding: '0.75rem 1.5rem', fontSize: '1rem', fontWeight: '600',
    border: 'none', borderRadius: '0.5rem', cursor: 'pointer', color: 'white'
  },
  wrongButton: {
    background: '#ef4444' // red
  },
  correctButton: {
    background: '#22c55e' // green
  }
};

export default PhraseTrainer;

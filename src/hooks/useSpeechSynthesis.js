import { useCallback, useState } from "react";

/**
 * Универсальный хук озвучивания текста через Web Speech API.
 * Возвращает speak(), isSpeaking и cancel().
 */
export function useSpeechSynthesis({ enabled = true, rate = 0.9 } = {}) {
  const [isSpeaking, setIsSpeaking] = useState(false);

  const speak = useCallback(
    (text, lang = "de-DE") => {
      if (!enabled) return;
      if (typeof window === "undefined" || !("speechSynthesis" in window))
        return;

      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.rate = rate;
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
      } catch {
        setIsSpeaking(false);
      }
    },
    [enabled, rate]
  );

  const cancel = useCallback(() => {
    try {
      if (typeof window !== "undefined") {
        window.speechSynthesis?.cancel?.();
      }
    } catch {}
    setIsSpeaking(false);
  }, []);

  return { speak, isSpeaking, cancel };
}

export default useSpeechSynthesis;

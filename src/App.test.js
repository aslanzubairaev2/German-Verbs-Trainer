import { render, screen } from '@testing-library/react';
import App from './App';

// Mocking the SpeechRecognition API as it's not available in JSDOM
const mockSpeechRecognition = {
  start: jest.fn(),
  stop: jest.fn(),
  onresult: null,
  onerror: null,
  onend: null,
};
window.SpeechRecognition = jest.fn().mockImplementation(() => mockSpeechRecognition);
window.webkitSpeechRecognition = jest.fn().mockImplementation(() => mockSpeechRecognition);


test('renders start screen with verb practice card', () => {
  render(<App />);
  const title = screen.getByText(/Verb Practice/i);
  expect(title).toBeInTheDocument();
});

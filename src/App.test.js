import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders start screen with verb practice card", () => {
  render(<App />);
  const title = screen.getByText(/Отработка глаголов/i);
  expect(title).toBeInTheDocument();
});

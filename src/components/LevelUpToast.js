import React from "react";
import { Unlock } from "lucide-react";

const LevelUpToast = ({ message, onDismiss }) => {
  if (!message) return null;
  return (
    <div className="level-up-toast">
      <Unlock />
      <span>{message}</span>
      <button onClick={onDismiss}>&times;</button>
    </div>
  );
};

export default LevelUpToast;

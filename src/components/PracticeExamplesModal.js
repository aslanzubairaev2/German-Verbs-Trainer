import React from "react";

function PracticeExamplesModal({ show, examples, onContinue }) {
  if (!show) return null;
  return (
    <div className="examples-bottom-modal-container">
      <div className="examples-bottom-modal-card slide-up">
        <div className="examples-bottom-modal-header">
          <div className="examples-bottom-modal-title">
            Ой, ошибка... Но это ничего!
          </div>
          <div className="examples-bottom-modal-subtitle">
            Посмотрим примеры для закрепления
          </div>
        </div>
        <div className="examples-bottom-modal-body">{examples}</div>
        <button className="examples-bottom-modal-btn" onClick={onContinue}>
          Продолжить
        </button>
      </div>
      <style>{`
        .examples-bottom-modal-container {
          position: fixed;
          left: 0; right: 0; bottom: 0;
          z-index: 100;
          display: flex;
          justify-content: center;
          align-items: flex-end;
          pointer-events: none;

        }
        .examples-bottom-modal-card {
          width: 100vw;

          max-width: 500px;
          border-radius: 1.2rem 1.2rem 0 0;
          background: #fff;
          box-shadow: 0 -8px 32px rgba(37,99,235,0.13), 0 -2px 8px rgba(0,0,0,0.07);
          padding: 2.2rem 1.5rem 2.2rem 1.5rem;
          margin: 0 0 0 0;
          min-height: 180px;
          display: flex;
          flex-direction: column;
          align-items: stretch;
          pointer-events: all;
          animation: slideUp 0.35s cubic-bezier(.4,0,.2,1);
        }
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .examples-bottom-modal-header {
          text-align: center;
          margin-bottom: 1.2rem;
        }
        .examples-bottom-modal-title {
          color: #2563eb;
          font-size: 1rem;
          font-weight: 700;
          margin-bottom: 0.2rem;
        }
        .examples-bottom-modal-subtitle {
          color: #64748b;
          font-size: 0.8rem;
          font-weight: 500;
        }
        .examples-bottom-modal-body {
          // margin-bottom: 2.2rem;
          margin-left: 5px;
        }
        .examples-bottom-modal-btn {
          background: #2563eb;
          color: white;
          border: none;
          padding: 1.1rem 0;
          border-radius: 0.7rem;
          font-weight: 600;
          font-size: 1.15rem;
          cursor: pointer;
          transition: background 0.2s;
          width: 100%;
          margin-top: 0.5rem;
        }
        .examples-bottom-modal-btn:hover {
          background: #1d4ed8;
        }
        @media (max-width: 480px) {
          .examples-bottom-modal-card {
            padding: 1.2rem 0.5rem 1.2rem 0.5rem;
            min-width: 0;
            border-radius: 1.1rem 1.1rem 0 0;
          }
        }
      `}</style>
    </div>
  );
}

export default PracticeExamplesModal;

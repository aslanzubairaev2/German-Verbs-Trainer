import React from "react";

/**
 * Компонент начального приветственного экрана.
 * Показывается, пока не активирован звук (audioReady === false).
 * При нажатии на кнопку вызывает onStart (обычно setAudioReady(true)).
 *
 * Изменения:
 * - Убрана иконка вверху (визуально стало проще).
 * - Кнопка без эмодзи, лаконичный текст.
 * - Описание стало короче и меньше по размеру.
 * - Шрифт заголовка и описания более нейтральный, без избыточной жирности.
 */
function StartScreen({ onStart }) {
  return (
    <div className="start-screen">
      <div className="start-box">
        <h1>Тренажёр немецких глаголов</h1>
        <p>Учите спряжения и формы немецких глаголов просто и удобно.</p>
        <button onClick={onStart}>Начать</button>
      </div>
      {/* 
        Стили для начального экрана.
        - Убрана иконка.
        - Описание и заголовок стали компактнее.
        - Кнопка без эмодзи.
        - Шрифт более нейтральный.
      */}
      <style>{`
        .start-screen {
          position: fixed; inset: 0; display: flex; align-items: center; justify-content: center;
          background: linear-gradient(120deg, #dbeafe 0%, #e0e7ff 100%);
          z-index: 1000;
          min-height: 100vh;
        }
        .start-box {
          text-align: center;
          padding: 2rem 1.5rem 2.2rem 1.5rem;
          background: rgba(255,255,255,0.97);
          border-radius: 1.1rem;
          box-shadow: 0 8px 32px rgba(37,99,235,0.10), 0 1.5px 8px rgba(0,0,0,0.06);
          max-width: 380px;
          margin: 1rem;
          animation: fadeInUp 0.7s cubic-bezier(.23,1.01,.32,1) both;
        }
        .start-box h1 {
          font-size: 1.6rem;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 0.7rem;
          letter-spacing: -0.5px;
          font-family: 'Segoe UI', Arial, sans-serif;
        }
        .start-box p {
          color: #475569;
          font-size: 0.98rem;
          margin-bottom: 1.7rem;
          line-height: 1.4;
          font-family: 'Segoe UI', Arial, sans-serif;
        }
        .start-box button {
          padding: 0.7rem 2rem;
          background: linear-gradient(90deg, #2563eb 60%, #1d4ed8 100%);
          color: #fff;
          border: none;
          border-radius: 0.7rem;
          font-size: 1.08rem;
          font-weight: 600;
          box-shadow: 0 4px 16px rgba(37, 99, 235, 0.13);
          cursor: pointer;
          transition: background 0.18s, transform 0.13s, box-shadow 0.18s;
          outline: none;
        }
        .start-box button:hover, .start-box button:focus {
          background: linear-gradient(90deg, #1d4ed8 60%, #2563eb 100%);
          transform: translateY(-2px) scale(1.035);
          box-shadow: 0 8px 24px rgba(37, 99, 235, 0.18);
        }
        @media (max-width: 480px) {
          .start-box {
            padding: 1rem 0.5rem 1.2rem 0.5rem;
            max-width: 98vw;
          }
          .start-box h1 { font-size: 1.1rem; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(32px);}
          to { opacity: 1; transform: none;}
        }
      `}</style>
    </div>
  );
}

export default StartScreen;

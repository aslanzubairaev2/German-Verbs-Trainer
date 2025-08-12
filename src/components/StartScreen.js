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
function StartScreen({ onStart, onStartCurriculum }) {
  return (
    <div className="start-screen">
      <div className="cards-container">
        {/* Карточка: Отработка глаголов */}
        <div className="start-card card-verbs">
          <h2>Отработка глаголов</h2>
          <p>Учите спряжения и формы немецких глаголов просто и удобно.</p>
          <button className="btn-verbs" onClick={onStart}>
            Начать
          </button>
        </div>
        {/* Карточка: Учиться по программе */}
        <div className="start-card card-curriculum">
          <h2>Учиться по программе</h2>
          <p>Индивидуальная программа: простые фразы ИИ по вашему уровню.</p>
          <button className="btn-curriculum" onClick={onStartCurriculum}>
            Начать
          </button>
        </div>
      </div>
      {/* Минималистичные стили для двух карточек */}
      <style>{`
        .start-screen { 
          position: fixed; inset: 0; 
          display: flex; align-items: center; justify-content: center;
          background: linear-gradient(120deg, #dbeafe 0%, #e0e7ff 100%);
          z-index: 1000; 
          min-height: 100vh; 
          overflow-y: auto; 
          padding: 2rem 1rem; 
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
        .cards-container { display: flex; flex-direction: column; gap: 1.2rem; align-items: center; justify-content: center; }
        .start-card { position: relative; text-align: center; padding: 2rem 1.5rem 2.2rem 1.5rem; background: #fff; border-radius: 1.1rem; box-shadow: 0 8px 32px rgba(37,99,235,0.10), 0 1.5px 8px rgba(0,0,0,0.06); max-width: 300px; min-width: 240px; margin: 0.5rem 0; border: none; }
        .card-verbs::before { content: ""; position: absolute; left: 0; top: 1.2rem; bottom: 1.2rem; width: 7px; border-radius: 6px; background: linear-gradient(180deg, #2563eb 0%, #7c3aed 100%); }
        .card-phrases::before { content: ""; position: absolute; left: 0; top: 1.2rem; bottom: 1.2rem; width: 7px; border-radius: 6px; background: linear-gradient(180deg, #fbbf24 0%, #ef4444 100%); }
        .card-curriculum::before { content: ""; position: absolute; left: 0; top: 1.2rem; bottom: 1.2rem; width: 7px; border-radius: 6px; background: linear-gradient(180deg, #10b981 0%, #2563eb 100%); }
        .start-card h2 { font-size: 1.25rem; font-weight: 700; color: #1e293b; margin-bottom: 0.1rem; letter-spacing: -0.5px; }
        .start-card p { color: #475569; font-size: 0.98rem; margin-bottom: 1.3rem; line-height: 1.4; }
        .btn-verbs { padding: 0.7rem 2rem; background: linear-gradient(90deg, #2563eb 0%, #7c3aed 100%); color: #fff; border: none; border-radius: 0.7rem; font-size: 1.08rem; font-weight: 600; box-shadow: 0 4px 16px rgba(37, 99, 235, 0.13); cursor: pointer; }
        .btn-verbs:hover, .btn-verbs:focus {
          background: linear-gradient(90deg, #7c3aed 0%, #2563eb 100%);
          transform: translateY(-2px) scale(1.035);
          box-shadow: 0 8px 24px rgba(37, 99, 235, 0.18);
        }
        .btn-phrases { padding: 0.7rem 2rem; background: linear-gradient(90deg, #fbbf24 0%, #ef4444 100%); color: #fff; border: none; border-radius: 0.7rem; font-size: 1.08rem; font-weight: 600; box-shadow: 0 4px 16px rgba(251, 191, 36, 0.13); cursor: pointer; }
        .btn-phrases:hover, .btn-phrases:focus {
          background: linear-gradient(90deg, #ef4444 0%, #fbbf24 100%);
          transform: translateY(-2px) scale(1.035);
          box-shadow: 0 8px 24px rgba(251, 191, 36, 0.18);
        }
        .btn-curriculum { padding: 0.7rem 2rem; background: linear-gradient(90deg, #10b981 0%, #2563eb 100%); color: #fff; border: none; border-radius: 0.7rem; font-size: 1.08rem; font-weight: 600; box-shadow: 0 4px 16px rgba(16, 185, 129, 0.13); cursor: pointer; }
        .btn-curriculum:hover, .btn-curriculum:focus {
          background: linear-gradient(90deg, #2563eb 0%, #10b981 100%);
          transform: translateY(-2px) scale(1.035);
          box-shadow: 0 8px 24px rgba(16, 185, 129, 0.18);
        }
        @media (max-width: 800px) { .cards-container { gap: 1rem; } }
        @media (max-width: 480px) {
          .start-box {
            padding: 1rem 0.5rem 1.2rem 0.5rem;
            max-width: 98vw;
          }
          .start-box h1 { font-size: 1.1rem; }
          .start-card {
            padding: 1rem 0.5rem 1.2rem 0.5rem;
            // max-width: 98vw;
          }
          .start-card h2 { font-size: 1.05rem; }
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

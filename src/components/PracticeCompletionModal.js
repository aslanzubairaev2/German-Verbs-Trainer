import React from "react";

/**
 * Модальное окно завершения практики глагола.
 * Показывает статистику, картинку и кнопки дальнейших действий.
 */
function PracticeCompletionModal({
  show,
  onClose,
  stats,
  onRestart,
  onNextVerb,
  onBackToStudy,
  nextVerb,
}) {
  if (!show) return null;

  const { mistakeStats = [] } = stats || {};
  const hasMistakeRounds = mistakeStats && mistakeStats.length > 1;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content completion-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="completion-header">
          <div className="completion-image">
            <img
              src="/completion.png"
              alt="Поздравление"
              onError={(e) => {
                e.target.style.display = "none";
                e.target.nextSibling.style.display = "block";
              }}
            />
            <div className="fallback-icon" style={{ display: "none" }}>
              🎉
            </div>
          </div>
          <h2 className="completion-title">Отлично!</h2>
          <p className="completion-subtitle">
            Вы прошли все формы этого глагола
          </p>
        </div>

        <div className="completion-stats compact">
          <div className="stat-item">
            <span className="stat-label">Правильных подряд:</span>
            <span className="stat-value">{stats.streak}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Ошибок:</span>
            <span className="stat-value">{stats.errors}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Всего попыток:</span>
            <span className="stat-value">{stats.total}</span>
          </div>
        </div>

        {hasMistakeRounds && (
          <div className="mistake-rounds-block">
            <div className="mistake-rounds-title">Работа над ошибками:</div>
            {mistakeStats.slice(1).map((r, idx) => (
              <div className="mistake-round-row" key={idx}>
                <span>Раунд {r.round}:</span>
                <span>
                  Ошибок: <b>{r.errors}</b> / Попыток: <b>{r.total}</b>
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="completion-actions" style={{ marginTop: "1.2rem" }}>
          <button className="next-btn-big compact" onClick={onNextVerb}>
            Следующий глагол{nextVerb ? `: ${nextVerb}` : ""}
          </button>
          <div className="back-link compact" onClick={onBackToStudy}>
            Вернуться в обучение
          </div>
        </div>

        <style>{`
          .completion-modal {
            max-width: 480px;
            padding: 2rem;
            text-align: center;
          }
          .completion-header {
            margin-bottom: 2rem;
          }
          .completion-image {
            margin-bottom: 1.5rem;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 120px;
          }
          .completion-image img {
            max-width: 100%;
            max-height: 120px;
            width: auto;
            height: auto;
            object-fit: contain;
          }
          .fallback-icon {
            font-size: 4rem;
            color: #facc15;
          }
          .completion-title {
            font-size: 1.8rem;
            font-weight: 700;
            color: #1e293b;
            margin: 0 0 0.5rem 0;
          }
          .completion-subtitle {
            font-size: 1.1rem;
            color: #64748b;
            margin: 0;
          }
          .completion-stats {
            background: #f8fafc;
            border-radius: 0.75rem;
            padding: 1.5rem;
            margin-bottom: 2rem;
          }
          .completion-stats.compact {
            background: #f3f4f6;
            border-radius: 0.6rem;
            padding: 0.8rem 1.2rem;
            margin-bottom: 1.2rem;
            font-size: 0.98rem;
            display: flex;
            flex-direction: row;
            justify-content: center;
            gap: 1.5rem;
          }
          .stat-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 0.75rem;
          }
          .stat-item:last-child {
            margin-bottom: 0;
          }
          .stat-label {
            color: #64748b;
            font-size: 1rem;
          }
          .stat-value {
            color: #2563eb;
            font-weight: 600;
            font-size: 1.1rem;
          }
          .stat-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            margin-bottom: 0;
            gap: 0.1rem;
          }
          .stat-label {
            color: #64748b;
            font-size: 0.97rem;
            margin-bottom: 0.1rem;
          }
          .stat-value {
            color: #2563eb;
            font-weight: 600;
            font-size: 1.08rem;
          }
          .completion-actions {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 1.5rem;
          }
          .completion-actions {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 1.1rem;
          }
          .next-btn-big {
            background: #22c55e;
            color: white;
            font-size: 1.25rem;
            font-weight: 700;
            border: none;
            border-radius: 0.9rem;
            padding: 1.2rem 2.5rem;
            cursor: pointer;
            box-shadow: 0 2px 8px rgba(34,197,94,0.10);
            transition: background 0.18s, transform 0.15s;
          }
          .next-btn-big:hover {
            background: #16a34a;
            transform: scale(1.04);
          }
          .next-btn-big.compact {
            background: #22c55e;
            color: white;
            font-size: 1.1rem;
            font-weight: 700;
            border: none;
            border-radius: 0.7rem;
            padding: 1rem 2rem;
            cursor: pointer;
            box-shadow: 0 2px 8px rgba(34,197,94,0.10);
            transition: background 0.18s, transform 0.15s;
          }
          .next-btn-big.compact:hover {
            background: #16a34a;
            transform: scale(1.03);
          }
          .back-link {
            color: #2563eb;
            font-size: 1.08rem;
            font-weight: 500;
            cursor: pointer;
            text-decoration: underline;
            margin-top: 0.5rem;
            transition: color 0.18s;
          }
          .back-link:hover {
            color: #1d4ed8;
          }
          .back-link.compact {
            color: #64748b;
            font-size: 0.98rem;
            font-weight: 500;
            cursor: pointer;
            text-decoration: none;
            margin-top: 0.2rem;
            transition: color 0.18s;
          }
          .back-link.compact:hover {
            color: #1d4ed8;
          }
          .mistake-rounds-block {
            background: #f3f4f6;
            border-radius: 0.7rem;
            padding: 1.1rem 1rem 1rem 1rem;
            margin: 1.2rem 0 1.5rem 0;
          }
          .mistake-rounds-title {
            color: #2563eb;
            font-weight: 600;
            font-size: 1.08rem;
            margin-bottom: 0.5rem;
          }
          .mistake-round-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 1rem;
            margin-bottom: 0.3rem;
          }
          @media (max-width: 480px) {
            .completion-modal {
              padding: 1.5rem;
              margin: 1rem;
            }
            .completion-title {
              font-size: 1.5rem;
            }
            .completion-subtitle {
              font-size: 1rem;
            }
          }
        `}</style>
      </div>
    </div>
  );
}

export default PracticeCompletionModal;

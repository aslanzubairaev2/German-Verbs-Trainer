import React from "react";
import { Volume2 } from "lucide-react";

const ConjugationTable = ({ forms, speak, isSpeaking }) => {
  if (!forms) return <p>Нет данных для таблицы.</p>;

  const tenses = [
    { key: "present", name: "Наст." },
    { key: "past", name: "Прош." },
    { key: "future", name: "Будущ." },
  ];

  const renderCellContent = (text) => {
    if (!text || text === "-") return "-";
    const cleanText = text.replace(/<b>/g, "").replace(/<\/b>/g, "");
    return (
      <div className="table-cell-content">
        <span dangerouslySetInnerHTML={{ __html: text }} />
        <button
          onClick={(e) => {
            e.stopPropagation();
            speak(cleanText);
          }}
          disabled={isSpeaking}
          className="speak-btn-tiny"
        >
          <Volume2 size={14} />
        </button>
      </div>
    );
  };

  return (
    <div className="conjugation-table-wrapper">
      <table className="conjugation-table">
        <thead>
          <tr>
            <th>Время</th>
            <th>Утв. (+)</th>
            <th>Отр. (-)</th>
            <th>Вопр. (?)</th>
          </tr>
        </thead>
        <tbody>
          {tenses.map((tense) => (
            <tr key={tense.key}>
              <td>{tense.name}</td>
              <td>{renderCellContent(forms[tense.key]?.affirmative)}</td>
              <td>{renderCellContent(forms[tense.key]?.negative)}</td>
              <td>{renderCellContent(forms[tense.key]?.question)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ConjugationTable;

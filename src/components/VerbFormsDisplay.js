import React, { useState, useEffect, useRef } from "react";
import { Volume2, LoaderCircle } from "lucide-react";
import { pronouns } from "../constants";

const VerbFormsDisplay = ({ verb, speak, isSpeaking, fetchVerbForms }) => {
  const [formsInfo, setFormsInfo] = useState({
    loading: true,
    data: null,
    error: null,
  });
  const [selectedPronounIndex, setSelectedPronounIndex] = useState(0);
  const pronounContainerRef = useRef(null);
  const activePronounRef = useRef(null);

  const handlePronounChange = (index) => {
    setSelectedPronounIndex(index);
  };

  useEffect(() => {
    setFormsInfo({ loading: true, data: null, error: null });
    const selectedPronoun = pronouns[selectedPronounIndex];
    fetchVerbForms(verb, selectedPronoun, setFormsInfo);
  }, [verb, selectedPronounIndex, fetchVerbForms]);

  useEffect(() => {
    if (activePronounRef.current) {
      activePronounRef.current.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }
  }, [selectedPronounIndex]);

  const renderCellContent = (text) => {
    if (!text || text === "-") return "-";
    const cleanText = text.replace(/<\/?[^>]+(>|$)/g, "");
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

  let content;
  if (formsInfo.loading) {
    content = (
      <div className="loader-container">
        <LoaderCircle className="loader" />
        <p>Loading forms...</p>
      </div>
    );
  } else if (formsInfo.error) {
    content = <div className="error-box">{formsInfo.error}</div>;
  } else if (!formsInfo.data || !formsInfo.data.forms) {
    content = (
      <div className="error-box">Failed to load verb forms.</div>
    );
  } else {
    const { present, past, future } = formsInfo.data.forms;
    const tenses = [
      { key: "present", name: "Pres.", data: present },
      { key: "past", name: "Past", data: past },
      { key: "future", name: "Fut.", data: future },
    ];
    content = (
      <div className="verb-forms-grid-table-wrapper">
        <table className="verb-forms-grid-table">
          <thead>
            <tr>
              <th className="sticky-col">Tense</th>
              <th>Affirmative (+)</th>
              <th>Negative (-)</th>
              <th>Question (?)</th>
            </tr>
          </thead>
          <tbody>
            {tenses.map((tense) =>
              tense.data ? (
                <tr key={tense.key}>
                  <td className="sticky-col">{tense.name}</td>
                  <td>{renderCellContent(tense.data.affirmative)}</td>
                  <td>{renderCellContent(tense.data.negative)}</td>
                  <td>{renderCellContent(tense.data.question)}</td>
                </tr>
              ) : null
            )}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="verb-forms-container">
      <div className="table-content-wrapper">{content}</div>
      <div className="pronoun-selector-wrapper">
        <div className="pronoun-selector-container" ref={pronounContainerRef}>
          {pronouns.map((p, index) => (
            <button
              key={p.german}
              ref={index === selectedPronounIndex ? activePronounRef : null}
              className={`${"pronoun-selector-btn"} ${
                index === selectedPronounIndex ? "active" : ""
              }`}
              onClick={() => handlePronounChange(index)}
            >
              {p.german}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VerbFormsDisplay;

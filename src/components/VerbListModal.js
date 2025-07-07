import React, { useState, useMemo } from "react";
import { X, Search, Check } from "lucide-react";

const LEVEL_ORDER = ["A1", "A2", "B1", "B2"];

const VerbListModal = ({
  show,
  onClose,
  onSelectVerb,
  verbs,
  masteredVerbs,
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredVerbs = useMemo(() => {
    if (!searchTerm) return verbs;
    const lowercasedFilter = searchTerm.toLowerCase();
    return verbs.filter(
      (verb) =>
        verb.infinitive.toLowerCase().includes(lowercasedFilter) ||
        verb.russian.toLowerCase().includes(lowercasedFilter)
    );
  }, [searchTerm, verbs]);

  const groupedVerbs = useMemo(() => {
    return filteredVerbs.reduce((acc, verb) => {
      (acc[verb.level] = acc[verb.level] || []).push(verb);
      return acc;
    }, {});
  }, [filteredVerbs]);

  if (!show) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content verb-list-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="modal-close-btn">
          <X />
        </button>
        <div className="verb-list-header">
          <h3 className="modal-title">Список глаголов</h3>
          <div className="search-bar">
            <Search size={18} />
            <input
              type="text"
              placeholder="Поиск на немецком или русском..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="modal-body-container">
          {Object.keys(groupedVerbs).length > 0 ? (
            LEVEL_ORDER.map(
              (level) =>
                groupedVerbs[level] && (
                  <div key={level}>
                    <h4 className="level-header">{level}</h4>
                    <ul className="verb-list">
                      {groupedVerbs[level].map((verb) => (
                        <li
                          key={verb.infinitive}
                          onClick={() => onSelectVerb(verb)}
                        >
                          <span>
                            {verb.infinitive}{" "}
                            <span className="verb-translation">
                              ({verb.russian})
                            </span>
                          </span>
                          {masteredVerbs.includes(verb.infinitive) && (
                            <Check className="check-mark" size={18} />
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )
            )
          ) : (
            <p className="no-results">Глаголы не найдены.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerbListModal;

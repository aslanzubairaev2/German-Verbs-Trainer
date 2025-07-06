import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Check, X, Volume2, Settings, Sparkles, LoaderCircle, Unlock, HelpCircle, Lightbulb, List, Search, AlertTriangle, RefreshCw, ChevronDown } from 'lucide-react';
import { allVerbs } from './verbsData.js'; // <-- ВАШ ФАЙЛ С ГЛАГОЛАМИ ПОДКЛЮЧЕН ЗДЕСЬ

// --- ОСНОВНЫЕ ДАННЫЕ ---
const pronouns = [
    { german: 'ich', russian: 'я' }, { german: 'du', russian: 'ты' },
    { german: 'er', russian: 'он' }, { german: 'sie', russian: 'она' }, { german: 'es', russian: 'оно' },
    { german: 'wir', russian: 'мы' }, { german: 'ihr', russian: 'вы' },
    { german: 'sie', russian: 'они' }, { german: 'Sie', russian: 'Вы (вежл.)' }
];

const LEVEL_ORDER = ['A1', 'A2', 'B1', 'B2'];
const LEVEL_UP_REQUIREMENTS = { correctAnswers: 25, accuracy: 0.8 };

// --- ВСПОМОГАТЕЛЬНЫЕ КОМПОНЕНТЫ ---

const VerbListModal = ({ show, onClose, onSelectVerb, verbs, masteredVerbs }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredVerbs = useMemo(() => {
        if (!searchTerm) return verbs;
        const lowercasedFilter = searchTerm.toLowerCase();
        return verbs.filter(verb =>
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
            <div className="modal-content verb-list-modal" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="modal-close-btn"><X /></button>
                <div className="verb-list-header">
                    <h3 className="modal-title">Список глаголов</h3>
                    <div className="search-bar">
                        <Search size={18} />
                        <input type="text" placeholder="Поиск на немецком или русском..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    </div>
                </div>
                <div className="modal-body-container">
                    {Object.keys(groupedVerbs).length > 0 ? (
                        LEVEL_ORDER.map(level => groupedVerbs[level] && (
                            <div key={level}>
                                <h4 className="level-header">{level}</h4>
                                <ul className="verb-list">
                                    {groupedVerbs[level].map(verb => (
                                        <li key={verb.infinitive} onClick={() => onSelectVerb(verb)}>
                                            <span>{verb.infinitive} <span className="verb-translation">({verb.russian})</span></span>
                                            {masteredVerbs.includes(verb.infinitive) && <Check className="check-mark" size={18} />}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))
                    ) : (
                        <p className="no-results">Глаголы не найдены.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

const SettingsModal = ({ show, onClose, autoPlay, setAutoPlay, onResetProgress }) => {
    const [activeTab, setActiveTab] = useState('settings');
    const [confirmReset, setConfirmReset] = useState(false);
    
    const handleReset = () => {
        onResetProgress();
        onClose();
    };

    if (!show) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="modal-close-btn"><X /></button>
                <div className="settings-tabs">
                    <button className={activeTab === 'settings' ? 'active' : ''} onClick={() => setActiveTab('settings')}><Settings /> Настройки</button>
                    <button className={activeTab === 'info' ? 'active' : ''} onClick={() => setActiveTab('info')}><HelpCircle /> Справка</button>
                </div>
                <div className="modal-body-container">
                    {activeTab === 'settings' && (<>
                        <div className="settings-row">
                            <span>Автоозвучивание</span>
                            <button onClick={() => setAutoPlay(!autoPlay)} className={`toggle-btn ${autoPlay ? 'on' : 'off'}`}>
                                {autoPlay ? <Volume2 /> : <X />}<span>{autoPlay ? 'Вкл' : 'Выкл'}</span>
                            </button>
                        </div>
                        <div className="reset-section">
                            <h4>Сброс прогресса</h4>
                            <p>Это действие удалит все данные о пройденных глаголах и открытых уровнях.</p>
                            {!confirmReset ? (
                                <button className="reset-btn-initial" onClick={() => setConfirmReset(true)}>Сбросить весь прогресс</button>
                            ) : (
                                <div className="reset-confirm">
                                    <p>Вы уверены?</p>
                                    <button className="reset-btn-cancel" onClick={() => setConfirmReset(false)}>Отмена</button>
                                    <button className="reset-btn-confirm" onClick={handleReset}><AlertTriangle size={16}/> Да, сбросить</button>
                                </div>
                            )}
                        </div>
                    </>)}
                    {activeTab === 'info' && (
                        <div className="info-tab">
                             <h4>Основы спряжения глаголов</h4>
                             <p>В немецком, как и в русском, глаголы меняют свою форму в зависимости от того, кто выполняет действие (лицо) и когда (время). Этот процесс называется <strong>спряжением</strong>.</p>
                             <h5>Типы глаголов:</h5>
                             <ul>
                                 <li><strong>Слабые (правильные):</strong> Самая простая группа. Они спрягаются по четким правилам, добавляя стандартные окончания к основе глагола. Пример: <em>machen (делать) -> ich mach<strong>e</strong>, du mach<strong>st</strong></em>.</li>
                                 <li><strong>Сильные (неправильные):</strong> Эти глаголы "не подчиняются" общим правилам. При спряжении у них часто меняется корневая гласная. Пример: <em>sprechen (говорить) -> ich spreche, du spr<strong>i</strong>chst</em>. Их формы нужно запоминать.</li>
                                 <li><strong>Смешанные:</strong> Редкая группа, которая ведет себя как слабые глаголы (берет их окончания), но при этом меняет корневую гласную, как сильные. Пример: <em>denken (думать) -> ich dachte (в прошлом времени)</em>.</li>
                             </ul>
                             <h5>Стандартные окончания (для слабых глаголов):</h5>
                             <table>
                                 <tbody>
                                     <tr><td>ich (я)</td><td>-e</td></tr>
                                     <tr><td>du (ты)</td><td>-st</td></tr>
                                     <tr><td>er/sie/es (он/она/оно)</td><td>-t</td></tr>
                                     <tr><td>wir (мы)</td><td>-en</td></tr>
                                     <tr><td>ihr (вы, мн.ч.)</td><td>-t</td></tr>
                                     <tr><td>sie/Sie (они/Вы)</td><td>-en</td></tr>
                                 </tbody>
                             </table>
                              <p>Этот тренажер поможет вам отработать и запомнить формы самых важных глаголов.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const ConjugationTable = ({ forms, speak, isSpeaking }) => {
    if (!forms) return <p>Нет данных для таблицы.</p>;

    const tenses = [
        { key: 'present', name: 'Наст.' },
        { key: 'past', name: 'Прош.' },
        { key: 'future', name: 'Будущ.' },
    ];

    const renderCellContent = (text) => {
        if (!text || text === '-') return '-';
        const cleanText = text.replace(/<b>/g, '').replace(/<\/b>/g, '');
        return (
            <div className="table-cell-content">
                <span dangerouslySetInnerHTML={{ __html: text }} />
                <button onClick={(e) => { e.stopPropagation(); speak(cleanText); }} disabled={isSpeaking} className="speak-btn-tiny"><Volume2 size={14} /></button>
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
                    {tenses.map(tense => (
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


const GeminiInfoModal = ({ show, onClose, verb, onFetch, speak, isSpeaking }) => {
    const [geminiInfo, setGeminiInfo] = useState({ loading: false, data: null, error: null });
    const [activeIndex, setActiveIndex] = useState(null); 
    
    const handleFetch = useCallback((force = false) => {
        onFetch(verb, setGeminiInfo, force);
    }, [verb, onFetch]);

    useEffect(() => {
        if (show) {
            document.body.style.overflow = 'hidden';
            handleFetch(false);
            setActiveIndex(null);
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [show, handleFetch]);
    
    const handleToggle = (index) => {
        setActiveIndex(activeIndex === index ? null : index);
    };

    const formatVerbInfo = (info) => {
        if (!info) return null;
        const { type, regularity } = info;
        if (!type && !regularity) return null;

        let result = '';
        if (type) {
            result += type.charAt(0).toUpperCase() + type.slice(1);
        }
        if (regularity) {
            result += ` (${regularity})`;
        }
        return result + ' глагол';
    };

    if (!show) return null;

    let content;
    if (geminiInfo.loading) {
        content = <div className="loader-container"><LoaderCircle className="loader" /><p>Gemini генерирует информацию...</p></div>;
    } else if (geminiInfo.error) {
        content = <div className="error-box">{geminiInfo.error}</div>;
    } else if (geminiInfo.data?.examples && Array.isArray(geminiInfo.data.examples)) {
        content = (
            <div className="gemini-data">
                <ul className="accordion-list">
                    {geminiInfo.data.examples.map((ex, i) => {
                        if (!ex || !ex.german_initial || !ex.russian) return null;
                        const isActive = activeIndex === i;
                        const cleanInitial = ex.german_initial.replace(/<b>/g, '').replace(/<\/b>/g, '');
                        return (
                            <li key={i} className="accordion-item">
                                <div className="accordion-header" onClick={() => handleToggle(i)}>
                                    <div className="accordion-title">
                                        <p className="example-german">
                                            <strong className="pronoun-tag">{ex.pronoun}</strong> {ex.german_initial.replace(/<b>/g, '<b>').replace(/<\/b>/g, '</b>')}
                                        </p>
                                        <p className="example-russian">{ex.russian}</p>
                                    </div>
                                    <div className="accordion-controls">
                                         <button onClick={(e) => { e.stopPropagation(); speak(`${ex.pronoun} ${cleanInitial}`); }} disabled={isSpeaking} className="speak-btn-small"><Volume2 size={18} /></button>
                                         <ChevronDown className={`accordion-icon ${isActive ? 'active' : ''}`} />
                                    </div>
                                </div>
                                <div className={`accordion-content ${isActive ? 'active' : ''}`}>
                                    {isActive && <ConjugationTable forms={ex.forms} speak={speak} isSpeaking={isSpeaking} />}
                                </div>
                            </li>
                        );
                    })}
                </ul>
            </div>
        );
    } else {
        content = <div className="error-box">Получены некорректные данные. Попробуйте сгенерировать снова.</div>;
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="gemini-modal-header">
                    <div>
                        <h3 className="modal-title"><Sparkles className="icon-purple" />{verb.infinitive}</h3>
                        {geminiInfo.data?.verb_info && (
                             <p className="verb-info-subtitle">{formatVerbInfo(geminiInfo.data.verb_info)}</p>
                        )}
                    </div>
                    <button onClick={onClose} className="modal-close-btn"><X /></button>
                </div>
                <div className="modal-body-container">
                    {content}
                </div>
                <div className="modal-footer">
                    <button className="regenerate-btn-footer" onClick={() => handleFetch(true)} disabled={geminiInfo.loading}>
                        {geminiInfo.loading ? <LoaderCircle className="loader-small" /> : <RefreshCw size={16} />}
                        <span>Еще варианты</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

const LevelUpToast = ({ message, onDismiss }) => {
    if (!message) return null;
    return <div className="level-up-toast"><Unlock /><span>{message}</span><button onClick={onDismiss}>&times;</button></div>;
};

// --- ОСНОВНОЙ КОМПОНЕНТ ПРИЛОЖЕНИЯ ---
function GermanVerbsApp() {
    // --- STATE ---
    const [appState, setAppState] = useState(() => {
        try {
            const savedState = localStorage.getItem('germanVerbsState');
            const initialState = {
                unlockedLevels: ['A1'],
                levelProgress: LEVEL_ORDER.reduce((acc, level) => ({ ...acc, [level]: { correct: 0, total: 0, uniqueVerbs: [] } }), {}),
                masteredVerbs: [],
                lastVerbIndex: 0,
            };
            return savedState ? { ...initialState, ...JSON.parse(savedState) } : initialState;
        } catch (error) {
            console.error("Failed to parse state from localStorage", error);
            return { unlockedLevels: ['A1'], levelProgress: {}, masteredVerbs: [], lastVerbIndex: 0 };
        }
    });
    
    const [practiceMode, setPracticeMode] = useState(false);
    const [userAnswer, setUserAnswer] = useState('');
    const [currentPronoun, setCurrentPronoun] = useState(0);
    const [feedback, setFeedback] = useState('');
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [audioReady, setAudioReady] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [autoPlay, setAutoPlay] = useState(true);
    const [showVerbList, setShowVerbList] = useState(false);
    const [hintUsed, setHintUsed] = useState(false);
    const [showHint, setShowHint] = useState(false);
    const [levelUpMessage, setLevelUpMessage] = useState('');
    const [showGeminiModal, setShowGeminiModal] = useState(false);
    const [geminiDataCache, setGeminiDataCache] = useState({});

    // --- DERIVED STATE & MEMOS ---
    const availableVerbsForProgression = useMemo(() => allVerbs.filter(verb => appState.unlockedLevels.includes(verb.level)), [appState.unlockedLevels]);
    const currentVerb = allVerbs[appState.lastVerbIndex];
    const currentLevel = appState.unlockedLevels[appState.unlockedLevels.length - 1];

    // --- EFFECTS ---
    useEffect(() => {
        localStorage.setItem('germanVerbsState', JSON.stringify(appState));
    }, [appState]);

    // --- API & AUDIO ---
    const speak = useCallback((text, lang = 'de-DE') => {
        if (!audioReady || !('speechSynthesis' in window)) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.rate = 0.9;
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
    }, [audioReady]);

    const fetchGeminiInfo = useCallback(async (verb, setter, force = false) => {
        if (geminiDataCache[verb.infinitive] && !force) {
            setter({ loading: false, data: geminiDataCache[verb.infinitive], error: null });
            return;
        }
        setter({ loading: true, data: null, error: null });
        
        const apiKey = process.env.REACT_APP_GEMINI_API_KEY; // <-- ВАШ КЛЮЧ ПОДКЛЮЧАЕТСЯ ЗДЕСЬ
        if (!apiKey) {
            setter({ loading: false, data: null, error: "API ключ не настроен в файле .env" });
            return;
        }
        
        const prompt = `
          Для немецкого глагола '${verb.infinitive}' (${verb.russian}), создай JSON объект.
          Этот объект должен содержать два ключа: "verb_info" и "examples".
          
          1. "verb_info": объект с двумя полями:
             - "type": тип глагола на русском ("слабый", "сильный" или "смешанный").
             - "regularity": на русском ("правильный" или "неправильный").
          
          2. "examples": массив примеров. Создай по одному примеру для каждого местоимения: ich, du, er/sie/es, wir, ihr, sie/Sie.
          
          Каждый элемент в массиве "examples" должен быть объектом со следующей структурой:
          - "pronoun": "ich" (например)
          - "german_initial": "простое предложение в настоящем времени БЕЗ МЕСТОИМЕНИЯ, где глагол или его части обернуты в теги <b></b>."
          - "russian": "полный перевод этого предложения"
          - "forms": вложенный объект, содержащий 3 времени (present, past, future), где глаголы также обернуты в <b></b>.

          Структура объекта "forms":
          - "present": { "question": "...", "affirmative": "...", "negative": "..." }
          - "past": { "question": "...", "affirmative": "...", "negative": "..." } (используй Perfekt)
          - "future": { "question": "...", "affirmative": "...", "negative": "..." } (используй Futur I)

          Пример для "ich komme":
          {
            "verb_info": { "type": "сильный", "regularity": "неправильный" },
            "examples": [
              {
                "pronoun": "ich",
                "german_initial": "<b>komme</b> nach Hause.",
                "russian": "Я иду домой.",
                "forms": {
                  "present": { "question": "<b>Komme</b> ich nach Hause?", "affirmative": "Ich <b>komme</b> nach Hause.", "negative": "Ich <b>komme</b> nicht nach Hause." },
                  "past": { "question": "<b>Bin</b> ich nach Hause <b>gekommen</b>?", "affirmative": "Ich <b>bin</b> nach Hause <b>gekommen</b>.", "negative": "Ich <b>bin</b> nicht nach Hause <b>gekommen</b>." },
                  "future": { "question": "<b>Werde</b> ich nach Hause <b>kommen</b>?", "affirmative": "Ich <b>werde</b> nach Hause <b>kommen</b>.", "negative": "Ich <b>werde</b> nicht nach Hause <b>kommen</b>." }
                }
              }
            ]
          }
          Создай полный JSON с такой структурой для всех местоимений для глагола '${verb.infinitive}'.
        `;
        
        const payload = { 
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json" }
        };
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;

        try {
            const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            if (!response.ok) throw new Error(`API Error: ${response.status} ${response.statusText}`);
            const result = await response.json();
            
            if (!result.candidates?.[0]?.content?.parts?.[0]?.text) {
                throw new Error("Пустой или некорректный ответ от Gemini.");
            }
            
            let parsedJson;
            try {
               parsedJson = JSON.parse(result.candidates[0].content.parts[0].text);
            } catch (e) {
                console.error("Failed to parse JSON from Gemini:", result.candidates[0].content.parts[0].text);
                throw new Error("Не удалось обработать ответ от Gemini (неверный JSON).");
            }

            if (Array.isArray(parsedJson)) parsedJson = parsedJson[0];
            
            if (!parsedJson || !parsedJson.examples || !Array.isArray(parsedJson.examples)) {
                throw new Error("Некорректный формат данных от Gemini.");
            }

            setGeminiDataCache(prev => ({...prev, [verb.infinitive]: parsedJson}));
            setter({ loading: false, data: parsedJson, error: null });
        } catch (error) {
            console.error("Fetch Gemini Info Error:", error);
            setter({ loading: false, data: null, error: error.message || "Не удалось получить данные от Gemini." });
        }
    }, [geminiDataCache]);

    // --- LOGIC ---
    const speakFullPhrase = (pronounIndex) => {
        const pronoun = pronouns[pronounIndex].german;
        const verbForm = currentVerb.forms[pronounIndex];
        speak(`${pronoun} ${verbForm}`);
    };

    const checkLevelUp = useCallback((level) => {
        const progress = appState.levelProgress[level];
        const nextLevelIndex = LEVEL_ORDER.indexOf(level) + 1;
        if (nextLevelIndex >= LEVEL_ORDER.length || appState.unlockedLevels.includes(LEVEL_ORDER[nextLevelIndex])) return;
        
        const accuracy = progress.total > 0 ? progress.correct / progress.total : 0;
        
        if (progress.uniqueVerbs.length >= LEVEL_UP_REQUIREMENTS.correctAnswers && accuracy >= LEVEL_UP_REQUIREMENTS.accuracy) {
            setAppState(prev => ({...prev, unlockedLevels: [...prev.unlockedLevels, LEVEL_ORDER[nextLevelIndex]]}));
            setLevelUpMessage(`Поздравляем! Вы открыли уровень ${LEVEL_ORDER[nextLevelIndex]}!`);
            setTimeout(() => setLevelUpMessage(''), 5000);
        }
    }, [appState.levelProgress, appState.unlockedLevels]);

    const checkAnswer = () => {
        const correctAnswer = currentVerb.forms[currentPronoun];
        const isCorrect = userAnswer.toLowerCase().trim() === correctAnswer;
        
        if (isCorrect) {
            setFeedback('Правильно! ✓');
            speakFullPhrase(currentPronoun);
            
            if (!hintUsed) {
                const newMasterySet = new Set(appState.masteredVerbs).add(currentVerb.infinitive);
                if (newMasterySet.size > appState.masteredVerbs.length) {
                     setAppState(prev => ({...prev, masteredVerbs: [...newMasterySet]}));
                }
            }
            
            const verbLevel = currentVerb.level;
            setAppState(prev => {
                const newProgress = { ...prev.levelProgress };
                newProgress[verbLevel].correct += 1;
                newProgress[verbLevel].total += 1;
                if (!newProgress[verbLevel].uniqueVerbs.includes(currentVerb.infinitive)) {
                     newProgress[verbLevel].uniqueVerbs.push(currentVerb.infinitive);
                }
                checkLevelUp(verbLevel);
                return {...prev, levelProgress: newProgress };
            });

            setTimeout(() => {
                setFeedback('');
                setShowHint(false);
                const nextPronounIndex = (currentPronoun + 1) % pronouns.length;
                setCurrentPronoun(nextPronounIndex);
                setUserAnswer('');
            }, 1500);
        } else {
            setFeedback(`Неверно. Правильный ответ: ${correctAnswer}`);
            const verbLevel = currentVerb.level;
            setAppState(prev => {
                const newProgress = { ...prev.levelProgress };
                newProgress[verbLevel].total += 1;
                if (!newProgress[verbLevel].uniqueVerbs.includes(currentVerb.infinitive)) {
                     newProgress[verbLevel].uniqueVerbs.push(currentVerb.infinitive);
                }
                checkLevelUp(verbLevel);
                return {...prev, levelProgress: newProgress };
            });
        }
    };

    const handleHint = () => {
        setShowHint(true);
        setHintUsed(true); 
    };

    const resetVerbState = () => {
        setUserAnswer('');
        setFeedback('');
        setCurrentPronoun(0);
        setHintUsed(false);
        setShowHint(false);
    };
    
    const selectVerb = (verb) => {
        const verbIndex = allVerbs.findIndex(v => v.infinitive === verb.infinitive);
        if (verbIndex !== -1) {
            setAppState(prev => ({...prev, lastVerbIndex: verbIndex}));
            setPracticeMode(false); 
            resetVerbState();
            setShowVerbList(false);
        }
    };
    
    const resetAllProgress = () => {
        localStorage.removeItem('germanVerbsState');
        window.location.reload();
    };
    
    const changeVerb = (direction) => {
        const currentIndexInAvailable = availableVerbsForProgression.findIndex(v => v.infinitive === currentVerb.infinitive);
        let nextIndexInAvailable;

        if (direction === 1) {
             nextIndexInAvailable = (currentIndexInAvailable + 1) % availableVerbsForProgression.length;
        } else {
             nextIndexInAvailable = (currentIndexInAvailable - 1 + availableVerbsForProgression.length) % availableVerbsForProgression.length;
        }

        const nextVerbInfinitive = availableVerbsForProgression[nextIndexInAvailable].infinitive;
        const newMasterIndex = allVerbs.findIndex(v => v.infinitive === nextVerbInfinitive);

        setAppState(prev => ({...prev, lastVerbIndex: newMasterIndex}));
        resetVerbState();
        if (autoPlay) { setTimeout(() => speak(allVerbs[newMasterIndex].infinitive), 100); }
    };
    
    const handleKeyPress = (e) => { if (e.key === 'Enter' && userAnswer.trim()) checkAnswer(); };

    // --- RENDER ---
    if (!audioReady) { 
        return (
            <div className="start-screen">
                <div className="start-box"><h1>Тренажер немецких глаголов</h1><p>Нажмите, чтобы начать и активировать звук.</p><button onClick={() => setAudioReady(true)}>Начать</button></div>
            </div>
        );
     }

    return (
        <>
            <LevelUpToast message={levelUpMessage} onDismiss={() => setLevelUpMessage('')} />
            <GeminiInfoModal key={currentVerb.infinitive} show={showGeminiModal} onClose={() => setShowGeminiModal(false)} verb={currentVerb} onFetch={fetchGeminiInfo} speak={speak} isSpeaking={isSpeaking} />
            <VerbListModal show={showVerbList} onClose={() => setShowVerbList(false)} onSelectVerb={selectVerb} verbs={allVerbs} masteredVerbs={appState.masteredVerbs} />
            <SettingsModal show={showSettings} onClose={() => setShowSettings(false)} autoPlay={autoPlay} setAutoPlay={setAutoPlay} onResetProgress={resetAllProgress} />
            
            <div className="app-container">
                <div className="main-card">
                    <div className="main-card-header">
                        <header className="app-header">
                            <div className={`level-badge level-${currentLevel.toLowerCase()}`}>{currentLevel}</div>
                            <div className="mode-toggle">
                                <div className="toggle-group">
                                    <button onClick={() => setPracticeMode(false)} className={!practiceMode ? 'active' : ''}>Изучение</button>
                                    <button onClick={() => setPracticeMode(true)} className={practiceMode ? 'active' : ''}>Практика</button>
                                </div>
                            </div>
                            <div className="header-icons">
                                <button onClick={() => setShowVerbList(true)} title="Список глаголов" className="header-icon-btn"><List /></button>
                                <button onClick={() => setShowSettings(true)} title="Настройки" className="header-icon-btn"><Settings /></button>
                            </div>
                        </header>
                        
                        <div className="verb-navigation">
                            <button onClick={() => changeVerb(-1)} className="nav-btn"><ChevronLeft /></button>
                            <div className="verb-display">
                                <h2>{currentVerb.infinitive}</h2>
                                <p>{currentVerb.russian}</p>
                            </div>
                            <button onClick={() => changeVerb(1)} className="nav-btn"><ChevronRight /></button>
                        </div>
                    </div>
                    
                    <div className="main-card-body">
                        {practiceMode ? (
                            <div className="practice-box">
                                <div className="practice-prompt"><p>Как спрягается <strong>{currentVerb.infinitive}</strong> с местоимением <strong>{pronouns[currentPronoun].german}</strong>?</p></div>
                                <div className="practice-input-group">
                                    <span>{pronouns[currentPronoun].german}</span>
                                    <input type="text" value={userAnswer} onChange={(e) => setUserAnswer(e.target.value)} onKeyPress={handleKeyPress} placeholder="Форма глагола" autoFocus />
                                    <button onClick={checkAnswer} disabled={!userAnswer.trim()}><Check /></button>
                                </div>
                                {feedback && (<div className={`feedback-box ${feedback.includes('Правильно') ? 'correct' : 'incorrect'}`}>{feedback}</div>)}
                                <div className="hint-container">
                                    {showHint ? (
                                        <div className="hint-box">
                                            {pronouns[currentPronoun].german} {currentVerb.forms[currentPronoun]}
                                        </div>
                                    ) : (
                                        <button className="hint-btn" onClick={handleHint} title="Показать подсказку">
                                            <Lightbulb size={20} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="table-container">
                                <table>
                                    <tbody>
                                        {pronouns.map((pronoun, index) => (
                                            <tr key={index}>
                                                <td className="speak-cell"><button onClick={() => speakFullPhrase(index)} disabled={isSpeaking}><Volume2 /></button></td>
                                                <td className="pronoun-cell"><span>{pronoun.german}</span><span className="pronoun-russian">({pronoun.russian})</span></td>
                                                <td className="verb-form-cell"><div><span>{currentVerb.forms[index]}</span></div></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="fab-container">
                <button onClick={() => speak(currentVerb.infinitive)} disabled={isSpeaking} className="fab-button speak-fab"><Volume2 /></button>
                <button onClick={() => setShowGeminiModal(true)} title="Узнать больше" className="fab-button gemini-fab"><Sparkles /></button>
            </div>
            
            <style>{`
                /* --- General Setup & Variables --- */
                :root {
                    --blue-50: #eff6ff; --blue-100: #dbeafe; --blue-600: #2563eb; --blue-700: #1d4ed8;
                    --green-50: #f0fdf4; --green-100: #dcfce7; --green-500: #22c55e; --green-600: #16a34a; --green-800: #166534;
                    --gray-100: #f3f4f6; --gray-200: #e5e7eb; --gray-400: #9ca3af; --gray-500: #6b7280; --gray-800: #1f2937;
                    --indigo-100: #e0e7ff; --yellow-100: #fef9c3; --red-100: #fee2e2; --red-500: #ef4444; --red-700: #b91c1c;
                    --purple-500: #a855f7; --white: #ffffff; --black-t60: rgba(0, 0, 0, 0.6);
                    --orange-400: #fb923c; --amber-400: #facc15; --lime-400: #a3e63e; --cyan-400: #22d3ee;
                    --gold-100: #FEF3C7; --gold-600: #D97706;
                    --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
                }

                body {
                    margin: 0;
                    font-family: var(--font-sans);
                    -webkit-font-smoothing: antialiased;
                    -moz-osx-font-smoothing: grayscale;
                    background-color: var(--blue-50);
                }

                button {
                    font-family: inherit;
                    cursor: pointer;
                    border: none;
                    background-color: transparent;
                    padding: 0;
                    transition: all 0.2s ease-in-out;
                }
                button:disabled { cursor: not-allowed; opacity: 0.5; }

                /* --- Start Screen --- */
                .start-screen {
                    position: fixed; inset: 0; display: flex; align-items: center; justify-content: center;
                    background: linear-gradient(to bottom right, var(--blue-100), var(--indigo-100));
                }
                .start-box {
                    text-align: center; padding: 2rem; background-color: rgba(255, 255, 255, 0.8);
                    backdrop-filter: blur(4px); border-radius: 1rem; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
                    max-width: 400px; margin: 1rem;
                }
                .start-box h1 { font-size: 2rem; color: var(--gray-800); margin-bottom: 1rem; }
                .start-box p { color: var(--gray-500); margin-bottom: 2rem; }
                .start-box button {
                    padding: 0.75rem 2rem; background-color: var(--blue-600); color: var(--white);
                    border-radius: 0.75rem; font-size: 1.125rem; font-weight: 600;
                    box-shadow: 0 4px 14px rgba(37, 99, 235, 0.4);
                }
                .start-box button:hover { background-color: var(--blue-700); transform: scale(1.05); }

                /* --- Main App Layout --- */
                .app-container { max-width: 896px; margin: 0 auto; min-height: 100vh; }
                .main-card {
                    background-color: var(--white);
                    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
                    padding: 1rem;
                    display: flex;
                    flex-direction: column;
                    height: 100vh; /* Fallback for older browsers */
                    height: 100dvh; /* Dynamic viewport height */
                    box-sizing: border-box;
                }
                @media (min-width: 640px) {
                    .app-container { padding: 1rem; }
                    .main-card { 
                        border-radius: 0.75rem; 
                        padding: 1.5rem; 
                        height: calc(100vh - 2rem);
                        height: calc(100dvh - 2rem);
                    }
                }

                .main-card-header {
                    flex-shrink: 0;
                }

                .main-card-body {
                    flex-grow: 1;
                    overflow-y: auto;
                    scrollbar-width: thin;
                    scrollbar-color: var(--gray-200) transparent;
                }
                .main-card-body::-webkit-scrollbar { width: 6px; }
                .main-card-body::-webkit-scrollbar-track { background: transparent; }
                .main-card-body::-webkit-scrollbar-thumb { background-color: var(--gray-200); border-radius: 10px; }

                /* --- New Header --- */
                .app-header {
                    display: flex; 
                    justify-content: space-between; 
                    align-items: center;
                    flex-wrap: wrap; 
                    gap: 1rem; 
                    margin-bottom: 1.5rem; 
                    padding: 0 0.5rem;
                }
                .level-badge {
                    width: 44px; height: 44px; border-radius: 50%;
                    display: flex; align-items: center; justify-content: center;
                    font-weight: 700; color: var(--white); font-size: 1rem;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
                    flex-shrink: 0;
                }
                .level-badge.level-a1 { background-color: var(--orange-400); }
                .level-badge.level-a2 { background-color: var(--amber-400); }
                .level-badge.level-b1 { background-color: var(--lime-400); }
                .level-badge.level-b2 { background-color: var(--cyan-400); }

                .mode-toggle { flex-grow: 1; display: flex; justify-content: center; }
                .toggle-group { background-color: var(--gray-100); padding: 0.25rem; border-radius: 0.5rem; display: inline-flex; }
                .toggle-group button { padding: 0.5rem 1rem; border-radius: 0.375rem; font-size: 0.875rem; font-weight: 500; }
                .toggle-group button.active { color: var(--white); box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
                .toggle-group button:nth-child(1).active { background-color: var(--blue-600); }
                .toggle-group button:nth-child(2).active { background-color: var(--green-600); }

                .header-icons { display: flex; align-items: center; gap: 0.25rem; }
                .header-icon-btn { padding: 0.5rem; color: var(--gray-500); }
                .header-icon-btn:hover { color: var(--gray-800); }

                @media (max-width: 480px) {
                    .app-header { justify-content: space-between; }
                    .mode-toggle { order: 3; width: 100%; margin-top: 0.5rem; }
                }

                /* --- Verb Navigation & Actions --- */
                .verb-navigation {
                    display: flex; 
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 1.5rem;
                    text-align: center;
                }
                .nav-btn { padding: 0.75rem; background-color: var(--gray-200); border-radius: 9999px; }
                .nav-btn:hover { background-color: #d1d5db; }
                .verb-display { flex: 1; margin: 0 1rem; }
                .verb-display h2 { font-size: 2.25rem; font-weight: 700; color: var(--gray-800); margin: 0; flex-shrink: 1; min-width: 0; }
                .verb-display p { margin: 0.25rem 0 0.5rem; color: var(--gray-500); }

                /* --- Table (Study Mode) --- */
                .table-container { background-color: var(--blue-50); border-radius: 0.5rem; overflow: hidden; }
                table { width: 100%; border-collapse: collapse; }
                td { border: 1px solid var(--gray-200); padding: 0.75rem; }
                .speak-cell { text-align: center; width: 48px; }
                .speak-cell button { padding: 0.25rem; color: var(--gray-500); }
                .pronoun-cell { font-weight: 500; }
                .pronoun-russian { font-size: 0.875rem; color: var(--gray-500); margin-left: 0.5rem; }
                @media (max-width: 640px) { .pronoun-russian { display: none; } }
                .verb-form-cell { font-weight: 700; color: var(--blue-600); }
                .verb-form-cell div { display: flex; align-items: center; gap: 0.5rem; }

                /* --- Practice Box --- */
                .practice-box { background-color: var(--green-50); border-radius: 0.5rem; padding: 1.5rem; }
                .practice-prompt { text-align: center; margin-bottom: 1.5rem; }
                .practice-input-group { display: flex; justify-content: center; align-items: center; gap: 1rem; flex-wrap: wrap; }
                .practice-input-group span { font-size: 1.5rem; font-weight: 600; color: var(--gray-800); }
                .practice-input-group input {
                    font-size: 1.125rem; font-weight: 500; color: var(--gray-800); background-color: transparent;
                    border: none; border-bottom: 2px solid var(--gray-200); border-radius: 0;
                    width: 150px; padding: 0.5rem 0.25rem; text-align: center; transition: border-color 0.3s ease;
                }
                .practice-input-group input:focus { outline: none; border-bottom-color: var(--green-500); }
                .practice-input-group button {
                    width: 44px; height: 44px; background-color: var(--green-500); color: var(--white);
                    border-radius: 50%; display: flex; align-items: center; justify-content: center;
                }
                .practice-input-group button:hover { background-color: var(--green-600); }
                .practice-input-group button:disabled { background-color: var(--gray-200); }
                .feedback-box { text-align: center; padding: 0.75rem; margin-top: 1.5rem; border-radius: 0.5rem; }
                .feedback-box.correct { background-color: var(--green-100); color: var(--green-800); }
                .feedback-box.incorrect { background-color: var(--red-100); color: var(--red-700); }
                .hint-container { text-align: center; margin-top: 1.5rem; min-height: 42px; display: flex; align-items: center; justify-content: center; }
                .hint-btn { color: var(--gray-400); padding: 0.5rem; border-radius: 50%; }
                .hint-btn:hover { color: var(--amber-400); background-color: #fffbeb; }
                .hint-box { padding: 0.75rem 1rem; background-color: var(--yellow-100); border-radius: 0.5rem; display: inline-block; font-weight: 500; }

                /* --- Floating Action Buttons (FAB) --- */
                .fab-container { position: fixed; bottom: 1.5rem; right: 1.5rem; z-index: 40; display: flex; flex-direction: column; gap: 1rem; }
                .fab-button {
                    width: 56px; height: 56px; border-radius: 50%; display: flex; align-items: center;
                    justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.15); color: var(--white);
                }
                .fab-button.speak-fab { background-color: var(--blue-600); }
                .fab-button.gemini-fab { background-color: var(--purple-500); }
                .fab-button:hover { transform: scale(1.05); filter: brightness(1.1); }

                /* --- Modals & Toasts --- */
                .modal-overlay {
                    position: fixed; inset: 0; background-color: var(--black-t60);
                    display: flex; align-items: center; justify-content: center;
                    z-index: 50; padding: 0.5rem; animation: fadeIn 0.3s ease;
                }
                .modal-content {
                    background-color: var(--white); border-radius: 0.75rem; max-width: 512px; width: 100%;
                    position: relative; display: flex; flex-direction: column; max-height: 90vh;
                    box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04);
                    animation: scaleIn 0.3s ease;
                }
                .modal-close-btn {
                    position: absolute; top: 0.5rem; right: 0.5rem; padding: 0.5rem;
                    color: var(--gray-500); z-index: 10;
                }
                .modal-close-btn:hover { color: var(--gray-800); background-color: var(--gray-100); border-radius: 50%;}
                .modal-title { font-size: 1.5rem; font-weight: 700; padding: 0; display: flex; align-items: center; gap: 0.5rem; text-transform: capitalize; }
                .verb-info-subtitle { font-size: 0.8rem; color: var(--gray-500); margin: 0.1rem 0 0; padding-left: 2rem; }
                .icon-purple { color: var(--purple-500); }
                .modal-body-container { flex-grow: 1; padding: 0.5rem 1rem; overflow-y: auto; padding-bottom: 5rem; }
                .loader-container { display: flex; flex-direction: column; align-items: center; gap: 1rem; color: var(--gray-500); padding: 2rem; }
                .loader { width: 3rem; height: 3rem; color: var(--blue-600); animation: spin 1s linear infinite; }
                .loader-small { width: 1rem; height: 1rem; color: var(--white); animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .gemini-modal-header { display: flex; justify-content: space-between; align-items: flex-start; padding: 1rem 1rem 0.5rem 1rem; flex-shrink: 0; }
                .modal-footer {
                    padding: 1rem;
                    background-color: var(--white);
                    border-top: 1px solid var(--gray-200);
                    flex-shrink: 0;
                    position: absolute;
                    bottom: 0;
                    width: 100%;
                    box-sizing: border-box;
                    border-radius: 0 0 0.75rem 0.75rem;
                }
                .regenerate-btn-footer {
                    width: 100%;
                    padding: 0.75rem;
                    border-radius: 0.5rem;
                    background-color: var(--blue-600);
                    color: var(--white);
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                }
                .regenerate-btn-footer:hover { background-color: var(--blue-700); }
                .regenerate-btn-footer:disabled { background-color: var(--gray-400); }
                
                /* --- Settings/Info Modal --- */
                .settings-tabs { display: flex; border-bottom: 1px solid var(--gray-200); padding: 1rem 1.5rem 0 1.5rem; }
                .settings-tabs button {
                    padding: 0.5rem 1rem; border-bottom: 2px solid transparent;
                    display: flex; align-items: center; gap: 0.5rem;
                    margin-bottom: -1px; color: var(--gray-500);
                }
                .settings-tabs button.active { border-bottom-color: var(--blue-600); color: var(--blue-600); }
                .info-tab { font-size: 0.95rem; line-height: 1.6; }
                .info-tab h4, .info-tab h5 { margin-top: 1.5rem; margin-bottom: 0.5rem; }
                .info-tab ul { padding-left: 1.5rem; }
                .info-tab li { margin-bottom: 0.5rem; }
                .info-tab table { width: 100%; margin-top: 1rem; border-collapse: collapse; }
                .info-tab td { padding: 0.5rem; border: 1px solid var(--gray-200); }
                .info-tab td:first-child { font-weight: 600; }

                /* --- Verb List Modal --- */
                .verb-list-modal .modal-body-container { padding: 0; }
                .verb-list-header { padding: 1rem 1rem 0.75rem 1rem; border-bottom: 1px solid var(--gray-200); }
                .verb-list-header .modal-title { padding: 0 0 0.75rem 0; text-transform: none; }
                .search-bar { position: relative; }
                .search-bar svg { position: absolute; left: 0.75rem; top: 50%; transform: translateY(-50%); color: var(--gray-400); }
                .search-bar input {
                    width: 100%; box-sizing: border-box; padding: 0.6rem 1rem 0.6rem 2.5rem;
                    border: 1px solid var(--gray-200); border-radius: 0.5rem; font-size: 1rem;
                }
                .search-bar input:focus { outline: none; border-color: var(--blue-600); box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2); }
                .verb-list-modal .modal-body-container { padding: 0.5rem; }
                .level-header {
                    font-size: 0.875rem; font-weight: 600; color: var(--gray-500);
                    padding: 0.75rem 0.5rem 0.25rem; position: sticky; top: 0;
                    background-color: var(--white);
                }
                .verb-list { list-style: none; padding: 0; margin: 0; }
                .verb-list li { display: flex; justify-content: space-between; align-items: center; padding: 0.6rem 0.5rem; border-radius: 0.375rem; cursor: pointer; }
                .verb-list li:hover { background-color: var(--blue-50); }
                .verb-translation { color: var(--gray-500); font-size: 0.875rem; margin-left: 0.5rem; }
                .check-mark { color: var(--green-500); }
                .no-results { text-align: center; padding: 2rem; color: var(--gray-500); }
                .error-box { background-color: var(--red-100); color: var(--red-700); padding: 1rem; border-radius: 0.5rem; text-align: center;}

                /* Reset Progress */
                .reset-section { margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid var(--gray-200); }
                .reset-section h4 { font-weight: 600; color: var(--red-700); }
                .reset-section p { font-size: 0.875rem; color: var(--gray-500); }
                .reset-btn-initial, .reset-btn-confirm { width: 100%; padding: 0.75rem; border-radius: 0.5rem; color: var(--white); font-weight: 600; margin-top: 0.5rem; }
                .reset-btn-initial { background-color: var(--red-500); }
                .reset-btn-initial:hover { background-color: var(--red-700); }
                .reset-confirm { border: 1px solid var(--red-100); background-color: #fff5f5; padding: 1rem; border-radius: 0.5rem; margin-top: 1rem; text-align: center; }
                .reset-confirm p { color: var(--red-700); font-weight: 600; margin: 0 0 1rem 0; }
                .reset-confirm button { padding: 0.5rem 1rem; border-radius: 0.375rem; font-weight: 500; }
                .reset-btn-cancel { background-color: var(--gray-200); }
                .reset-btn-cancel:hover { background-color: #d1d5db; }
                .reset-btn-confirm { background-color: var(--red-500); color: var(--white); margin-left: 0.5rem; display: inline-flex; align-items: center; gap: 0.5rem; }
                .reset-btn-confirm:hover { background-color: var(--red-700); }

                .level-up-toast {
                    position: fixed; top: 1.25rem; right: 1.25rem; background-color: var(--green-500); color: var(--white);
                    padding: 1rem; border-radius: 0.5rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                    z-index: 100; display: flex; align-items: center; gap: 0.75rem;
                    animation: bounce-in 0.5s ease-out;
                }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes scaleIn { from { transform: scale(0.95); } to { transform: scale(1); } }
                @keyframes bounce-in { 0% { opacity: 0; transform: scale(0.5) translateY(-50px); } 100% { opacity: 1; transform: scale(1) translateY(0); } }

                /* --- Стили для аккордеона в модальном окне --- */
                .accordion-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.25rem; }
                .accordion-item { background-color: var(--blue-50); border-radius: 0.5rem; overflow: hidden; border: 1px solid var(--gray-200); }
                .accordion-header { display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0.75rem; cursor: pointer; user-select: none; }
                .accordion-header:hover { background-color: var(--blue-100); }
                .accordion-title .example-german { font-weight: 500; color: var(--gray-800); margin: 0; font-size: 0.9rem; }
                .pronoun-tag { background-color: var(--blue-100); color: var(--blue-700); padding: 0.1rem 0.4rem; border-radius: 0.25rem; font-size: 0.8rem; margin-right: 0.5rem; }
                .accordion-title .example-russian { font-size: 0.8rem; font-style: italic; color: var(--gray-500); margin: 0.1rem 0 0; }
                .accordion-controls { display: flex; align-items: center; gap: 0.25rem; }
                .speak-btn-small { padding: 0.25rem; color: var(--gray-500); border-radius: 50%; }
                .speak-btn-small:hover { background-color: rgba(0,0,0,0.05); }
                .accordion-icon { transition: transform 0.3s ease-in-out; color: var(--gray-500); }
                .accordion-icon.active { transform: rotate(180deg); }
                .accordion-content { max-height: 0; overflow: hidden; transition: max-height 0.4s ease-in-out, padding 0.4s ease-in-out; padding: 0 0.5rem; }
                .accordion-content.active { max-height: 500px; padding: 0.5rem; }
                .example-german b { color: var(--blue-600); font-weight: 700; }

                /* --- Стили для компактной таблицы --- */
                .conjugation-table-wrapper { 
                    background-color: var(--white); 
                    border-radius: 0.375rem; 
                    margin-top: 0.25rem; 
                    border: 1px solid var(--gray-200); 
                    overflow-x: auto; 
                }
                .conjugation-table-wrapper::-webkit-scrollbar { height: 4px; }
                .conjugation-table-wrapper::-webkit-scrollbar-track { background: var(--gray-100); }
                .conjugation-table-wrapper::-webkit-scrollbar-thumb { background: var(--blue-100); border-radius: 4px; }
                .conjugation-table-wrapper::-webkit-scrollbar-thumb:hover { background: var(--blue-600); }

                .conjugation-table { width: 100%; border-collapse: collapse; font-size: 0.8rem; white-space: nowrap; }
                .conjugation-table th, .conjugation-table td { border: 1px solid var(--gray-200); padding: 0.4rem 0.6rem; text-align: left; vertical-align: middle; }
                .conjugation-table th { background-color: var(--gray-100); font-weight: 600; text-align: center; }
                .conjugation-table td:first-child { font-weight: 500; color: var(--gray-600); }
                .conjugation-table td b { color: var(--blue-600); font-weight: 700; }
                .table-cell-content { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; }
                .speak-btn-tiny { color: var(--gray-400); padding: 0.1rem; border-radius: 50%; flex-shrink: 0; }
                .speak-btn-tiny:hover { color: var(--gray-800); background-color: var(--gray-100); }
            `}</style>
        </>
    );
}

export default GermanVerbsApp;

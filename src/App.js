import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Check, X, Volume2, Settings, Sparkles, LoaderCircle, Unlock, HelpCircle, Lightbulb, List, Search, AlertTriangle, RefreshCw } from 'lucide-react';
import { allVerbs } from './verbsData.js';

// --- DATA ---
const pronouns = [
    { german: 'ich', russian: 'я' }, { german: 'du', russian: 'ты' },
    { german: 'er', russian: 'он' }, { german: 'sie', russian: 'она' }, { german: 'es', russian: 'оно' },
    { german: 'wir', russian: 'мы' }, { german: 'ihr', russian: 'вы' },
    { german: 'sie', russian: 'они' }, { german: 'Sie', russian: 'Вы (вежл.)' }
];

const LEVEL_ORDER = ['A1', 'A2', 'B1', 'B2'];
const LEVEL_UP_REQUIREMENTS = { correctAnswers: 25, accuracy: 0.8 };
const REPETITION_INTERVAL = 5;

// --- HELPER COMPONENTS ---

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

const GeminiInfoModal = ({ show, onClose, verb, onFetch, speak, isSpeaking }) => {
    const [geminiInfo, setGeminiInfo] = useState({ loading: false, data: null, error: null });
    
    const handleFetch = useCallback((force = false) => {
        onFetch(verb, setGeminiInfo, force);
    }, [verb, onFetch]);

    useEffect(() => {
        if (show) {
            handleFetch(false); // Fetch from cache first
        }
    }, [show, handleFetch]);

    if (!show) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="modal-close-btn"><X /></button>
                <div className="gemini-modal-header">
                    <h3 className="modal-title"><Sparkles className="icon-purple" />{verb.infinitive}</h3>
                    <button className="regenerate-btn" onClick={() => handleFetch(true)} disabled={geminiInfo.loading} title="Сгенерировать новые примеры">
                        <RefreshCw size={18} className={geminiInfo.loading ? 'animate-spin' : ''} />
                    </button>
                </div>
                <div className="modal-body-container">
                    {geminiInfo.loading && <div className="loader-container"><LoaderCircle className="loader" /><p>Gemini генерирует информацию...</p></div>}
                    {geminiInfo.error && <div className="error-box">{geminiInfo.error}</div>}
                    {geminiInfo.data && geminiInfo.data.examples && Array.isArray(geminiInfo.data.examples) && (
                        <div className="gemini-data">
                            <div><h4>Примеры спряжения:</h4>
                                <ul>{geminiInfo.data.examples.map((ex, i) => 
                                    (ex && ex.pronoun && ex.german && ex.russian) ? (
                                    <li key={i} className="example-item pronoun-example">
                                        <div className="example-german">
                                            <p><strong className="pronoun-tag">{ex.pronoun}</strong> {ex.german}</p>
                                            <button onClick={() => speak(`${ex.pronoun} ${ex.german}`)} disabled={isSpeaking}><Volume2 /></button>
                                        </div>
                                        <p className="example-russian">{ex.russian}</p>
                                    </li>
                                    ) : null
                                )}</ul>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};


const LevelUpToast = ({ message, onDismiss }) => {
    if (!message) return null;
    return <div className="level-up-toast"><Unlock /><span>{message}</span><button onClick={onDismiss}>&times;</button></div>;
};

// --- MAIN APP COMPONENT ---
const GermanVerbsApp = () => {
    // --- STATE ---
    const [appState, setAppState] = useState(() => {
        try {
            const savedState = localStorage.getItem('germanVerbsState');
            const initialState = {
                unlockedLevels: ['A1'],
                levelProgress: LEVEL_ORDER.reduce((acc, level) => ({ ...acc, [level]: { correct: 0, total: 0, uniqueVerbs: [] } }), {}),
                masteredVerbs: [],
                lastVerbIndex: 0,
                sequenceCounter: 0,
            };
            return savedState ? { ...initialState, ...JSON.parse(savedState) } : initialState;
        } catch (error) {
            console.error("Failed to parse state from localStorage", error);
            return { unlockedLevels: ['A1'], levelProgress: {}, masteredVerbs: [], lastVerbIndex: 0, sequenceCounter: 0 };
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
    const [currentVerbMastery, setCurrentVerbMastery] = useState(new Set());
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
        const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
        if (!apiKey) {
            setter({ loading: false, data: null, error: "API ключ не настроен." });
            return;
        }
        const prompt = `Для немецкого глагола '${verb.infinitive}' (${verb.russian}), создай JSON объект. Этот объект должен содержать ключ "examples", значением которого является массив примеров предложений. Создай по одному примеру для каждого местоимения: ich, du, er, sie, es, wir, ihr, sie, Sie. Каждый элемент в массиве "examples" должен быть объектом с полями "pronoun", "german" (только часть предложения без местоимения) и "russian" (полный перевод предложения).`;
        const payload = { contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json" } };
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
        try {
            const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            if (!response.ok) throw new Error(`API Error: ${response.status}`);
            const result = await response.json();
            const parsedJson = JSON.parse(result.candidates[0].content.parts[0].text);
            setGeminiDataCache(prev => ({...prev, [verb.infinitive]: parsedJson}));
            setter({ loading: false, data: parsedJson, error: null });
        } catch (error) {
            setter({ loading: false, data: null, error: "Не удалось получить данные от Gemini." });
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
            
            const newMasterySet = new Set(currentVerbMastery).add(currentPronoun);
            setCurrentVerbMastery(newMasterySet);

            if (newMasterySet.size === pronouns.length && !hintUsed) {
                if (!appState.masteredVerbs.includes(currentVerb.infinitive)) {
                    setAppState(prev => ({...prev, masteredVerbs: [...prev.masteredVerbs, currentVerb.infinitive]}));
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
        setCurrentVerbMastery(new Set()); 
    };

    const resetVerbState = () => {
        setUserAnswer('');
        setFeedback('');
        setCurrentPronoun(0);
        setCurrentVerbMastery(new Set());
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

        if (direction === 1) { // next
             nextIndexInAvailable = (currentIndexInAvailable + 1) % availableVerbsForProgression.length;
        } else { // prev
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
            <GeminiInfoModal show={showGeminiModal} onClose={() => setShowGeminiModal(false)} verb={currentVerb} onFetch={fetchGeminiInfo} speak={speak} isSpeaking={isSpeaking} />
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
        </>
    );
};

export default GermanVerbsApp;

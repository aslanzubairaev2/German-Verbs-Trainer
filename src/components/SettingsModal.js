import React, { useState } from "react";
import { X, Settings, HelpCircle, Volume2, AlertTriangle } from "lucide-react";

const SettingsModal = ({
  show,
  onClose,
  autoPlay,
  setAutoPlay,
  onResetProgress,
}) => {
  const [activeTab, setActiveTab] = useState("settings");
  const [confirmReset, setConfirmReset] = useState(false);

  const handleReset = () => {
    onResetProgress();
    onClose();
  };

  if (!show) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="modal-close-btn">
          <X />
        </button>
        <div className="settings-tabs">
          <button
            className={activeTab === "settings" ? "active" : ""}
            onClick={() => setActiveTab("settings")}
          >
            <Settings /> Настройки
          </button>
          <button
            className={activeTab === "info" ? "active" : ""}
            onClick={() => setActiveTab("info")}
          >
            <HelpCircle /> Справка
          </button>
        </div>
        <div className="modal-body-container">
          {activeTab === "settings" && (
            <>
              <div className="settings-row">
                <span>Автоозвучивание</span>
                <button
                  onClick={() => setAutoPlay(!autoPlay)}
                  className={`toggle-btn ${autoPlay ? "on" : "off"}`}
                >
                  {autoPlay ? <Volume2 /> : <X />}
                  <span>{autoPlay ? "Вкл" : "Выкл"}</span>
                </button>
              </div>
              <div className="reset-section">
                <h4>Сброс прогресса</h4>
                <p>
                  Это действие удалит все данные о пройденных глаголах и
                  открытых уровнях.
                </p>
                {!confirmReset ? (
                  <button
                    className="reset-btn-initial"
                    onClick={() => setConfirmReset(true)}
                  >
                    Сбросить весь прогресс
                  </button>
                ) : (
                  <div className="reset-confirm">
                    <p>Вы уверены?</p>
                    <button
                      className="reset-btn-cancel"
                      onClick={() => setConfirmReset(false)}
                    >
                      Отмена
                    </button>
                    <button className="reset-btn-confirm" onClick={handleReset}>
                      <AlertTriangle size={16} /> Да, сбросить
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
          {activeTab === "info" && (
            <div className="info-tab">
              <h4>Основы спряжения глаголов</h4>
              <p>
                В немецком, как и в русском, глаголы меняют свою форму в
                зависимости от того, кто выполняет действие (лицо) и когда
                (время). Этот процесс называется <strong>спряжением</strong>.
              </p>
              <h5>Типы глаголов:</h5>
              <ul>
                <li>
                  <strong>Слабые (правильные):</strong> Самая простая группа.
                  Они спрягаются по четким правилам, добавляя стандартные
                  окончания к основе глагола. Пример:{" "}
                  <em>
                    machen (делать) -&gt; ich mach<strong>e</strong>, du mach
                    <strong>st</strong>
                  </em>
                  .
                </li>
                <li>
                  <strong>Сильные (неправильные):</strong> Эти глаголы "не
                  подчиняются" общим правилам. При спряжении у них часто
                  меняется корневая гласная. Пример:{" "}
                  <em>
                    sprechen (говорить) -&gt; ich spreche, du spr
                    <strong>i</strong>chst
                  </em>
                  . Их формы нужно запоминать.
                </li>
                <li>
                  <strong>Смешанные:</strong> Редкая группа, которая ведет себя
                  как слабые глаголы (берет их окончания), но при этом меняет
                  корневую гласную, как сильные. Пример:{" "}
                  <em>denken (думать) -&gt; ich dachte (в прошлом времени)</em>.
                </li>
              </ul>
              <h5>Стандартные окончания (для слабых глаголов):</h5>
              <table>
                <tbody>
                  <tr>
                    <td>ich (я)</td>
                    <td>-e</td>
                  </tr>
                  <tr>
                    <td>du (ты)</td>
                    <td>-st</td>
                  </tr>
                  <tr>
                    <td>er/sie/es (он/она/оно)</td>
                    <td>-t</td>
                  </tr>
                  <tr>
                    <td>wir (мы)</td>
                    <td>-en</td>
                  </tr>
                  <tr>
                    <td>ihr (вы, мн.ч.)</td>
                    <td>-t</td>
                  </tr>
                  <tr>
                    <td>sie/Sie (они/Вы)</td>
                    <td>-en</td>
                  </tr>
                </tbody>
              </table>
              <p>
                Этот тренажер поможет вам отработать и запомнить формы самых
                важных глаголов.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;

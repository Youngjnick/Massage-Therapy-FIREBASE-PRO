import React from "react";

/**
 * HeaderControls - React version of the topic select, quiz length select, and start button.
 * Props:
 *   topics: array - list of topic names
 *   selectedTopic: string - currently selected topic
 *   onSelectTopic: function - called with new topic
 *   quizLengths: array - list of quiz length options
 *   selectedLength: string - currently selected quiz length
 *   onSelectLength: function - called with new length
 *   onStartQuiz: function - called to start quiz
 */
interface HeaderControlsProps {
  topics: string[];
  selectedTopic: string;
  onSelectTopic: (topic: string) => void;
  quizLengths: (number | string)[];
  selectedLength: string;
  onSelectLength: (len: string) => void;
  onStartQuiz: () => void;
}

const HeaderControls = ({
  topics = [],
  selectedTopic = "",
  onSelectTopic,
  quizLengths = [5, 10, 20, "all"],
  selectedLength = "5",
  onSelectLength,
  onStartQuiz,
}: HeaderControlsProps) => {
  // --- E2E DEBUG: Log topics prop and rendered options ---
  console.debug("[E2E DEBUG] HeaderControls topics prop:", topics);

  return (
    <div
      className="app-header"
      style={{ display: "flex", alignItems: "center", gap: 12 }}
    >
      <div
        className="header-controls"
        style={{ display: "flex", gap: 16, alignItems: "center" }}
      >
        <select
          className="app-btns"
          value={selectedTopic}
          onChange={(e) => onSelectTopic(e.target.value)}
          data-topic
          data-testid="topic-select"
        >
          <option value="">Select Topic</option>
          {topics.map((topic) => (
            <option key={topic} value={topic}>
              {topic}
            </option>
          ))}
        </select>
        <select
          className="app-btns"
          value={selectedLength}
          onChange={(e) => onSelectLength(e.target.value)}
          data-quiz-length
          data-testid="quiz-length-select"
        >
          {quizLengths.map((len) => (
            <option key={len} value={len}>
              {len === "all" ? "All Questions" : `${len} Questions`}
            </option>
          ))}
        </select>
        <button
          className="app-btns"
          onClick={onStartQuiz}
          tabIndex={0}
          data-testid="start-quiz-btn"
        >
          Start Quiz
        </button>
      </div>
    </div>
  );
};

export default React.memo(HeaderControls);

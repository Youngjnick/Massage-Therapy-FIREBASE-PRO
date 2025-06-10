import React from 'react';

interface QuizTopicSelectProps {
  availableTopics: string[];
  selectedTopic: string;
  setSelectedTopic: (topic: string) => void;
}

const QuizTopicSelect: React.FC<QuizTopicSelectProps> = ({ availableTopics, selectedTopic, setSelectedTopic }) => (
  <label>
    Topic:
    <select value={selectedTopic} onChange={e => setSelectedTopic(e.target.value)}>
      {availableTopics.map(topic => (
        <option key={topic} value={topic}>{topic}</option>
      ))}
    </select>
  </label>
);

export default QuizTopicSelect;

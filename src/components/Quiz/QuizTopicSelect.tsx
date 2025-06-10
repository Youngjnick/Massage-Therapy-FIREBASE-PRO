import React from 'react';

interface QuizTopicSelectProps {
  availableTopics: string[];
  selectedTopic: string;
  setSelectedTopic: (topic: string) => void;
}

const QuizTopicSelect = ({ availableTopics = [], selectedTopic = '', setSelectedTopic = () => {} }: QuizTopicSelectProps) => {
  return (
    <select
      data-testid="quiz-topic-select"
      value={selectedTopic}
      onChange={e => setSelectedTopic(e.target.value)}
    >
      {availableTopics.map(topic => (
        <option key={topic} value={topic}>{topic}</option>
      ))}
    </select>
  );
};

export default QuizTopicSelect;

import React from 'react';

interface QuizTopicSelectProps {
  availableTopics: string[];
  selectedTopic: string;
  setSelectedTopic: (topic: string) => void;
  id?: string;
}

const QuizTopicSelect = ({ availableTopics = [], selectedTopic = '', setSelectedTopic = () => {}, id }: QuizTopicSelectProps) => {
  return (
    <select
      data-testid="quiz-topic-select"
      id={id}
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

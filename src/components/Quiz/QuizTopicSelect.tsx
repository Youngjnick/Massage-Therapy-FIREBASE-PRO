import React from 'react';

interface QuizTopicSelectProps {
  availableTopics: string[];
  selectedTopic: string;
  setSelectedTopic: (topic: string) => void;
}

const QuizTopicSelect: React.FC<QuizTopicSelectProps & { id?: string }> = ({ availableTopics, selectedTopic, setSelectedTopic, id }) => (
  <select
    value={selectedTopic}
    onChange={e => setSelectedTopic(e.target.value)}
    id={id}
    data-testid={id}
  >
    {availableTopics.map(topic => (
      <option key={topic} value={topic}>{topic}</option>
    ))}
  </select>
);

export default QuizTopicSelect;

import React from 'react';

interface QuizTopicSelectProps {
  availableTopics: string[];
  selectedTopic: string;
  setSelectedTopic: (topic: string) => void;
}

const prettifyTopic = (topic: string) =>
  topic.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

const QuizTopicSelect: React.FC<QuizTopicSelectProps & { id?: string }> = ({ availableTopics, selectedTopic, setSelectedTopic, id }) => (
  <select
    value={selectedTopic}
    onChange={e => setSelectedTopic(e.target.value)}
    id={id}
    data-testid={id}
  >
    {availableTopics.map(topic => (
      <option key={topic} value={topic}>{prettifyTopic(topic)}</option>
    ))}
  </select>
);

export default QuizTopicSelect;

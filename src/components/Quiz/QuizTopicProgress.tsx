import React, { useState } from 'react';
import Modal from '../Modal';

interface TopicStats {
  [topic: string]: { correct: number; total: number; missed?: number; unanswered?: number };
}

interface QuizTopicProgressProps {
  topicStats: TopicStats;
  onStartMissedUnansweredQuiz?: (topic: string) => void; // NEW PROP
}

const QuizTopicProgress: React.FC<QuizTopicProgressProps> = ({ topicStats, onStartMissedUnansweredQuiz }) => {
  const [modalTopic, setModalTopic] = useState<string | null>(null);

  if (!topicStats || Object.entries(topicStats).length === 0) return null;

  // Placeholder: logic to get missed/unanswered counts for a topic
  const getMissedUnanswered = (topic: string) => {
    const stat = topicStats[topic];
    // You may want to replace this with real missed/unanswered logic
    const missed = stat.total - stat.correct;
    const unanswered = 0; // Placeholder
    return { missed, unanswered };
  };

  return (
    <>
      <div data-testid="quiz-topic-progress" style={{ display: 'flex', gap: 16, marginBottom: 12, flexWrap: 'wrap' }}>
        {Object.entries(topicStats).map(([topic, stat]) => {
          const cleanTopic =
            typeof topic === 'string'
              ? topic.replace(/(topictpoic|tpoic|topic)+/gi, 'topic').replace(/topic+/gi, 'topic').trim()
              : topic;
          return (
            <button
              key={topic}
              style={{
                minWidth: 120,
                background: '#f8fafc',
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                padding: 12,
                cursor: 'pointer',
                outline: 'none',
                boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                transition: 'box-shadow 0.2s',
              }}
              aria-label={`View details and actions for ${cleanTopic}`}
              onClick={() => setModalTopic(topic)}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setModalTopic(topic); }}
            >
              <div style={{ fontWeight: 600 }}>{cleanTopic}</div>
              <div style={{ height: 8, background: '#e5e7eb', borderRadius: 4, margin: '4px 0', position: 'relative' }}>
                <div
                  style={{
                    width: `${stat.total ? (100 * stat.correct) / stat.total : 0}%`,
                    height: '100%',
                    background: '#3b82f6',
                    borderRadius: 4,
                    transition: 'width 0.3s',
                  }}
                />
              </div>
              <div style={{ fontSize: 12 }}>{`${stat.correct} / ${stat.total} correct`}</div>
            </button>
          );
        })}
      </div>
      <Modal isOpen={!!modalTopic} onClose={() => setModalTopic(null)} ariaLabel="Topic Details">
        {modalTopic && (
          <div>
            <h2 style={{ marginTop: 0 }}>{modalTopic}</h2>
            <div style={{ marginBottom: 12 }}>
              <strong>Correct:</strong> {topicStats[modalTopic].correct} / {topicStats[modalTopic].total}
            </div>
            {/* Placeholder for missed/unanswered logic */}
            <div style={{ marginBottom: 12 }}>
              <strong>Missed:</strong> {getMissedUnanswered(modalTopic).missed}
            </div>
            <div style={{ marginBottom: 12 }}>
              <strong>Unanswered:</strong> {getMissedUnanswered(modalTopic).unanswered}
            </div>
            {/* Action button: Start quiz with missed/unanswered questions */}
            {getMissedUnanswered(modalTopic).missed + getMissedUnanswered(modalTopic).unanswered > 0 ? (
              <button
                style={{
                  background: '#3b82f6',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  padding: '10px 20px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  marginTop: 8,
                }}
                aria-label={`Start quiz for ${modalTopic} (missed/unanswered)`}
                onClick={() => {
                  if (onStartMissedUnansweredQuiz) {
                    onStartMissedUnansweredQuiz(modalTopic);
                    setModalTopic(null);
                  }
                }}
              >
                Start Quiz: Missed/Unanswered
              </button>
            ) : (
              <div style={{ color: '#16a34a', marginTop: 8 }}>You’ve answered all questions for this topic!</div>
            )}
            {/* Placeholder for future: review all questions, badges, etc. */}
            <div style={{ marginTop: 24, color: '#888', fontSize: 13 }}>
              (More review and badge features coming soon)
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

export default QuizTopicProgress;

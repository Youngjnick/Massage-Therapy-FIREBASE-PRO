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

  // Prettify topic name (capitalize, replace underscores/dashes, etc.)
  const prettify = (str: string) =>
    str
      .replace(/[_-]/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase())
      .replace(/\s+/g, ' ')
      .trim();

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
                minWidth: 90,
                background: 'rgba(255,255,255,0.7)', // Semi-transparent white
                border: '1.5px solid #d1d5db',
                borderRadius: 7,
                padding: '8px 10px',
                cursor: 'pointer',
                outline: 'none',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                transition: 'box-shadow 0.18s, border 0.18s, background 0.18s',
                fontSize: 15,
                fontWeight: 500,
                color: '#334155',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: 2,
              }}
              aria-label={`View details and actions for ${prettify(cleanTopic)}`}
              onClick={() => setModalTopic(topic)}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setModalTopic(topic); }}
              onFocus={e => e.currentTarget.style.boxShadow = '0 0 0 2px #38bdf8'}
              onBlur={e => e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'}
              onMouseOver={e => e.currentTarget.style.background = 'rgba(241,245,249,0.85)'}
              onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.7)'}
            >
              <span style={{ fontWeight: 600, fontSize: 15 }}>{prettify(cleanTopic)}</span>
              <div style={{ height: 6, background: '#e5e7eb', borderRadius: 3, margin: '2px 0', position: 'relative', width: '100%' }}>
                <div
                  style={{
                    width: `${stat.total ? (100 * stat.correct) / stat.total : 0}%`,
                    height: '100%',
                    background: '#38bdf8',
                    borderRadius: 3,
                    transition: 'width 0.2s',
                  }}
                />
              </div>
              <div style={{ fontSize: 12, color: '#64748b' }}>{`${stat.correct} / ${stat.total}`}</div>
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
                  opacity: 1,
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
              <button
                style={{
                  background: '#94a3b8',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  padding: '10px 20px',
                  fontWeight: 600,
                  cursor: 'not-allowed',
                  marginTop: 8,
                  opacity: 0.6,
                }}
                aria-label={`No missed or unanswered questions for ${modalTopic}`}
                disabled
              >
                Start Quiz: Missed/Unanswered
              </button>
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

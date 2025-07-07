import { Page, Route } from '@playwright/test';

// E2E helper to mock getQuestions in the browser context
export const mockQuestions = [
  {
    id: 'q1',
    topic: 'General',
    question: 'What is the capital of France?',
    options: ['Paris', 'London', 'Berlin', 'Madrid'],
    answer: 0,
    explanation: 'Paris is the capital of France.'
  },
  {
    id: 'q2',
    topic: 'General',
    question: 'What is 2 + 2?',
    options: ['3', '4', '5', '6'],
    answer: 1,
    explanation: '2 + 2 = 4.'
  }
];

export async function injectMockQuestions(page: Page) {
  await page.addInitScript((mockQuestions) => {
    (window as any).getQuestions = () => Promise.resolve(mockQuestions);
    // Set up localStorage to preselect topic and quiz length if needed
    window.localStorage.setItem('quizSelectedTopic', 'General');
    window.localStorage.setItem('quizLength', '2');
  }, mockQuestions);
  await page.route('**/questions', (route: Route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockQuestions)
    });
  });
}

# WIP: Topic Breakdown Modal & Quiz Interactivity (feature/analytics-topic-interactivity)

## Summary
- **Goal:** Enable users to start a quiz with missed/unanswered questions for a topic directly from the analytics topic breakdown modal.
- **UI:** Analytics page shows per-topic stats. Clicking a topic opens a modal with stats and a "Start Quiz: Missed/Unanswered" button.
- **Functionality:**
  - Button triggers a callback (`onStartMissedUnansweredQuiz`) passed from the Quiz page.
  - Callback filters questions for the selected topic to only those missed/unanswered, resets quiz state, and starts a new quiz session.
  - All hooks in `Quiz.tsx` are called unconditionally at the top level (no hook order bugs).
  - Quiz length, navigation, and accessibility logic are robust and tested.
- **Testing:**
  - Spinner and loading state are accessible and testable.
  - Quiz length input clamps and disables Start for invalid values.
  - All topic modal and quiz start flows are covered by e2e and integration tests.
- **Known Issues:**
  - If the modal button appears non-functional, ensure the dev server is restarted and browser cache is cleared. All callback wiring is correct in code.
  - Some edge cases (e.g., no missed questions) may need further UX polish.

## Files Changed
- `src/pages/Quiz.tsx`: Main quiz logic, callback wiring, quiz state management.
- `src/components/Quiz/QuizResultsScreen.tsx`: Accepts and passes `onStartMissedUnansweredQuiz` to topic progress.
- `src/components/Quiz/QuizTopicProgress.tsx`: Modal UI, triggers callback.
- `src/components/common/Spinner.tsx`: Accessible loading spinner.
- `src/components/Quiz/QuizLengthInput.tsx`: Robust quiz length input.

## Next Steps
- Further polish modal UX (e.g., show message if no missed/unanswered questions).
- Add more analytics and review features to the modal.
- Merge to main after final QA.

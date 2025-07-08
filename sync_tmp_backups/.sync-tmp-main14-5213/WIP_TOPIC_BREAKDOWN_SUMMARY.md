# WIP: Analytics Topic Breakdown & Missed/Unanswered Quiz Start

## Feature Branch: `feature/analytics-topic-interactivity`

### Overview
- **Goal:** Enable users to interactively review analytics by topic and start a quiz with missed/unanswered questions for a selected topic.
- **Status:** All core logic and UI for topic breakdown modal and missed/unanswered quiz start are implemented, tested, and committed. Further polish and review features are pending.

---

## Key Features Implemented

### 1. **Analytics Topic Breakdown Modal**
- Clicking a topic in analytics opens a modal with detailed stats for that topic.
- Modal includes a "Start Quiz: Missed/Unanswered" button.
- If no missed/unanswered questions, (TODO: show a message).
- Modal is accessible and keyboard-navigable.

### 2. **Missed/Unanswered Quiz Start Logic**
- Button triggers a quiz filtered to only missed/unanswered questions for the selected topic.
- Quiz logic in `Quiz.tsx` ensures correct question set, shuffling, and state reset.
- All React hooks are called unconditionally (hook order bug fixed).

### 3. **Accessibility & UX**
- All interactive elements are tabbable in logical order.
- Focus management and ARIA attributes for modal and quiz.
- Onboarding tip and skip link for keyboard users.
- Footer navigation for accessibility.

### 4. **Testing & Robustness**
- All test failures fixed (spinner, quiz length input, accessibility, etc.).
- Spinner is accessible and testable.
- Quiz length input is clamped and disables Start for invalid values.
- All changes committed and pushed to remote feature branch.

### 5. **Firebase Emulator/Prod Toggle**
- `toggle-emulator.sh` script for easy switching between local emulator and production Firebase.
- Emulator/debug code is hidden in production.

### 6. **Deployment**
- Firebase Hosting and GitHub Pages deploys are working and tested.
- Production build does not show emulator/debug panels.

---

## Files Changed
- `src/pages/LandingPage.tsx`: UI, animation, onboarding, accessibility.
- `src/firebase/firebaseConfig.ts`: Emulator/production logic.
- `src/App.tsx`: Debug panel logic.
- `firebase.json`, `firestore.rules`: Firebase config.
- `vite.config.ts`, `.env`, `.env.e2e`: Env and base path.
- `src/pages/Analytics.tsx`: Analytics page, topic breakdown.
- `src/components/Quiz/QuizTopicProgress.tsx`: Modal, quiz start callback.
- `src/pages/Quiz.tsx`: Quiz logic, missed/unanswered quiz start, hook order fix.
- `src/components/Quiz/QuizStartForm.tsx`, `QuizQuestionCard.tsx`, `QuizResultsScreen.tsx`, `QuizLengthInput.tsx`, `common/Spinner.tsx`: UI, accessibility, validation.
- `scripts/toggle-emulator.sh`: Toggle script.
- `WIP_TOPIC_BREAKDOWN_SUMMARY.md`: This summary.

---

## Next Steps
- [ ] Polish modal UX (show message if no missed/unanswered questions).
- [ ] Add more analytics/review features to modal.
- [ ] Final QA and merge to main after review.

---

## Deployed Demo
- [GitHub Pages Production](https://youngjnick.github.io/Massage-Therapy-FIREBASE-PRO/)

---

## Commit & Push
- All changes are committed and pushed to `feature/analytics-topic-interactivity`.

---

## Contact
- For questions or review, ping @youngjnick.

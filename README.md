# Massage Therapy Smart Study PRO

## Overview
The Massage Therapy Smart Study PRO is a comprehensive, modular React application designed to enhance the learning experience for massage therapy students. It features a robust quiz system, statistics tracking, bookmarking, error logging, and a dynamic badge/achievements system. The app is built with TypeScript, tested with Jest and React Testing Library, and integrates with Firebase for data persistence.

---

## Main Branch Status (as of June 13, 2025)
- **Codebase:** Clean, modular, and fully TypeScript-typed. All merge conflicts have been resolved.
- **Testing:** All Jest and React Testing Library test suites pass. No parse, ESLint, or TypeScript errors in the main code or tests.
- **Features:**
  - Quiz flow with instant feedback, review mode, and explanations
  - Badge/achievement system with modal details and visual distinction for awarded badges
  - Bookmarks and error logging for user study tracking
  - Statistics dashboard for performance analysis
  - Accessibility and keyboard navigation support
- **Deployment:** Ready for deployment (e.g., GitHub Pages via `gh-pages` branch)
- **Development Workflow:**
  - Feature branches are merged only after passing all tests
  - Code is linted and type-checked before merging
  - README and documentation are kept up to date

---

## Features
- **Questions Management**: Add, retrieve, update, and delete questions related to massage therapy.
- **Statistics Tracking**: Record user interactions and retrieve statistical data to analyze performance.
- **Bookmarks**: Save and retrieve bookmarked items for quick access to important information.
- **Error Logging**: Log errors and feedback to improve the application and user experience.
- **Badges System**: Award badges to users based on their achievements and milestones.

## Project Structure
```
massage-therapy-smart-study-pro
├── src
│   ├── firebase.ts          # Initializes Firebase and Firestore
│   ├── questions            # Manages questions
│   │   └── index.ts
│   ├── stats                # Handles statistics
│   │   └── index.ts
│   ├── bookmarks            # Manages bookmarks
│   │   └── index.ts
│   ├── errors               # Logs errors and feedback
│   │   └── index.ts
│   ├── badges               # Manages badges
│   │   └── index.ts
│   └── types                # TypeScript interfaces and types
│       └── index.ts
├── serviceAccountKey.json   # Firebase service account credentials
├── package.json             # npm configuration file
├── tsconfig.json            # TypeScript configuration file
└── README.md                # Project documentation
```

## Setup Instructions
1. Clone the repository to your local machine.
2. Navigate to the project directory.
3. Install the required dependencies using npm:
   ```
   npm install
   ```
4. Ensure that the `serviceAccountKey.json` file is correctly configured with your Firebase credentials.
5. Run the application using:
   ```
   npm start
   ```

## Usage Guidelines
- Follow the prompts in the application to manage questions, track statistics, and utilize other features.
- For any issues or feedback, use the error logging feature to report problems.

## Contributing
Contributions are welcome! Please submit a pull request or open an issue for any enhancements or bug fixes.

## License
This project is licensed under the MIT License. See the LICENSE file for details.
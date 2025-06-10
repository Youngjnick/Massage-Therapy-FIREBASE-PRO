# Massage Therapy Smart Study PRO

## Overview
The Massage Therapy Smart Study PRO is a comprehensive application designed to enhance the learning experience for massage therapy students. This application allows users to manage questions, track statistics, save bookmarks, log errors, and earn badges based on their achievements.

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
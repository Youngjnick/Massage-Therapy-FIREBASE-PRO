const fs = require('fs');
const path = require('path');

// Dynamically import strip-json-comments for ES module compatibility
(async () => {
  const stripJsonComments = (await import('strip-json-comments')).default;

  // Paths to the skipped questions file and questions folder
  const SKIPPED_QUESTIONS_PATH = path.join(__dirname, '../skipped_questions.json');
  const QUESTIONS_FOLDER_PATH = path.join(__dirname, '../src/data/questions');

  // Read and parse skipped_questions.json with comments handling
  const skippedQuestionsContent = fs.readFileSync(SKIPPED_QUESTIONS_PATH, 'utf-8');

  // Validate and handle JSON parsing
  let cleanedSkippedQuestionsContent;
  try {
    cleanedSkippedQuestionsContent = stripJsonComments(skippedQuestionsContent);
    console.log('Cleaned JSON content:', cleanedSkippedQuestionsContent);
  } catch (error) {
    console.error('Error cleaning JSON comments:', error);
    process.exit(1);
  }

  // Log the cleaned JSON content to identify issues
  console.log('Cleaned JSON content (before parsing):', cleanedSkippedQuestionsContent);

  let skippedQuestions;
  try {
    skippedQuestions = JSON.parse(cleanedSkippedQuestionsContent);
  } catch (error) {
    console.error('Error parsing JSON:', error);
    process.exit(1);
  }

  // Function to generate missing data
  function generateMissingData(question) {
    const options = [
      'Option A',
      'Option B',
      'Option C',
      'Option D'
    ];
    return {
      options,
      correctAnswer: options[0],
      abcd: {
        a: options[0],
        b: options[1],
        c: options[2],
        d: options[3]
      }
    };
  }

  // Process each skipped question
  skippedQuestions.forEach((entry) => {
    const { file, id, question } = entry;

    // Skip if the file or question is invalid
    if (!file || !question) return;

    const filePath = path.join(__dirname, `../${file}`);

    // Read the target file
    let questionsData;
    try {
      questionsData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch (error) {
      console.error(`Failed to read file: ${filePath}`, error);
      return;
    }

    // Find the question by ID
    const targetQuestion = questionsData.find((q) => q.id === id);

    if (targetQuestion) {
      // Check if options, correctAnswer, or abcd are missing or meaningless
      if (!targetQuestion.options || !targetQuestion.correctAnswer || !targetQuestion.abcd) {
        console.log(`Fixing question: ${id}`);

        // Generate missing data
        const missingData = generateMissingData(targetQuestion);

        // Update the question
        targetQuestion.options = missingData.options;
        targetQuestion.correctAnswer = missingData.correctAnswer;
        targetQuestion.abcd = missingData.abcd;
      }
    } else {
      console.warn(`Question ID ${id} not found in file: ${filePath}`);
    }

    // Write the updated data back to the file
    try {
      fs.writeFileSync(filePath, JSON.stringify(questionsData, null, 2), 'utf-8');
      console.log(`Updated file: ${filePath}`);
    } catch (error) {
      console.error(`Failed to write file: ${filePath}`, error);
    }
  });

  console.log('Skipped questions processing complete.');
})();

// verify-quiz-firestore.js
// Usage: node verify-quiz-firestore.js <userUid>

const admin = require('firebase-admin');
const path = require('path');

// Initialize Admin SDK only once
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(
      path.resolve(__dirname, '../serviceAccountKey.json')
    ),
  });
}

async function main() {
  const userUid = process.argv[2];
  if (!userUid) {
    console.error('No userUid provided');
    process.exit(1);
  }
  const db = admin.firestore();
  const docRef = db.collection('users').doc(userUid).collection('quizProgress').doc('current');
  const docSnap = await docRef.get();
  if (!docSnap.exists) {
    console.error('Quiz progress doc does not exist');
    process.exit(2);
  }
  const quizProgress = docSnap.data();
  if (!quizProgress) {
    console.error('Quiz progress doc is empty');
    process.exit(3);
  }
  if (quizProgress.showResults !== true) {
    console.error('showResults is not true');
    process.exit(4);
  }
  if (!Array.isArray(quizProgress.userAnswers)) {
    console.error('userAnswers is not an array');
    process.exit(5);
  }
  // Optionally print the quizProgress
  console.log('OK', JSON.stringify(quizProgress));
  process.exit(0);
}

main();

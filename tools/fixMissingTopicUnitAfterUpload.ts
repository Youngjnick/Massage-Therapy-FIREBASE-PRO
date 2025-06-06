const { initializeApp, applicationDefault } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

async function fixQuestions() {
  const snapshot = await db.collectionGroup("questions").get();
  let updated = 0;
  for (const doc of snapshot.docs) {
    const data = doc.data();
    let needsUpdate = false;
    let topic = data.topic;
    let unit = data.unit;

    // Infer topic/unit from Firestore path if missing
    const pathSegments = doc.ref.path.split("/");
    // Example: questions/{topic}/{sub...}/questions/{questionId}
    // Find the last topic/unit before the last 'questions'
    const questionsIdx = pathSegments.lastIndexOf("questions");
    if (questionsIdx > 0) {
      topic = topic || pathSegments[questionsIdx - 1];
      // If there is a unit level, it will be before the last 'questions'
      if (questionsIdx > 2) {
        unit = unit || pathSegments[questionsIdx - 3];
      }
    }

    const update = {};
    if (!data.topic && topic) { update.topic = topic; needsUpdate = true; }
    if (!data.unit && unit) { update.unit = unit; needsUpdate = true; }

    if (needsUpdate) {
      await doc.ref.update(update);
      updated++;
      console.log(`Updated ${doc.ref.path}:`, update);
    }
  }
  console.log(`Done. Updated ${updated} documents.`);
}

fixQuestions().catch(console.error);
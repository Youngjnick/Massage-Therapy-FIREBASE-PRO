// scripts/getUserStatsFromFirestore.js
// Usage: node scripts/getUserStatsFromFirestore.js <email>

const admin = require('firebase-admin');
const path = require('path');

const serviceAccount = require(path.resolve(__dirname, '../serviceAccountKey.json'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function getUserStatsByEmail(email) {
  // Adjust collection and field names as needed for your schema
  const usersRef = db.collection('users');
  const snapshot = await usersRef.where('email', '==', email).limit(1).get();
  if (snapshot.empty) {
    throw new Error(`No user found with email: ${email}`);
  }
  const userDoc = snapshot.docs[0];
  const stats = userDoc.get('stats') || {};
  return stats;
}

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error('Usage: node getUserStatsFromFirestore.js <email>');
    process.exit(1);
  }
  try {
    const stats = await getUserStatsByEmail(email);
    console.log(JSON.stringify(stats, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(2);
  }
}

if (require.main === module) {
  main();
}

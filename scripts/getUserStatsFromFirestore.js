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

async function logAllUserEmails() {
  const usersRef = db.collection('users');
  const snapshot = await usersRef.get();
  console.log('--- All users in Firestore (ID and email field) ---');
  let found = false;
  snapshot.forEach(doc => {
    const data = doc.data();
    const emailField = data.email || '(no email field)';
    console.log(`ID: ${doc.id} | email: ${emailField}`);
    if (emailField === process.argv[2]) found = true;
  });
  if (!found) {
    console.log(`Target email '${process.argv[2]}' NOT found in any user document's email field.`);
  } else {
    console.log(`Target email '${process.argv[2]}' found in at least one user document's email field.`);
  }
  console.log('-----------------------------------------------');
}

async function main() {
  const email = process.argv[2];
  const debug = process.argv.includes('--debug');
  if (!email) {
    console.error('Usage: node getUserStatsFromFirestore.js <email> [--debug]');
    process.exit(1);
  }
  try {
    if (debug) {
      await logAllUserEmails();
    }
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

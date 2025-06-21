 
// @ts-nocheck
// scripts/generateCustomToken.js
// Usage: node scripts/generateCustomToken.js <uid>

const admin = require('firebase-admin');
const fs = require('fs');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const uid = process.argv[2] || 'test-user-uid';

admin.auth().createCustomToken(uid)
  .then((customToken) => {
    fs.writeFileSync('test-custom-token.txt', customToken);
    console.log('Custom token generated and saved to test-custom-token.txt');
  })
  .catch((error) => {
    console.error('Error creating custom token:', error);
    process.exit(1);
  });

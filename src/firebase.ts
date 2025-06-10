import admin from 'firebase-admin';
import serviceAccount from '../serviceAccountKey.json';

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

export const addQuestion = async (question) => {
  const questionRef = db.collection('questions').doc();
  await questionRef.set(question);
  return questionRef.id;
};

export const getQuestions = async () => {
  const snapshot = await db.collection('questions').get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const updateQuestion = async (id, updatedData) => {
  const questionRef = db.collection('questions').doc(id);
  await questionRef.update(updatedData);
};

export const deleteQuestion = async (id) => {
  const questionRef = db.collection('questions').doc(id);
  await questionRef.delete();
};
import admin from 'firebase-admin';
import serviceAccount from './serviceAccountKey.json';

// Type assertion to ServiceAccount type for admin.credential.cert
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
});

const db = admin.firestore();

export const addQuestion = async (question: Record<string, unknown>) => {
  const questionRef = db.collection('questions').doc();
  await questionRef.set(question);
  return questionRef.id;
};

export const getQuestions = async () => {
  const snapshot = await db.collection('questions').get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const updateQuestion = async (id: string, updatedData: Record<string, unknown>) => {
  const questionRef = db.collection('questions').doc(id);
  await questionRef.update(updatedData);
};

export const deleteQuestion = async (id: string) => {
  const questionRef = db.collection('questions').doc(id);
  await questionRef.delete();
};
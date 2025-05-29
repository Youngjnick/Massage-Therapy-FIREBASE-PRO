// Script to upload questions from soap_notes.json to Firestore
import { uploadQuestionsToFirebase } from "../src/firebase/helpersFirebase.js";
import soapNotesQuestions from "../src/data/questions/soap_notes/soap_notes.json";

(async () => {
  try {
    const results = await uploadQuestionsToFirebase(soapNotesQuestions);
    console.log("Upload results:", results);
    alert("Questions upload complete! Check console for details.");
  } catch (err) {
    console.error("Error uploading questions:", err);
    alert("Error uploading questions: " + err.message);
  }
})();

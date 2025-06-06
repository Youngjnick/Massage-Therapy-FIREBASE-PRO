import { auth } from "../firebase/indexFirebase.js";
import { signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";

// Sign in with Google
export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    alert(`Signed in as ${user.displayName}`);
  } catch (error) {
    alert("Sign in failed: " + error.message);
  }
}

// Sign out
export async function signOutUser() {
  try {
    await signOut(auth);
    alert("Signed out!");
  } catch (error) {
    alert("Sign out failed: " + error.message);
  }
}

const user = auth.currentUser;
if (user) {
  console.log(user.photoURL); // This is the avatar URL
}

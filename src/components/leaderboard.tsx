import { firestoreDb } from "../firebase/indexFirebase.js";
import { collection, getDocs } from "firebase/firestore";

async function showLeaderboard() {
  const leaderboardSnap = await getDocs(collection(firestoreDb, "leaderboard"));
  const leaderboard = leaderboardSnap.docs.map((doc) => doc.data());
  openModal(
    "Leaderboard",
    `
    <ol>
      ${leaderboard.map((user) => `<li>${user.name}: ${user.points} pts</li>`).join("")}
    </ol>
  `,
  );
}

export { showLeaderboard };

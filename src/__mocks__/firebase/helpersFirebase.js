// __mocks__/firebase/helpersFirebase.js
module.exports = {
  fetchLeaderboard: jest.fn(async () => [
    { id: "user1", name: "Test User 1", points: 100, badges: [{}, {}] },
    { id: "user2", name: "Test User 2", points: 80, badges: [{}] },
  ]),
  saveStatsToFirebase: jest.fn(),
  // Add any other needed mocks here
};

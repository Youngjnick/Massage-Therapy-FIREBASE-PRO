module.exports = {};

jest.mock("firebase/auth", () => {
  const getAuth = jest.fn(() => ({}));
  const onAuthStateChanged = jest.fn();

  return {
    __esModule: true,
    getAuth,
    onAuthStateChanged,
    default: { getAuth, onAuthStateChanged },
    // Add this line to ensure named and namespace imports both work
    ...{ getAuth, onAuthStateChanged },
  };
});
// Tests for event log and sync error simulation

describe("Event Log", () => {
  beforeEach(() => {
    global.localStorage.clear();
    jest.clearAllMocks();
  });

  it("logs badge, bookmark, and sync events chronologically", () => {
    const logs = [
      { type: "badge", msg: "Earned badge X", date: "2025-05-25T10:00:00.000Z" },
      { type: "bookmark", msg: "Bookmarked Q1", date: "2025-05-25T10:01:00.000Z" },
      { type: "sync", msg: "Sync conflict", date: "2025-05-25T10:02:00.000Z" }
    ];
    localStorage.setItem("eventLog", JSON.stringify(logs));
    const loaded = JSON.parse(localStorage.getItem("eventLog"));
    expect(loaded[0].type).toBe("badge");
    expect(loaded[1].type).toBe("bookmark");
    expect(loaded[2].type).toBe("sync");
  });
});

describe("Sync Error Simulation", () => {
  beforeEach(() => {
    global.localStorage.clear();
    jest.clearAllMocks();
  });

  it("simulates a sync conflict/error", () => {
    localStorage.setItem("bookmarkLastSync", "2025-05-25T10:00:00.000Z");
    localStorage.setItem("bookmarkRemoteSync", "2025-05-25T09:00:00.000Z");
    // Simulate error: remote is behind local
    expect(localStorage.getItem("bookmarkLastSync")).not.toBe(localStorage.getItem("bookmarkRemoteSync"));
  });
});

describe("utils/index", () => {
  it("prettifyName returns prettified names", () => {
    expect(require("../index").prettifyName("soap")).toBe("SOAP");
    expect(require("../index").prettifyName("mblex")).toBe("MBLEx");
    expect(require("../index").prettifyName("test_name")).toBe("Test Name");
  });

  it("formatTopicName formats topic names", () => {
    expect(require("../index").formatTopicName("soap_notes")).toBe("SOAP Notes");
    expect(require("../index").formatTopicName("hipaa")).toBe("HIPAA");
  });

  it("getAccuracyPerTopic returns correct stats", () => {
    const questions = [
      { topic: "anatomy", stats: { correct: 2, incorrect: 1 } },
      { topic: "anatomy", stats: { correct: 1, incorrect: 0 } },
      { topic: "physiology", stats: { correct: 0, incorrect: 2 } },
    ];
    const stats = require("../index").getAccuracyPerTopic(questions);
    expect(stats.anatomy.correct).toBe(3);
    expect(stats.anatomy.incorrect).toBe(1);
    expect(stats.anatomy.accuracy).toBe(75);
    expect(stats.physiology.correct).toBe(0);
    expect(stats.physiology.incorrect).toBe(2);
    expect(stats.physiology.accuracy).toBe(0);
  });
});
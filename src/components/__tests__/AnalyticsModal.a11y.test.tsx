import React from "react";
import { render } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import AnalyticsModal from "../AnalyticsModal";

expect.extend(toHaveNoViolations);

describe("AnalyticsModal accessibility", () => {
  const analytics = { correct: 0, total: 0, streak: 0, completed: 0, lastUpdated: 0 };

  it("has no accessibility violations (empty state)", async () => {
    const { container } = render(
      <AnalyticsModal
        open={true}
        onClose={() => {}}
        analytics={analytics}
        quizHistory={[]}
        masteryHistory={[]}
        errorMap={{}}
        questions={[]}
        badges={[]}
      />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

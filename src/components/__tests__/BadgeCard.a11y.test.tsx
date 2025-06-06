import React from "react";
import { render } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import BadgeCard from "../BadgeCard";

expect.extend(toHaveNoViolations);

describe("BadgeCard accessibility", () => {
  const badge = {
    id: "test-badge",
    name: "Test Badge",
    image: "/badges/test.png",
    description: "A badge for testing.",
    earned: true
  };

  it("has no accessibility violations", async () => {
    const { container } = render(<BadgeCard badge={badge} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

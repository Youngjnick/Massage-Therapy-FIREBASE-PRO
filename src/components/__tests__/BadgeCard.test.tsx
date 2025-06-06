import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { toHaveNoViolations } from "jest-axe";
import BadgeCard from "../BadgeCard";

expect.extend(toHaveNoViolations);

describe("BadgeCard", () => {
  const badge = {
    id: "test-badge",
    name: "Test Badge",
    image: "/badges/test.png",
    description: "A badge for testing.",
    earned: true
  };

  it("renders badge name and image", () => {
    render(<BadgeCard badge={badge} />);
    // There are two elements with "Test Badge" text: badgeName and sr-only label
    const nameEls = screen.getAllByText("Test Badge");
    expect(nameEls.length).toBeGreaterThanOrEqual(2);
    expect(screen.getByTestId("badge-img-test-badge")).toBeInTheDocument();
  });

  it("shows earned status", () => {
    render(<BadgeCard badge={badge} />);
    expect(screen.getByTestId("badge-status-test-badge")).toHaveTextContent("Earned");
  });

  it("shows unearned status", () => {
    render(<BadgeCard badge={{ ...badge, earned: false }} />);
    expect(screen.getByTestId("badge-status-test-badge")).toHaveTextContent("Not earned");
  });

  it("calls onShowDetails on click", () => {
    const onShowDetails = jest.fn();
    render(<BadgeCard badge={badge} onShowDetails={onShowDetails} />);
    fireEvent.click(screen.getByTestId("badge-earned-test-badge"));
    expect(onShowDetails).toHaveBeenCalledWith(badge);
  });

  it("calls onShowDetails on Enter key", () => {
    const onShowDetails = jest.fn();
    render(<BadgeCard badge={badge} onShowDetails={onShowDetails} />);
    fireEvent.keyDown(screen.getByTestId("badge-earned-test-badge"), { key: "Enter" });
    expect(onShowDetails).toHaveBeenCalledWith(badge);
  });

  it("has correct accessibility attributes", () => {
    render(<BadgeCard badge={badge} />);
    // ...existing code...
  });
});

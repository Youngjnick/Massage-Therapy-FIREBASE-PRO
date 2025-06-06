import * as React from "react";
import type { JSX } from "react";
import { render, screen } from "@testing-library/react";
import ErrorBoundary from "../ErrorBoundary";

function ProblemChild(): JSX.Element {
  throw new Error("Test error");
  // return <div />; // unreachable, but ensures return type
}

describe("ErrorBoundary", () => {
  it("renders fallback UI on error", () => {
    render(
      <ErrorBoundary>
        <ProblemChild />
      </ErrorBoundary>
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Something went wrong");
  });

  it("renders children when no error", () => {
    render(
      <ErrorBoundary>
        <div>Safe Child</div>
      </ErrorBoundary>
    );
    expect(screen.getByText("Safe Child")).toBeInTheDocument();
  });
});

// Fix for: Cannot find namespace 'JSX'.
// Ensure the file is treated as a module and JSX namespace is available.
export {};

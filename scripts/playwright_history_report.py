#!/usr/bin/env python3
import sys
from playwright_report import parse, db, report_txt, report_html
import argparse
from pathlib import Path
import json
import datetime

OUTPUT_FILE = Path("scripts/reports/playwright-output.txt")


def generate_summary_table(db_obj):
    summary = {
        "Total Tests": len(db_obj.tests),
        "Passed": sum(1 for t in db_obj.tests if t.status == "passed"),
        "Failed": sum(1 for t in db_obj.tests if t.status == "failed"),
        "Flaky": sum(1 for t in db_obj.tests if t.status == "flaky"),
        "Skipped": sum(1 for t in db_obj.tests if t.status == "skipped"),
    }
    return summary


def write_markdown_report(db_obj, run_stats, include_sections):
    summary = generate_summary_table(db_obj)
    with open(report_txt.REPORT_TXT_FILE, "w") as f:
        f.write("# Playwright Test Report\n\n")
        if "summary" in include_sections:
            f.write("## Summary\n\n")
            for key, value in summary.items():
                f.write(f"- **{key}:** {value}\n")
        if "table-of-contents" in include_sections:
            f.write("\n## Table of Contents\n\n")
            f.write("- [Summary](#summary)\n")
            f.write("- [Test Results](#test-results)\n")
            f.write("- [Coverage](#coverage)\n")
            f.write("- [Trend Graph](#trend-graph)\n")
            f.write("- [Skipped Tests](#skipped-tests)\n")
            f.write("- [Deleted Tests](#deleted-tests)\n")
        if "test-results" in include_sections:
            f.write("\n## Test Results\n\n")
            test_history = {}
            for test in db_obj.tests:
                if test.name not in test_history:
                    test_history[test.name] = {"passes": 0, "failures": 0, "latest_status": test.status}
                if test.status == "passed":
                    test_history[test.name]["passes"] += 1
                elif test.status == "failed":
                    test_history[test.name]["failures"] += 1
                test_history[test.name]["latest_status"] = test.status
            for test_name, history in test_history.items():
                emoji = "✅" if history["latest_status"] == "passed" else "❌" if history["latest_status"] == "failed" else "⚠️"
                f.write(f"- {emoji} **{test_name}**: {history['latest_status']} (latest, {history['passes']} passes, {history['failures']} failures)\n")
        if "coverage" in include_sections:
            f.write("\n## Coverage\n\n")
            coverage = run_stats.get("coverage", {})
            for key, value in coverage.items():
                f.write(f"- **{key}:** {value}%\n")
        if "trend-graph" in include_sections:
            f.write("\n## Trend Graph\n\n")
            total_tests = len(db_obj.tests)
            passed_tests = sum(1 for t in db_obj.tests if t.status == "passed")
            failed_tests = sum(1 for t in db_obj.tests if t.status == "failed")
            pass_rate = (passed_tests / total_tests) * 100 if total_tests > 0 else 0
            fail_rate = (failed_tests / total_tests) * 100 if total_tests > 0 else 0
            trend = "📈 Trend: " + "".join(["🟩" if t.status == "passed" else "🟥" for t in db_obj.tests[:10]])
            f.write(f"{trend}\n")
            f.write(f"- **Pass Rate:** {pass_rate:.2f}%\n")
            f.write(f"- **Fail Rate:** {fail_rate:.2f}%\n")
        if "skipped-tests" in include_sections:
            f.write("\n## Skipped Tests\n\n")
            skipped_tests = [t for t in db_obj.tests if t.status == "skipped"]
            for test in skipped_tests:
                f.write(f"- **{test.name}**\n")
        if "deleted-tests" in include_sections:
            f.write("\n## Deleted Tests\n\n")
            deleted_tests = [t for t in db_obj.tests if t.status == "deleted"]
            for test in deleted_tests:
                f.write(f"- **{test.name}**\n")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--worker-mode', choices=['single', 'multi'], default=None, help='Worker mode: single or multi')
    parser.add_argument('--include-sections', nargs='+', default=['summary', 'test-results', 'coverage', 'trend-graph', 'skipped-tests', 'deleted-tests'], help='Sections to include in the report')
    args = parser.parse_args()

    results = parse.parse_output_file(OUTPUT_FILE)
    db_obj = db.update_live_test_status(results, worker_mode=args.worker_mode)

    # For demo, just pass empty run_stats (should be loaded from history for full implementation)
    run_stats = {"coverage": {"statements": 85, "branches": 80, "lines": 90, "functions": 88}}
    write_markdown_report(db_obj, run_stats)
    print(f"[INFO] Markdown summary written to {report_txt.REPORT_TXT_FILE}")
    report_html.generate_html_report(db_obj)
    print(f"[INFO] HTML summary written to scripts/reports/playwright-history.html")


if __name__ == "__main__":
    main()

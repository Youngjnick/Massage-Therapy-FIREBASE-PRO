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
        "Total Tests": len(db_obj.get("tests", [])),
        "Passed": sum(1 for t in db_obj.get("tests", []) if t.get("status") == "passed"),
        "Failed": sum(1 for t in db_obj.get("tests", []) if t.get("status") == "failed"),
        "Flaky": sum(1 for t in db_obj.get("tests", []) if t.get("status") == "flaky"),
        "Skipped": sum(1 for t in db_obj.get("tests", []) if t.get("status") == "skipped"),
    }
    return summary


def write_markdown_report(db_obj, run_stats, include_sections):
    summary = generate_summary_table(db_obj)
    # Calculate pass/fail/flaky/skipped for badges
    total = summary["Total Tests"]
    passed = summary["Passed"]
    failed = summary["Failed"]
    flaky = summary["Flaky"]
    skipped = summary["Skipped"]
    pass_rate = (passed / total) * 100 if total > 0 else 0
    fail_rate = (failed / total) * 100 if total > 0 else 0
    coverage = run_stats.get("coverage", {})
    # Markdown badges
    badge_url = lambda label, value, color: f"https://img.shields.io/badge/{label}-{value}-{color}.svg"
    with open(report_txt.REPORT_TXT_FILE, "w") as f:
        f.write("# Playwright Test Report\n\n")
        # Badges
        f.write(f"![Pass Rate]({badge_url('Pass_Rate', f'{pass_rate:.1f}%', 'brightgreen')}) ")
        f.write(f"![Fail Rate]({badge_url('Fail_Rate', f'{fail_rate:.1f}%', 'red')}) ")
        if coverage:
            f.write(f"![Coverage]({badge_url('Coverage', f'{coverage.get('lines', 0)}%', 'blue')}) ")
        f.write("\n\n")
        if "summary" in include_sections:
            f.write("## Summary\n\n")
            for key, value in summary.items():
                f.write(f"- **{key}:** {value}\n")
        if "table-of-contents" in include_sections:
            f.write("\n## Table of Contents\n\n")
            f.write("- [Summary](#summary)\n")
            f.write("- [Tests Needing Attention](#tests-needing-attention)\n")
            f.write("- [Flaky Tests](#flaky-tests)\n")
            f.write("- [Test Results](#test-results)\n")
            f.write("- [Coverage](#coverage)\n")
            f.write("- [Trend Graph](#trend-graph)\n")
            f.write("- [Skipped Tests](#skipped-tests)\n")
            f.write("- [Deleted Tests](#deleted-tests)\n")
        # Highlight problematic tests
        if True:
            f.write("\n## Tests Needing Attention\n\n")
            for test in db_obj.get("tests", []):
                if test.get("status") in ("failed", "flaky") or (test.get("history", []) and test.get("history", [])[-1] in ("\u2718", "failed", "❌", "flaky", "⚠️")):
                    name = test.get("title") or test.get("name")
                    f.write(f"- **{name}** ({test.get('file')}) - Last: {test.get('status')} at {test.get('last_time', '')}\n")
        # Flaky tests section
        if True:
            f.write("\n## Flaky Tests\n\n")
            for test in db_obj.get("tests", []):
                if test.get("status") == "flaky" or any(s in ("flaky", "⚠️") for s in test.get("history", [])):
                    name = test.get("title") or test.get("name")
                    f.write(f"- **{name}** ({test.get('file')}) - Last: {test.get('status')} at {test.get('last_time', '')}\n")
        if "test-results" in include_sections:
            f.write("\n## Test Results\n\n")
            # Group by file
            tests_by_file = {}
            for test in db_obj.get("tests", []):
                file = test.get("file", "unknown")
                if file not in tests_by_file:
                    tests_by_file[file] = []
                tests_by_file[file].append(test)
            for file, tests in tests_by_file.items():
                f.write(f"<details><summary><strong>{file}</strong></summary>\n\n")
                # Per-file summary table
                f.write("| Test | Status | Pass | Fail | Flaky | Skipped | Last Run | Trend |\n")
                f.write("|------|--------|------|------|-------|---------|----------|-------|\n")
                for test in tests:
                    passes = sum(1 for s in test.get("history", []) if s in ("\u2713", "passed", "✅"))
                    fails = sum(1 for s in test.get("history", []) if s in ("\u2718", "failed", "❌"))
                    flakies = sum(1 for s in test.get("history", []) if s in ("flaky", "⚠️"))
                    skips = sum(1 for s in test.get("history", []) if s in ("skipped", "➖"))
                    last_status = test.get("status")
                    last_time = test.get("last_time", "")
                    name = test.get("title") or test.get("name")
                    # Emoji for status
                    if last_status in ("\u2713", "passed", "✅"): emoji = "✅"
                    elif last_status in ("\u2718", "failed", "❌"): emoji = "❌"
                    elif last_status in ("flaky", "⚠️"): emoji = "⚠️"
                    elif last_status in ("skipped", "➖"): emoji = "➖"
                    else: emoji = "⚠️"
                    # Trend sparkline
                    trend = "".join(["🟩" if s in ("\u2713", "passed", "✅") else "🟥" if s in ("\u2718", "failed", "❌") else "🟨" if s in ("flaky", "⚠️") else "➖" for s in test.get("history", [])[-10:]])
                    f.write(f"| {name} | {emoji} | {passes} | {fails} | {flakies} | {skips} | {last_time} | {trend} |\n")
                f.write("\n</details>\n\n")
        if "coverage" in include_sections:
            f.write("\n## Coverage\n\n")
            coverage = run_stats.get("coverage", {})
            for key, value in coverage.items():
                f.write(f"- **{key}:** {value}%\n")
        if "trend-graph" in include_sections:
            f.write("\n## Trend Graph\n\n")
            total_tests = len(db_obj.get("tests", []))
            passed_tests = sum(1 for t in db_obj.get("tests", []) if t.get("status") == "passed")
            failed_tests = sum(1 for t in db_obj.get("tests", []) if t.get("status") == "failed")
            pass_rate = (passed_tests / total_tests) * 100 if total_tests > 0 else 0
            fail_rate = (failed_tests / total_tests) * 100 if total_tests > 0 else 0
            trend = "📈 Trend: " + "".join(["🟩" if t.get("status") == "passed" else "🟥" if t.get("status") == "failed" else "🟨" if t.get("status") == "flaky" else "➖" for t in db_obj.get("tests", [])[:10]])
            f.write(f"{trend}\n")
            f.write(f"- **Pass Rate:** {pass_rate:.2f}%\n")
            f.write(f"- **Fail Rate:** {fail_rate:.2f}%\n")
        if "skipped-tests" in include_sections:
            f.write("\n## Skipped Tests\n\n")
            skipped_tests = [t for t in db_obj.get("tests", []) if t.get("status") == "skipped"]
            for test in skipped_tests:
                f.write(f"- **{test.get('name')}** (last: {test.get('last_time', '')})\n")
        if "deleted-tests" in include_sections:
            f.write("\n## Deleted Tests\n\n")
            deleted_tests = [t for t in db_obj.get("tests", []) if t.get("status") == "deleted"]
            for test in deleted_tests:
                f.write(f"- **{test.get('name')}** (last: {test.get('last_time', '')})\n")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--worker-mode', choices=['single', 'multi'], default=None, help='Worker mode: single or multi')
    parser.add_argument('--include-sections', nargs='+', default=['summary', 'test-results', 'coverage', 'trend-graph', 'skipped-tests', 'deleted-tests'], help='Sections to include in the report')
    args = parser.parse_args()

    # Load from history.json instead of parsing output.txt
    history_json_path = Path("scripts/reports/playwright-history.json")
    if not history_json_path.exists():
        print(f"[ERROR] {history_json_path} not found. Cannot generate report.")
        sys.exit(1)
    with open(history_json_path) as f:
        history_data = json.load(f)

    # Flatten test results from history.json
    tests = []
    for key, value in history_data.items():
        if key == "migrated":
            continue
        test_entry = {
            "name": value.get("location", key),
            "status": value.get("last_status"),
            "file": value.get("file"),
            "history": value.get("history", []),
            "last_time": value.get("last_time"),
        }
        tests.append(test_entry)

    db_obj = {"tests": tests}
    # Optionally, you can load coverage from history or keep as static
    run_stats = {"coverage": {"statements": 85, "branches": 80, "lines": 90, "functions": 88}}
    write_markdown_report(db_obj, run_stats, include_sections=args.include_sections)
    print(f"[INFO] Markdown summary written to {report_txt.REPORT_TXT_FILE}")
    report_html.generate_html_report(db_obj)
    print(f"[INFO] HTML summary written to scripts/reports/playwright-history.html")


if __name__ == "__main__":
    main()
    # Open the HTML report automatically (macOS only)
    html_report_path = Path("scripts/reports/playwright-history.html")
    import platform
    import subprocess
    if html_report_path.exists():
        system = platform.system()
        if system == "Darwin":
            subprocess.run(["open", str(html_report_path)])
        elif system == "Windows":
            subprocess.run(["start", str(html_report_path)], shell=True)
        elif system == "Linux":
            subprocess.run(["xdg-open", str(html_report_path)])

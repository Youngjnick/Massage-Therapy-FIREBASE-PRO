#!/usr/bin/env python3
import sys
from playwright_report import parse, db, report_txt, report_html
import argparse
from pathlib import Path
import json
import datetime


def generate_summary_table(db_obj):
    tests = []
    if "tests" in db_obj:
        tests = db_obj["tests"]
    else:
        for test_id, test_data in db_obj.items():
            if test_id != "migrated":
                tests.append(test_data)
    
    summary = {
        "Total Tests": len(tests),
        "Passed": sum(1 for t in tests if t.get("history", []) and t["history"][-1] in ("\u2713", "✓")),
        "Failed": sum(1 for t in tests if t.get("history", []) and t["history"][-1] in ("\u2718", "✘")),
        "Flaky": sum(1 for t in tests if t.get("history", []) and any(s in ("flaky", "⚠️") for s in t["history"])),
        "Skipped": sum(1 for t in tests if t.get("history", []) and t["history"][-1] in ("skipped", "➖")),
    }
    return summary


def write_markdown_report(db_obj, run_stats, include_sections):
    # Convert old format to new format if needed
    if "tests" not in db_obj:
        tests = []
        for test_id, test_data in db_obj.items():
            if test_id == "migrated":
                continue
            test = {
                "title": test_data.get("title", ""),
                "file": test_data.get("file", ""),
                "name": test_id,
                "line": test_id.split(":")[-2] if ":" in test_id else "",
                "history": test_data.get("history", []),
                "status": test_data.get("history", [])[-1] if test_data.get("history") else "",
                "last_time": test_data.get("last_time", datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")),
                "duration": test_data.get("duration", "-"),
                "duration_mean": test_data.get("duration_mean", "-"),
                "skipped": test_data.get("skipped", False),
                "deleted": test_data.get("deleted", False),
                "path": test_id
            }
            tests.append(test)
        db_obj = {"tests": tests}

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
        
        # Highlight problematic tests
        f.write("\n## Tests Needing Attention\n\n")
        for test in db_obj.get("tests", []):
            if test.get("status") in ("failed", "flaky") or (test.get("history", []) and test.get("history", [])[-1] in ("\u2718", "failed", "❌", "flaky", "⚠️")):
                name = test.get("path") or (test.get("title") or test.get("name"))
                f.write(f"- **{name}** ({test.get('file')}) - Last: ✘ at {test.get('last_time', '')}\n")
        
        # Flaky tests section
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
                f.write("| Test | Status | Pass | Fail | Flaky | Skipped | Last Run | Trend | Duration |\n")
                f.write("|------|--------|------|------|-------|---------|----------|-------|----------|\n")
                for test in tests:
                    # Get pass/fail counts
                    passes = sum(1 for s in test.get("history", []) if s in ("\u2713", "✓", "passed", "✅"))
                    fails = sum(1 for s in test.get("history", []) if s in ("\u2718", "✘", "failed", "❌"))
                    flakies = sum(1 for s in test.get("history", []) if s in ("flaky", "⚠️"))
                    skips = sum(1 for s in test.get("history", []) if s in ("skipped", "➖"))
                    
                    # Get test status and time
                    last_status = test.get("status", "")
                    if test.get("history"):
                        last_status = test["history"][-1]
                    last_time = test.get("last_time", "")
                    
                    # Format test name and link
                    name = test.get("path") or (test.get("title") or test.get("name"))
                    file_link = f"{name}"
                    
                    # Emoji for status
                    if last_status in ("\u2713", "✓", "passed", "✅"): emoji = "✅"
                    elif last_status in ("\u2718", "✘", "failed", "❌"): emoji = "❌"
                    elif last_status in ("flaky", "⚠️"): emoji = "⚠️"
                    elif last_status in ("skipped", "➖"): emoji = "➖"
                    else: emoji = "⚠️"
                    
                    # Get duration info
                    duration = test.get("duration", "-")
                    duration_mean = test.get("duration_mean", "-")
                    if duration != "-" and duration_mean != "-":
                        duration_str = f"{duration} / {duration_mean}"
                    else:
                        duration_str = "- / -"
                    
                    # Trend sparkline using full history
                    if test.get("history"):
                        trend = ""
                        for h in test["history"][-10:]:  # Show last 10 results
                            if h in ("\u2713", "✓", "passed", "✅"): trend += "🟩"
                            elif h in ("\u2718", "✘", "failed", "❌"): trend += "🟥"
                            elif h in ("flaky", "⚠️"): trend += "🟨"
                            elif h in ("skipped", "➖"): trend += "⬜"
                            else: trend += "⬜"
                        while len(trend) < 10:  # Pad to 10 squares
                            trend = "⬜" + trend
                    else:
                        trend = "⬜" * 10
                        
                    # Add test details with history
                    f.write(f"| {file_link} | {emoji} | {passes} | {fails} | {flakies} | {skips} | {last_time} | {trend} | {duration_str} |\n")
                
                f.write("\n</details>\n\n")



        # Add coverage information if available
        if "coverage" in include_sections and coverage:
            f.write("## Coverage\n\n")
            f.write(f"- **statements:** {coverage.get('statements', 0)}%\n")
            f.write(f"- **branches:** {coverage.get('branches', 0)}%\n")
            f.write(f"- **lines:** {coverage.get('lines', 0)}%\n")
            f.write(f"- **functions:** {coverage.get('functions', 0)}%\n\n")

        # Add skipped tests section
        f.write("## Skipped Tests\n\n")
        skipped_tests = [t for t in db_obj.get("tests", []) if t.get("skipped")]
        if skipped_tests:
            for test in skipped_tests:
                name = test.get("path") or (test.get("title") or test.get("name"))
                f.write(f"- **{name}** ({test.get('file')}) - Last run: {test.get('last_time', '')}\n")
        else:
            f.write("No tests have been skipped.\n")
        
        # Add deleted tests section
        f.write("\n## Deleted Tests\n\n")
        deleted_tests = [t for t in db_obj.get("tests", []) if t.get("deleted")]
        if deleted_tests:
            for test in deleted_tests:
                name = test.get("path") or (test.get("title") or test.get("name"))
                f.write(f"- **{name}** ({test.get('file')}) - Last run: {test.get('last_time', '')}\n")
        else:
            f.write("No tests have been deleted.\n")

        # Trend graph with full history table
        f.write("\n## Trend Graph\n\n")
        if test_history := [t for t in db_obj.get("tests", []) if t.get("history")]:
            # Create a trend of the last 20 results only
            trend_data = []
            for t in test_history:
                for h in t.get("history", [])[-20:]:  # Get last 20 results
                    trend_data.append(h)
            trend_data = trend_data[-20:]  # Keep only last 20 overall results
            
            # Calculate rates
            total_results = len(trend_data)
            passes = sum(1 for h in trend_data if h in ("\u2713", "✓", "passed", "✅"))
            fails = sum(1 for h in trend_data if h in ("\u2718", "✘", "failed", "❌"))
            flakies = sum(1 for h in trend_data if h in ("flaky", "⚠️"))
            skips = sum(1 for h in trend_data if h in ("skipped", "➖"))
            
            pass_rate = (passes / total_results * 100) if total_results > 0 else 0
            fail_rate = (fails / total_results * 100) if total_results > 0 else 0
            
            # Create trend visualization - last 20 results
            trend = ""
            for h in trend_data:
                if h in ("\u2713", "✓", "passed", "✅"): trend += "🟩"
                elif h in ("\u2718", "✘", "failed", "❌"): trend += "🟥"
                elif h in ("flaky", "⚠️"): trend += "🟨"
                elif h in ("skipped", "➖"): trend += "⬜"
                else: trend += "⬜"
            
            f.write(f"📈 Last 20 Results: {trend}\n\n")
            f.write("### Test Result History\n\n")
            f.write("| Group | Pass Rate | Fail Rate | Flaky | Skipped | Trend |\n")
            f.write("|-------|------------|-----------|--------|----------|--------|\n")
            
            # Group results by every 20 runs
            chunks = [trend_data[i:i+20] for i in range(0, len(trend_data), 20)]
            chunks.reverse()  # Show newest first
            
            for i, chunk in enumerate(chunks):
                chunk_passes = sum(1 for h in chunk if h in ("\u2713", "✓", "passed", "✅"))
                chunk_fails = sum(1 for h in chunk if h in ("\u2718", "✘", "failed", "❌"))
                chunk_flakies = sum(1 for h in chunk if h in ("flaky", "⚠️"))
                chunk_skips = sum(1 for h in chunk if h in ("skipped", "➖"))
                chunk_total = len(chunk)
                chunk_pass_rate = (chunk_passes / chunk_total * 100) if chunk_total > 0 else 0
                chunk_fail_rate = (chunk_fails / chunk_total * 100) if chunk_total > 0 else 0
                
                # Create trend visualization for each group
                chunk_trend = ""
                for h in chunk:
                    if h in ("\u2713", "✓", "passed", "✅"): chunk_trend += "🟩"
                    elif h in ("\u2718", "✘", "failed", "❌"): chunk_trend += "🟥"
                    elif h in ("flaky", "⚠️"): chunk_trend += "🟨"
                    elif h in ("skipped", "➖"): chunk_trend += "⬜"
                    else: chunk_trend += "⬜"
                
                f.write(f"| {len(chunks)-i} | {chunk_pass_rate:.2f}% | {chunk_fail_rate:.2f}% | {chunk_flakies} | {chunk_skips} | {chunk_trend} |\n")
        
        # Skipped tests section
        f.write("## Skipped Tests\n\n")
        has_skipped = False
        for test in db_obj.get("tests", []):
            if test.get("status") == "skipped" or (test.get("history", []) and test["history"][-1] in ("skipped", "➖")):
                has_skipped = True
                name = test.get("title") or test.get("name")
                f.write(f"- **{name}** ({test.get('file')}) - Last: {test.get('status')} at {test.get('last_time', '')}\n")
        if not has_skipped:
            f.write("\n")

        # Deleted tests section
        f.write("## Deleted Tests\n\n")
        has_deleted = False
        for test in db_obj.get("deleted_tests", []):
            has_deleted = True
            name = test.get("title") or test.get("name")
            f.write(f"- **{name}** ({test.get('file')}) - Deleted at {test.get('deleted_time', '')}\n")
        if not has_deleted:
            f.write("\n")
        

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--db-file", type=Path, default=db.JSON_FILE)
    parser.add_argument("--sections", nargs="+", default=["summary", "test-results"])
    args = parser.parse_args()

    # Load the database
    with open(args.db_file) as f:
        db_obj = json.load(f)
    
    # Load run stats if available
    run_stats = {}
    run_stats_file = args.db_file.parent / "run_stats.json"
    if run_stats_file.exists():
        with open(run_stats_file) as f:
            run_stats = json.load(f)

    # Generate markdown report
    write_markdown_report(db_obj, run_stats, args.sections)


if __name__ == "__main__":
    main()

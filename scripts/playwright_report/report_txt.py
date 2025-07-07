import datetime
from pathlib import Path
import glob

REPORT_TXT_FILE = Path("scripts/playwright-history-report.txt")

def write_txt_summary(db, run_stats):
    now = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    lines = [f"# Playwright E2E Test History (as of {now})\n"]
    lines.append(f"Last Run: {now}\n")
    GITHUB_BASE = "https://github.com/youngjnick/Massage-Therapy-FIREBASE-PRO/blob/main/"
    all_spec_files = set(glob.glob("e2e/*.spec.*"))
    filtered_db = {k: v for k, v in db.items() if isinstance(v, dict) and v.get("file") in all_spec_files}

    # Section: Tests that fail on multicore but pass on single worker
    lines.append("\n## Multicore-Only Failures (Fail on multicore, Pass on single worker)\n")
    for entry in filtered_db.values():
        rbwm = entry.get("results_by_worker_mode", {})
        single_hist = rbwm.get("single", [])
        multi_hist = rbwm.get("multi", [])
        if single_hist and multi_hist:
            if ("✗" in multi_hist) and (all(x == "✓" for x in single_hist if x in ("✓", "✗"))):
                title = entry.get('title') or entry.get('description') or entry.get('location')
                file_path = entry.get('file', '')
                file_link = f"[{file_path}]({GITHUB_BASE}{file_path})" if file_path else ""
                lines.append(f"- {entry.get('location', '?')}  ✗(multi) ✓(single)  {title} {file_link}")

    # Latest Test Results (with duration and error if available)
    lines.append("\n## Latest Test Results\n")
    for entry in filtered_db.values():
        if entry.get("last_status") in ("✓", "✗"):
            mark = "✓" if entry["last_status"] == "✓" else "✗"
            title = entry.get('title') or entry.get('description') or entry.get('location')
            duration = entry.get('duration', '')
            if not duration and 'raw' in entry:
                import re
                m = re.search(r'\((\d+\.\d+)s\)', entry['raw'])
                if m:
                    duration = m.group(1) + 's'
            flaky = ("✓" in entry.get("history", []) and "✗" in entry.get("history", []))
            flaky_str = " [flaky]" if flaky else ""
            err = entry.get('error', '')
            dur_str = f" ({duration})" if duration else ""
            file_path = entry.get('file', '')
            file_link = f"[{file_path}]({GITHUB_BASE}{file_path})" if file_path else ""
            rbwm = entry.get("results_by_worker_mode", {})
            if rbwm:
                status_str = []
                for mode in ["single", "multi"]:
                    hist = rbwm.get(mode, [])
                    if hist:
                        last = hist[-1]
                        status_str.append(f"{last}({mode})")
                status_str = " ".join(status_str)
                lines.append(f"- {entry.get('location', '?')}  {status_str}  {title}{dur_str}{flaky_str} {file_link}")
            else:
                lines.append(f"- {entry.get('location', '?')}  {mark}  {title}{dur_str}{flaky_str} {file_link}")
            if err:
                lines.append(f"    Error: {err}")

    lines.append("\n---\n")

    # Failures only
    lines.append("\n## Failures Only\n")
    for entry in filtered_db.values():
        if entry.get("last_status") == "✗":
            title = entry.get('title') or entry.get('description') or entry.get('location')
            file_path = entry.get('file', '')
            file_link = f"[{file_path}]({GITHUB_BASE}{file_path})" if file_path else ""
            lines.append(f"- {entry.get('location', '?')}  ✗  {title} {file_link}")
            err = entry.get('error', '')
            if err:
                lines.append(f"    Error: {err}")
    # Flaky only
    lines.append("\n## Flaky Only\n")
    for entry in filtered_db.values():
        hist = entry.get("history", [])
        if "✓" in hist and "✗" in hist:
            title = entry.get('title') or entry.get('description') or entry.get('location')
            file_path = entry.get('file', '')
            file_link = f"[{file_path}]({GITHUB_BASE}{file_path})" if file_path else ""
            lines.append(f"- {entry.get('location', '?')}  [flaky]  {title} {file_link}")

    lines.append("\n---\n")

    # Test History by Test
    lines.append("\n## Test History by Test\n")
    for entry in filtered_db.values():
        loc = entry.get("location", "?")
        hist = entry.get("history", [])
        fails = hist.count("✗")
        passes = hist.count("✓")
        flaky = ("✓" in hist and "✗" in hist)
        file_path = entry.get('file', '')
        file_link = f"[{file_path}]({GITHUB_BASE}{file_path})" if file_path else ""
        if fails > 0:
            lines.append(f"{loc} {file_link}\n  ✗ ({fails} failures){' [flaky]' if flaky else ''}")
            err = entry.get('error', '')
            if err:
                lines.append(f"    Error: {err}")
        if passes > 0 and (fails > 0 or len(hist) > 1):
            lines.append(f"  ✓ (latest)")

    lines.append("\n---\n")

    # Trend Over Time
    lines.append("\n## Trend Over Time\n")
    lines.append("Date                | Total | Passed | Failed | Flaky | Skipped | Deleted")
    lines.append("--------------------|-------|--------|--------|-------|---------|-------")
    for stat in run_stats[-5:]:
        lines.append(f"{stat['date']:<20} | {stat['total']:<5} | {stat['passed']:<6} | {stat['failed']:<6} | {stat['flaky']:<5} | {stat['skipped']:<7} | {stat['deleted']:<6}")
    lines.append("...                 | ...   | ...    | ...    | ...   | ...     | ...   | ...\n")

    # Summary
    passing = sum(1 for e in filtered_db.values() if e.get("last_status") == "✓")
    failing = sum(1 for e in filtered_db.values() if e.get("last_status") == "✗")
    flaky = sum(1 for e in filtered_db.values() if "✓" in e.get("history", []) and "✗" in e.get("history", []))
    skipped = sum(1 for e in filtered_db.values() if e.get("last_status") == "-")
    deleted = len(db) - len(filtered_db)
    lines.append("---\n")
    lines.append("Summary:")
    lines.append(f"- Total tests: {len(filtered_db)}")
    lines.append(f"- Passing: {passing}")
    lines.append(f"- Failing: {failing}")
    lines.append(f"- Flaky: {flaky}")
    lines.append(f"- Skipped: {skipped}")
    lines.append(f"- Deleted: {deleted}\n")
    lines.append("Notes:")
    lines.append("- ✓ = Pass, ✗ = Fail")
    lines.append("- Each test shows its most recent result, duration, and a count of previous failures/passes.")
    lines.append("- Flaky tests are marked with [flaky].")
    lines.append("- The trend table shows how your suite’s health changed over time.\n")
    with open(REPORT_TXT_FILE, "w", encoding="utf-8") as f:
        f.write('\n'.join(lines))

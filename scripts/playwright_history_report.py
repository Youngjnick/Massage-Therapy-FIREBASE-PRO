#!/usr/bin/env python3
import sys
import re
import datetime
from pathlib import Path
import json
import html as html_escape_mod
import os

OUTPUT_FILE = Path("scripts/playwright-output.txt")
HISTORY_FILE = Path("scripts/playwright-output-history.txt")
HTML_FILE = Path("playwright-history.html")
LIVE_FILE = Path("scripts/playwright-history-live.txt")
JSON_FILE = Path("scripts/playwright-history.json")

def parse_output_file(output_file):
    results = []
    with open(output_file, encoding="utf-8") as f:
        lines = list(f)
        print("[DEBUG] First 20 lines of output file:")
        for l in lines[:20]:
            print(l.rstrip())
        for line in lines:
            m = re.match(r'^\s*([✓✘])\s+\d+\s+\[.*?\]\s+›\s+([\w/\.-]+\.spec\.[tj]s):(\d+):(\d+)', line)
            if m:
                print(f"[DEBUG] Matched: {line.strip()}")
                status, file, line_num, col_num = m.groups()
                results.append({
                    "status": status,
                    "file": file,
                    "line": int(line_num),
                    "col": int(col_num),
                    "raw": line.strip()
                })
            else:
                print(f"[DEBUG] No match: {line.strip()}")
    print(f"[DEBUG] Total matched results: {len(results)}")
    return results

def summarize_results(results):
    total = len(results)
    passed = sum(1 for r in results if r["status"] == "✓")
    failed = sum(1 for r in results if r["status"] == "✘")
    failed_locations = [f'{r["file"]}:{r["line"]}:{r["col"]}' for r in results if r["status"] == "✘"]
    return total, passed, failed, failed_locations

def append_history_summary(total, passed, failed, failed_locations, flaky, skipped, deleted, failed_titles, flaky_titles, skipped_titles):
    now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    output = ""
    if OUTPUT_FILE.exists():
        with open(OUTPUT_FILE, encoding="utf-8") as f:
            output = f.read()
    summary = f"""
============================================================
PLAYWRIGHT RUN SUMMARY - {now}
Total: {total}  Passed: {passed}  Failed: {failed}  Flaky: {flaky}  Skipped: {skipped}  Deleted: {deleted}\n"""
    if failed > 0:
        summary += f"\nFAILED TESTS:\n" + "\n".join(f"- {t}" for t in failed_titles) + "\n"
    if flaky > 0:
        summary += f"\nFLAKY TESTS:\n" + "\n".join(f"- {t}" for t in flaky_titles) + "\n"
    if skipped > 0:
        summary += f"\nSKIPPED TESTS:\n" + "\n".join(f"- {t}" for t in skipped_titles) + "\n"
    if deleted > 0:
        summary += f"\nDELETED TESTS: {deleted}\n"
    summary += f"\n--- Full Playwright Output ---\n{output}\n--- End of Output ---\n"
    # Always append the summary to the file, even if it was empty
    with open(HISTORY_FILE, "a", encoding="utf-8") as f:
        f.write(summary)

def parse_error_blocks(output_file):
    # Extract error messages for failed tests
    errors = {}
    with open(output_file, encoding="utf-8") as f:
        lines = list(f)
    i = 0
    while i < len(lines):
        line = lines[i]
        m = re.match(r'✘ .* (e2e/[^ >]*\.spec\.[tj]s):(\d+):(\d+)', line)
        if m:
            file, line_num, col_num = m.groups()
            key = f"{file}:{line_num}:{col_num}"
            # Look for error block indented after this line
            error_lines = []
            i += 1
            while i < len(lines) and (lines[i].startswith('    ') or lines[i].startswith('  ')):
                error_lines.append(lines[i].strip())
                i += 1
            errors[key] = '\n'.join(error_lines)
        else:
            i += 1
    return errors

def get_test_sequences_from_history(history_file):
    # Build a dict: test_location -> sequence of pass/fail (✓/✘)
    sequences = {}
    with open(history_file, encoding="utf-8") as f:
        for line in f:
            m = re.match(r'Failed locations: (.*)', line)
            if m:
                failed = m.group(1).split(', ')
                for loc in failed:
                    if loc:
                        sequences.setdefault(loc, []).append('✘')
            m2 = re.match(r'Total: (\d+)', line)
            if m2:
                # Next lines will have Passed/Failed counts, but we only care about locations
                pass
    # For all tests seen in output, add ✓ for passes
    # (This is a simple version; can be improved for full sequence tracking)
    return sequences

def is_flaky(seq):
    return '✓' in seq and '✘' in seq

def generate_html_report_advanced(results, errors, sequences):
    # Prepare data for JS filtering and charting
    data = []
    for r in results:
        loc = f'{r["file"]}:{r["line"]}:{r["col"]}'
        data.append({
            "location": loc,
            "file": r["file"],
            "line": r["line"],
            "col": r["col"],
            "status": r["status"],
            "error": errors.get(loc, ""),
            "sequence": ''.join(sequences.get(loc, [])),
        })
    # Collect all unique test files
    all_files = sorted(set(d["file"] for d in data))
    # Collect all dates for trend graph
    with open(HISTORY_FILE, encoding="utf-8") as f:
        history_lines = f.readlines()
    run_dates = [l[6:25] for l in history_lines if l.startswith("=====")]
    run_stats = []
    summary_re = re.compile(r"Total: (\d+) +Passed: (\d+) +Failed: (\d+) +Flaky: (\d+) +Skipped: (\d+) +Deleted: (\d+)")
    for l in history_lines:
        m = summary_re.search(l)
        if m:
            total, passed, failed, flaky, skipped, deleted = map(int, m.groups())
            run_stats.append({
                "date": run_dates[len(run_stats)] if len(run_stats)<len(run_dates) else "",
                "total": total,
                "passed": passed,
                "failed": failed,
                "flaky": flaky,
                "skipped": skipped,
                "deleted": deleted
            })
    # HTML/JS
    html = []
    html.append('<html><head><title>Playwright Test History</title>')
    html.append("<script src='https://cdn.jsdelivr.net/npm/chart.js'></script>")
    html.append("<style>.fail{color:red;} .pass{color:green;} .flaky{color:orange;} pre{background:#f8f8f8;padding:1em;} .err{background:#fee;white-space:pre-wrap;} table{border-collapse:collapse;} th,td{padding:4px 8px;} tr.selected{background:#eef;}</style>")
    html.append('</head><body>')
    html.append('<h1>Playwright Test History</h1>')
    html.append('<div>')
    html.append("  <label>Filter by file: <select id='fileFilter'><option value=''>All</option>")
    for f in all_files:
        html.append(f"<option value='{f}'>{f}</option>")
    html.append("</select></label>")
    html.append("  <label>Show: <select id='statusFilter'><option value=''>All</option><option value='fail'>Failed</option><option value='flaky'>Flaky</option></select></label>")
    html.append("  <label>Date range: <input type='date' id='dateFrom'> to <input type='date' id='dateTo'></label>")
    html.append("  <input type='text' id='searchBox' placeholder='Search location...'>")
    html.append('</div>')
    html.append('<canvas id="trendChart" width="600" height="200"></canvas>')
    html.append('<table border=1 cellpadding=4 cellspacing=0 id="testTable"><tr><th>Test Location</th><th>Status</th><th>Error</th><th>History</th></tr><tbody id="testTableBody"></tbody></table>')
    html.append('<div id="detailsModal" style="display:none;position:fixed;top:10%;left:10%;width:80%;height:80%;background:#fff;border:2px solid #888;overflow:auto;z-index:1000;padding:2em;"><button onclick="document.getElementById(\'detailsModal\').style.display=\'none\'">Close</button><div id="detailsContent"></div></div>')
    html.append('<button onclick="downloadJson()">Download JSON</button>')
    html.append('<script>')
    html.append(f"const data = {json.dumps(data)};")
    html.append("const parsed = JSON.parse(JSON.stringify(data));")
    html.append(f"const runStats = {json.dumps(run_stats)};")
    html.append('''
function renderTable() {
  const file = document.getElementById('fileFilter').value;
  const status = document.getElementById('statusFilter').value;
  const search = document.getElementById('searchBox').value.toLowerCase();
  const from = document.getElementById('dateFrom').value;
  const to = document.getElementById('dateTo').value;
  let rows = parsed.filter(r =>
    (!file || r.file === file) &&
    (!status || (status==='fail'?r.status==='✘':status==='flaky'?r.sequence.includes('✓')&&r.sequence.includes('✘'):true)) &&
    (!search || r.location.toLowerCase().includes(search))
  );
  let html = '';
  for (const r of rows) {
    html += `<tr onclick=\"showDetails('${r.location.replace(/'/g,'\\'')}', this)\"><td>${r.location}</td><td class='${r.status==='✓'?'pass':r.status==='✘'?'fail':isFlaky(r)?'flaky':''}'>${r.status}</td><td><div class='err'>${r.error}</div></td><td>${r.sequence}</td></tr>`;
  }
  document.getElementById('testTableBody').innerHTML = html;
}
function isFlaky(r) { return r.sequence.includes('✓') && r.sequence.includes('✘'); }
['fileFilter','statusFilter','searchBox','dateFrom','dateTo'].forEach(id=>{
  document.getElementById(id).oninput=renderTable;
  document.getElementById(id).onchange=renderTable;
});
renderTable();
function showDetails(loc, row) {
  const r = parsed.find(x=>x.location===loc);
  let html = `<h2>${loc}</h2>`;
  html += `<p>Status: <span class='${r.status==='✓'?'pass':r.status==='✘'?'fail':isFlaky(r)?'flaky':''}'>${r.status}</span></p>`;
  html += `<p>History: ${r.sequence}</p>`;
  html += `<pre class='err'>${r.error}</pre>`;
  html += `<a href='e2e/${r.file.split('/').pop()}' target='_blank'>View Source</a>`;
  document.getElementById('detailsContent').innerHTML = html;
  document.getElementById('detailsModal').style.display = 'block';
  document.querySelectorAll('tr.selected').forEach(tr=>tr.classList.remove('selected'));
  if(row) row.classList.add('selected');
}
// Download JSON
function downloadJson() { window.open("playwright-history.json"); }
// Trend chart
const ctx = document.getElementById('trendChart').getContext('2d');
const chart = new Chart(ctx, {
  type: 'line',
  data: {
    labels: runStats.map(x=>x.date),
    datasets: [
      {label:'Passed',data:runStats.map(x=>x.passed),borderColor:'green',fill:false},
      {label:'Failed',data:runStats.map(x=>x.failed),borderColor:'red',fill:false},
      {label:'Total',data:runStats.map(x=>x.total),borderColor:'gray',fill:false}
    ]
  },
  options: {responsive:true,plugins:{legend:{display:true}},onClick: (e,activeEls)=>{
    if(activeEls.length>0){
      const idx=activeEls[0].index;
      const date=runStats[idx].date;
      // Show failed tests for this date
      let failedLocs = [];
      if(parsed && parsed.length) {
        // This is a simple demo: in a real version, you'd track per-date failures
        failedLocs = parsed.filter(r=>r.status==='✘').map(r=>r.location);
      }
      alert('Failed tests on '+date+':\n'+failedLocs.join('\n'));
    }
  }}
});
''')
    html.append('<h2>Raw History</h2><pre>')
    with open(HISTORY_FILE, encoding="utf-8") as f:
        raw_history = f.read()
        html.append(html_escape_mod.escape(raw_history))
    html.append('</pre></body></html>')
    with open(HTML_FILE, "w", encoding="utf-8") as f:
        f.write('\n'.join(html))

def export_json_history(results, errors, sequences, run_stats):
    export = {
        "tests": results,
        "errors": errors,
        "sequences": sequences,
        "trend": run_stats
    }
    with open("scripts/playwright-history.json", "w", encoding="utf-8") as f:
        json.dump(export, f, indent=2)

# Helper: update the persistent test status/history JSON
def update_live_test_status(results):
    # Load or create the persistent JSON
    if JSON_FILE.exists():
        with open(JSON_FILE, encoding="utf-8") as f:
            db = json.load(f)
    else:
        db = {}
    # Update each test's status and history
    for r in results:
        loc = f'{r["file"]}:{r["line"]}:{r["col"]}'
        key = f'{r["file"]}::{r["title"]}' if "title" in r else loc
        entry = db.get(key, {"file": r["file"], "title": r.get("title", ""), "location": loc, "history": [], "last_status": "", "last_time": ""})
        entry["last_status"] = r["status"]
        entry["last_time"] = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        entry["history"] = (entry.get("history") or [])[-9:] + [r["status"]]
        db[key] = entry
    # Save back
    with open(JSON_FILE, "w", encoding="utf-8") as f:
        json.dump(db, f, indent=2)
    return db

def get_current_tests():
    import glob, os
    current_files = set()
    for path in glob.glob("e2e/*.spec.*[tj]s"):
        if os.path.isfile(path):
            current_files.add(path)
    return current_files

def write_live_file(db):
    # Prune deleted tests: keep all results for any present .spec.ts file
    current_files = get_current_tests()
    pruned_db = {k: v for k, v in db.items() if isinstance(v, dict) and v.get("file") in current_files}
    deleted = [v for k, v in db.items() if isinstance(v, dict) and v.get("file") not in current_files]
    # Group by file
    from collections import defaultdict
    by_file = defaultdict(list)
    for entry in pruned_db.values():
        by_file[entry["file"]].append(entry)
    lines = [f"# Playwright E2E Test Status (as of {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')})\n"]
    flaky = []
    failing = []
    passing = []
    skipped = []
    for file, tests in sorted(by_file.items()):
        lines.append(f"{file}")
        for t in sorted(tests, key=lambda x: x.get("title", x["location"])):
            hist = ''.join(t["history"])
            status = t["last_status"]
            mark = "✓" if status == "✓" else ("✘" if status == "✘" else "-")
            is_flaky = ("✓" in t["history"] and "✘" in t["history"])
            # Show title/description if available, else fallback to location
            title = t.get('title') or t.get('description') or t.get('location')
            if is_flaky:
                flaky.append((file, t))
            if status == "✘":
                failing.append((file, t))
            elif status == "✓":
                passing.append((file, t))
            elif status == "-":
                skipped.append((file, t))
            lines.append(f"  {mark} {title}   [{hist}]" + ("  [flaky]" if is_flaky else ""))
        lines.append("")
    # Longest streaks
    def streak(history, val):
        s = 0
        for x in reversed(history):
            if x == val:
                s += 1
            else:
                break
        return s
    longest_pass = max(pruned_db.values(), key=lambda t: streak(t["history"], "✓"), default=None)
    longest_fail = max(pruned_db.values(), key=lambda t: streak(t["history"], "✘"), default=None)
    # Summary
    lines.append(f"Summary: Total: {len(pruned_db)}  Passing: {len(passing)}  Failing: {len(failing)}  Flaky: {len(flaky)}  Skipped: {len(skipped)}  Deleted: {len(deleted)}\n")
    if longest_pass:
        lines.append(f"Longest passing streak: {longest_pass['file']}: {longest_pass.get('title', longest_pass['location'])} ({streak(longest_pass['history'], '✓')})")
    if longest_fail:
        lines.append(f"Longest failing streak: {longest_fail['file']}: {longest_fail.get('title', longest_fail['location'])} ({streak(longest_fail['history'], '✘')})")
    if flaky:
        lines.append("\nFlaky tests:")
        for file, t in flaky:
            lines.append(f"  {file}: {t.get('title', t['location'])}  [{''.join(t['history'])}]")
    if failing:
        lines.append("\nFailing tests:")
        for file, t in failing:
            lines.append(f"  {file}: {t.get('title', t['location'])}  [last: {t['last_status']}]")
    if deleted:
        lines.append("\nRecently deleted tests:")
        for t in deleted:
            if isinstance(t, dict):
                file = t.get('file', '?')
                title = t.get('title', t.get('location', '?'))
                last_time = t.get('last_time', '?')
                # Skip if both file and title/location are missing or empty
                if (not file or file == '?') and (not title or title == '?'):
                    continue
                lines.append(f"  {file}: {title} (last seen: {last_time})")
    with open(LIVE_FILE, "w", encoding="utf-8") as f:
        f.write('\n'.join(lines))

# Patch main to update live file after each run
def main():
    if not OUTPUT_FILE.exists():
        print(f"[WARN] {OUTPUT_FILE} does not exist.")
        return
    if OUTPUT_FILE.stat().st_size == 0:
        print(f"[WARN] {OUTPUT_FILE} is empty.")
        return
    print(f"[INFO] Processing {OUTPUT_FILE}...")
    results = parse_output_file(OUTPUT_FILE)
    # Enhanced summary logic
    total = len(results)
    passed = sum(1 for r in results if r["status"] == "✓")
    failed = sum(1 for r in results if r["status"] == "✘")
    skipped = sum(1 for r in results if r["status"] == "-")
    # Flaky: test with both ✓ and ✘ in history (from persistent JSON)
    db = update_live_test_status(results)
    flaky = 0
    flaky_titles = []
    failed_titles = []
    skipped_titles = []
    for k, v in db.items():
        if isinstance(v, dict):
            hist = v.get("history", [])
            if "✓" in hist and "✘" in hist:
                flaky += 1
                flaky_titles.append(f"{v.get('file','?')}: {v.get('title', v.get('location','?'))}")
            if v.get("last_status") == "✘":
                failed_titles.append(f"{v.get('file','?')}: {v.get('title', v.get('location','?'))}")
            if v.get("last_status") == "-":
                skipped_titles.append(f"{v.get('file','?')}: {v.get('title', v.get('location','?'))}")
    deleted = len([v for v in db.values() if isinstance(v, dict) and v.get("file") not in get_current_tests()])
    failed_locations = [f'{r["file"]}:{r["line"]}:{r["col"]}' for r in results if r["status"] == "✘"]
    append_history_summary(total, passed, failed, failed_locations, flaky, skipped, deleted, failed_titles, flaky_titles, skipped_titles)
    print(f"[INFO] Updated {HISTORY_FILE}.")
    errors = parse_error_blocks(OUTPUT_FILE)
    sequences = get_test_sequences_from_history(HISTORY_FILE)
    # Collect run_stats for export and chart
    with open(HISTORY_FILE, encoding="utf-8") as f:
        history_lines = f.readlines()
    run_dates = [l[6:25] for l in history_lines if l.startswith("=====") or l.startswith("=")]
    run_stats = []
    summary_re = re.compile(r"Total: (\d+) +Passed: (\d+) +Failed: (\d+) +Flaky: (\d+) +Skipped: (\d+) +Deleted: (\d+)")
    for l in history_lines:
        m = summary_re.search(l)
        if m:
            total, passed, failed, flaky, skipped, deleted = map(int, m.groups())
            run_stats.append({
                "date": run_dates[len(run_stats)] if len(run_stats)<len(run_dates) else "",
                "total": total,
                "passed": passed,
                "failed": failed,
                "flaky": flaky,
                "skipped": skipped,
                "deleted": deleted
            })
    export_json_history(results, errors, sequences, run_stats)
    generate_html_report_advanced(results, errors, sequences)
    print(f"[INFO] HTML and JSON reports updated.")
    write_live_file(db)
    print(f"[INFO] Live test status written to {LIVE_FILE}.")

if __name__ == "__main__":
    main()

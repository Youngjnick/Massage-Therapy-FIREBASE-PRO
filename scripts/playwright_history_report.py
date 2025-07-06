#!/usr/bin/env python3
import sys
import re
import datetime
from pathlib import Path
import json
import html as html_escape_mod

OUTPUT_FILE = Path("scripts/playwright-output.txt")
HISTORY_FILE = Path("scripts/playwright-output-history.txt")
HTML_FILE = Path("playwright-history.html")

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
    print(f"[DEBUG] Total matched results: {len(results)}")
    return results

def summarize_results(results):
    total = len(results)
    passed = sum(1 for r in results if r["status"] == "✓")
    failed = sum(1 for r in results if r["status"] == "✘")
    failed_locations = [f'{r["file"]}:{r["line"]}:{r["col"]}' for r in results if r["status"] == "✘"]
    return total, passed, failed, failed_locations

def append_history_summary(total, passed, failed, failed_locations):
    now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    output = ""
    if OUTPUT_FILE.exists():
        with open(OUTPUT_FILE, encoding="utf-8") as f:
            output = f.read()
    summary = f"""
===== {now} =====\nTotal: {total}\nPassed: {passed}\nFailed: {failed}\nFailed locations: {', '.join(failed_locations)}\n--- Full Playwright Output ---\n{output}\n--- End of Output ---\n"""
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
    for i, l in enumerate(history_lines):
        if l.startswith("Total: "):
            total = int(l.split(": ")[1])
            passed = int(history_lines[i+1].split(": ")[1]) if i+1 < len(history_lines) else 0
            failed = int(history_lines[i+2].split(": ")[1]) if i+2 < len(history_lines) else 0
            run_stats.append({"date": run_dates[len(run_stats)] if len(run_stats)<len(run_dates) else "", "total": total, "passed": passed, "failed": failed})
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
    with open("playwright-history.json", "w", encoding="utf-8") as f:
        json.dump(export, f, indent=2)

def main():
    if not OUTPUT_FILE.exists():
        print(f"[WARN] {OUTPUT_FILE} does not exist.")
        return
    if OUTPUT_FILE.stat().st_size == 0:
        print(f"[WARN] {OUTPUT_FILE} is empty.")
        return
    print(f"[INFO] Processing {OUTPUT_FILE}...")
    results = parse_output_file(OUTPUT_FILE)
    total, passed, failed, failed_locations = summarize_results(results)
    append_history_summary(total, passed, failed, failed_locations)
    print(f"[INFO] Updated {HISTORY_FILE}.")
    errors = parse_error_blocks(OUTPUT_FILE)
    sequences = get_test_sequences_from_history(HISTORY_FILE)
    # Collect run_stats for export and chart
    with open(HISTORY_FILE, encoding="utf-8") as f:
        history_lines = f.readlines()
    run_dates = [l[6:25] for l in history_lines if l.startswith("=====")]
    run_stats = []
    for i, l in enumerate(history_lines):
        if l.startswith("Total: "):
            total = int(l.split(": ")[1])
            passed = int(history_lines[i+1].split(": ")[1]) if i+1 < len(history_lines) else 0
            failed = int(history_lines[i+2].split(": ")[1]) if i+2 < len(history_lines) else 0
            run_stats.append({"date": run_dates[len(run_stats)] if len(run_stats)<len(run_dates) else "", "total": total, "passed": passed, "failed": failed})
    export_json_history(results, errors, sequences, run_stats)
    generate_html_report_advanced(results, errors, sequences)
    print(f"[INFO] HTML and JSON reports updated.")

if __name__ == "__main__":
    main()

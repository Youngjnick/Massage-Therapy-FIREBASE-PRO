import json
from pathlib import Path
import os
import datetime

def find_artifacts(test):
    # Try to find trace/screenshot files for this test
    # This is a simple heuristic: match by file and part of title
    test_dir = "test-results"
    file = test.get("file", "")
    title = (test.get("title") or "").replace(" ", "-")[:40]
    artifacts = []
    if not file:
        return artifacts
    # Look for trace.zip and .png in test-results
    for root, dirs, files in os.walk(test_dir):
        for f in files:
            if f.endswith("trace.zip") or f.endswith(".png"):
                if file.split("/")[-1].replace(".spec.ts", "") in f or title in f:
                    artifacts.append(os.path.join(root, f))
    return artifacts

def generate_html_report(db, output_path="scripts/reports/playwright-history.html"):
    # Only use dict values (skip lists or other types)
    # Collect all test entries, warn if any are skipped
    all_entries = list(db.items())
    tests = []
    skipped_keys = []
    for k, v in all_entries:
        if isinstance(v, dict) and ("file" in v or "location" in v):
            tests.append(v)
        else:
            skipped_keys.append(k)
    GITHUB_BASE = "https://github.com/youngjnick/Massage-Therapy-FIREBASE-PRO/blob/main/"
    html = []
    html.append('<html><head><title>Playwright Test History</title>')
    html.append("""
    <style>
    .fail{color:red;}
    .pass{color:green;}
    .flaky{color:orange;}
    .multicore-only{background: #ffe0e0;}
    .singlepass{background: #e0ffe0;}
    .summary{font-weight:bold;}
    table{border-collapse:collapse; width:100%;}
    th,td{padding:4px 8px;}
    tr.selected{background:#eef;}
    tr:hover{background:#f5f5ff;}
    #search{margin:10px 0;}
    .err-details,.hist-details{display:none;white-space:pre-wrap;background:#fee;padding:8px;border:1px solid #f99;max-width:600px;overflow-x:auto;}
    .show{display:block;}
    .artifacts{font-size:0.9em;}
    .history{font-size:0.9em;color:#888;}
    .expand-btn{background:none;border:none;cursor:pointer;font-size:1em;vertical-align:middle;}
    .sticky{position:sticky;top:0;background:#fff;z-index:2;}
    .copy-btn{margin-left:6px;font-size:0.9em;cursor:pointer;}
    .badge { display:inline-block; margin-right:6px; }
    .quick-actions { background:#f8f8ff; border:1px solid #ccc; padding:10px; margin-bottom:16px; }
    .legend { font-size:0.95em; color:#555; margin-bottom:10px; }
    @media (max-width: 800px) {
      table, thead, tbody, th, td, tr { display: block; }
      th, td { width: 100%; box-sizing: border-box; }
    }
    </style>
    """)
    html.append('</head><body>')
    html.append('<h1>Playwright Test History</h1>')
    # Badges and summary table (sticky summary)
    total = len(tests)
    def get_status(test):
        # Use last entry in history if available
        last_status = test.get("last_status")
        hist = test.get("history", [])
        if hist:
            last_hist = hist[-1]
            if last_hist in ("\u2713", "passed", "✅"): last_status = "passed"
            elif last_hist in ("\u2718", "failed", "❌"): last_status = "failed"
            elif last_hist in ("flaky", "⚠️"): last_status = "flaky"
            elif last_hist in ("skipped", "➖"): last_status = "skipped"
        return last_status
    def is_flaky(test):
        hist = test.get("history", [])
        return any(s in ("flaky", "⚠️") for s in hist) or ("passed" in hist and "failed" in hist)
    passing = sum(1 for t in tests if get_status(t) == "passed")
    failing = sum(1 for t in tests if get_status(t) == "failed")
    flaky = sum(1 for t in tests if is_flaky(t))
    skipped = sum(1 for t in tests if get_status(t) == "skipped")
    # Badges
    html.append('<div>')
    html.append(f'<img class="badge" src="https://img.shields.io/badge/Pass_Rate-{passing/total*100 if total else 0:.1f}%25-brightgreen.svg" alt="Pass Rate">')
    html.append(f'<img class="badge" src="https://img.shields.io/badge/Fail_Rate-{failing/total*100 if total else 0:.1f}%25-red.svg" alt="Fail Rate">')
    html.append(f'<img class="badge" src="https://img.shields.io/badge/Flaky-{flaky}-yellow.svg" alt="Flaky">')
    html.append(f'<img class="badge" src="https://img.shields.io/badge/Skipped-{skipped}-lightgrey.svg" alt="Skipped">')
    html.append('</div>')
    # Summary table
    html.append('<table style="margin:10px 0; width:auto; font-size:1em;"><tr><th>Total</th><th>Passed</th><th>Failed</th><th>Flaky</th><th>Skipped</th></tr>')
    html.append(f'<tr><td>{total}</td><td>{passing}</td><td>{failing}</td><td>{flaky}</td><td>{skipped}</td></tr></table>')
    # Last updated
    html.append(f'<div style="font-size:0.95em; color:#888; margin-bottom:10px;">Last updated: {datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")}</div>')
    # Legend/key
    html.append('<div class="legend">Legend: ✅ Pass | ❌ Fail | ⚠️ Flaky | ➖ Skipped | 🚩 Slowest | <b>VSCode</b> links open file locally | <b>Copy</b> = copy rerun command</div>')
    # Quick Actions for failed/flaky
    quick = [t for t in tests if get_status(t) in ("failed", "flaky")]
    if quick:
        html.append('<div class="quick-actions"><b>Quick Actions:</b><ul>')
        for t in quick:
            loc = t.get("location", "?")
            name = t.get("title") or t.get("description") or loc
            file_link = None
            rerun_cmd = None
            if ":" in loc:
                parts = loc.split(":")
                if len(parts) >= 3:
                    file_part = parts[0]
                    line_part = parts[1]
                    file_link = f"vscode://file/{file_part}:{line_part}"
                    rerun_cmd = f"npx playwright test {file_part} --line {line_part}"
            html.append('<li>')
            if file_link:
                html.append(f'<a href="{file_link}"><b>VSCode</b></a> | ')
            html.append(f'<b>{name}</b>')
            if rerun_cmd:
                html.append(f' <button class="copy-btn" onclick="navigator.clipboard.writeText(\'{rerun_cmd}\');this.textContent=\'Copied!\';setTimeout(()=>this.textContent=\'Copy\',1200);">Copy</button> <code>{rerun_cmd}</code>')
            html.append('</li>')
        html.append('</ul></div>')
    # Filters and search
    html.append('<div>')
    html.append('<label>Status: <select id="statusFilter"><option value="">All</option><option value="pass">Passing</option><option value="fail">Failing</option><option value="flaky">Flaky</option><option value="multicore">Multicore-only</option></select></label>')
    html.append('<input type="text" id="search" placeholder="Search test name or file...">')
    html.append('</div>')
    # Multicore-only failures section
    multicore_only = [t for t in tests if "results_by_worker_mode" in t and "single" in t["results_by_worker_mode"] and "multi" in t["results_by_worker_mode"] and ("✗" in t["results_by_worker_mode"]["multi"]) and all(x == "✓" for x in t["results_by_worker_mode"]["single"] if x in ("✓", "✗"))]
    if multicore_only:
        html.append('<h2>Multicore-Only Failures</h2><ul>')
        for t in multicore_only:
            file_path = t.get("file", "")
            file_link = f'<a href="{GITHUB_BASE}{file_path}" target="_blank">{file_path}</a>' if file_path else ""
            html.append(f'<li class="multicore-only">{t.get("location", "?")}: ✗(multi) ✓(single) {t.get("title") or t.get("description") or t.get("location")} {file_link}</li>')
        html.append('</ul>')
    # Table of all tests
    html.append('<h2>All Tests</h2>')
    html.append('<div style="margin:8px 0;">'
        '<button onclick="expandAllErrs()">Expand all errors</button>'
        '<button onclick="collapseAllErrs()">Collapse all errors</button>'
        '<button onclick="expandAllHists()">Expand all history</button>'
        '<button onclick="collapseAllHists()">Collapse all history</button>'
        '</div>')
    html.append('<table border=1 id="testTable"><tr>'
        '<th class="sticky" onclick="sortTable(0)">Test</th>'
        '<th class="sticky" onclick="sortTable(1)">Status</th>'
        '<th class="sticky" onclick="sortTable(2)">Single</th>'
        '<th class="sticky" onclick="sortTable(3)">Multi</th>'
        '<th class="sticky" onclick="sortTable(4)">Flaky</th>'
        '<th class="sticky" onclick="sortTable(5)">Source</th>'
        '<th class="sticky" onclick="sortTable(6)">Artifacts</th>'
        '<th class="sticky" onclick="sortTable(7)">Error</th>'
        '<th class="sticky" onclick="sortTable(8)">History</th>'
        '<th class="sticky" onclick="sortTable(9)">Duration</th>'
        '</tr>')
    for idx, t in enumerate(tests):
        status = get_status(t)
        loc = t.get("location", "?")
        title = t.get("title") or t.get("description") or loc
        rbwm = t.get("results_by_worker_mode", {})
        single = rbwm.get("single", [])
        multi = rbwm.get("multi", [])
        single_str = f"{' '.join(single)}" if single else "-"
        multi_str = f"{' '.join(multi)}" if multi else "-"
        is_flaky_row = is_flaky(t)
        row_class = "flaky" if is_flaky_row else ("fail" if status == "failed" else "pass")
        if t in multicore_only:
            row_class += " multicore-only"
        file_path = t.get("file", "")
        # VSCode local file link and rerun command
        file_link = None
        rerun_cmd = None
        if ":" in loc:
            parts = loc.split(":")
            if len(parts) >= 3:
                file_part = parts[0]
                line_part = parts[1]
                file_link = f"vscode://file/{file_part}:{line_part}"
                rerun_cmd = f"npx playwright test {file_part} --line {line_part}"
        # Artifacts
        artifacts = find_artifacts(t)
        artifact_links = " ".join([f'<a href="{a}" target="_blank">{os.path.basename(a)}</a>' for a in artifacts]) if artifacts else ""
        # Error details (expand/collapse)
        err = t.get("error", "")
        err_btn = f'<button class="expand-btn" aria-expanded="false" aria-controls="err{idx}" onclick="toggleErr({idx}, this)">▶</button>' if err else ""
        err_div = f'<div class="err-details" id="err{idx}" tabindex="0">{err}<button class="copy-btn" onclick="copyErr({idx}, event)">Copy</button></div>' if err else ""
        # History details (expand/collapse)
        hist = t.get("history", [])
        hist_btn = f'<button class="expand-btn" aria-expanded="false" aria-controls="hist{idx}" onclick="toggleHist({idx}, this)">▶</button>' if hist else ""
        hist_div = f'<div class="hist-details" id="hist{idx}" tabindex="0">{" ".join(hist)}</div>' if hist else ""
        # Duration and slowest highlighting
        avg_duration = t.get("avg_duration")
        last_duration = t.get("last_duration")
        duration_str = f"{last_duration or '-'} / {avg_duration or '-'}"
        # Highlight slowest (top 3 by avg_duration)
        slow_marker = " 🚩" if avg_duration and avg_duration == max([tt.get('avg_duration', 0) for tt in tests if tt.get('avg_duration')]) else ""
        # Test column: clickable local link, rerun command, slow marker
        test_col = title
        if file_link:
            test_col = f'<a href="{file_link}">{title}</a>'
        if rerun_cmd:
            test_col += f'<br><button class="copy-btn" onclick="navigator.clipboard.writeText(\'{rerun_cmd}\');this.textContent=\'Copied!\';setTimeout(()=>this.textContent=\'Copy\',1200);">Copy</button> <code>{rerun_cmd}</code>'
        test_col += slow_marker
        # Source column: GitHub link
        github_link = f'<a href="{GITHUB_BASE}{file_path}" target="_blank">{file_path}</a>' if file_path else ""
        html.append(f'<tr class="{row_class}"><td title="{title}">{test_col}</td><td>{status}</td><td>{single_str}</td><td>{multi_str}</td><td>{"flaky" if is_flaky_row else ""}</td><td>{github_link}</td><td class="artifacts">{artifact_links}</td><td style="min-width:90px;">{err_btn}{err_div}</td><td style="min-width:90px;">{hist_btn}{hist_div}</td><td>{duration_str}</td></tr>')
    html.append('</table>')
    # Total test entries and skipped warning
    html.append(f'<div style="font-size:0.95em; color:#888; margin-bottom:10px;">Total test entries in JSON: {len(all_entries)} | Rendered: {len(tests)}')
    if skipped_keys:
        html.append(f' | <span style="color:#c00">Skipped: {len(skipped_keys)} ({", ".join(str(k) for k in skipped_keys)})</span>')
    html.append('</div>')
    # JS for filtering/search, error toggle, and sorting
    html.append('''<script>
const table = document.getElementById('testTable');
const statusFilter = document.getElementById('statusFilter');
const searchBox = document.getElementById('search');
function filterTable() {
  const status = statusFilter.value;
  const search = searchBox.value.toLowerCase();
  for (let i = 1; i < table.rows.length; i++) {
    const row = table.rows[i];
    let show = true;
    if (status) {
      if (status === 'flaky' && !row.classList.contains('flaky')) show = false;
      if (status === 'fail' && !row.classList.contains('fail')) show = false;
      if (status === 'pass' && !row.classList.contains('pass')) show = false;
      if (status === 'multicore' && !row.classList.contains('multicore-only')) show = false;
    }
    if (search && !row.cells[0].textContent.toLowerCase().includes(search) && !row.cells[5].textContent.toLowerCase().includes(search)) {
      show = false;
    }
    row.style.display = show ? '' : 'none';
  }
}
statusFilter.oninput = searchBox.oninput = filterTable;
function toggleErr(idx, btn) {
  var d = document.getElementById('err'+idx);
  if (d) {
    d.classList.toggle('show');
    if (btn) {
      let expanded = d.classList.contains('show');
      btn.setAttribute('aria-expanded', expanded);
      btn.textContent = expanded ? '▼' : '▶';
    }
  }
}
function toggleHist(idx, btn) {
  var d = document.getElementById('hist'+idx);
  if (d) {
    d.classList.toggle('show');
    if (btn) {
      let expanded = d.classList.contains('show');
      btn.setAttribute('aria-expanded', expanded);
      btn.textContent = expanded ? '▼' : '▶';
    }
  }
}
function expandAllErrs() {
  let i = 0; while (true) {
    let d = document.getElementById('err'+i);
    let btn = document.querySelector('button[aria-controls="err'+i+'"]');
    if (!d) break;
    d.classList.add('show');
    if (btn) { btn.setAttribute('aria-expanded', true); btn.textContent = '▼'; }
    i++;
  }
}
function collapseAllErrs() {
  let i = 0; while (true) {
    let d = document.getElementById('err'+i);
    let btn = document.querySelector('button[aria-controls="err'+i+'"]');
    if (!d) break;
    d.classList.remove('show');
    if (btn) { btn.setAttribute('aria-expanded', false); btn.textContent = '▶'; }
    i++;
  }
}
function expandAllHists() {
  let i = 0; while (true) {
    let d = document.getElementById('hist'+i);
    let btn = document.querySelector('button[aria-controls="hist'+i+'"]');
    if (!d) break;
    d.classList.add('show');
    if (btn) { btn.setAttribute('aria-expanded', true); btn.textContent = '▼'; }
    i++;
  }
}
function collapseAllHists() {
  let i = 0; while (true) {
    let d = document.getElementById('hist'+i);
    let btn = document.querySelector('button[aria-controls="hist'+i+'"]');
    if (!d) break;
    d.classList.remove('show');
    if (btn) { btn.setAttribute('aria-expanded', false); btn.textContent = '▶'; }
    i++;
  }
}
function copyErr(idx, event) {
  event.stopPropagation();
  var d = document.getElementById('err'+idx);
  if (d) {
    let text = d.textContent.replace('Copy','').trim();
    navigator.clipboard.writeText(text);
    let btn = d.querySelector('.copy-btn');
    if (btn) {
      btn.textContent = 'Copied!';
      setTimeout(()=>{btn.textContent='Copy';}, 1200);
    }
  }
}
// Sorting
let sortDir = 1;
let lastSortCol = -1;
function sortTable(n) {
  let switching = true;
  let rows, i, x, y, shouldSwitch;
  while (switching) {
    switching = false;
    rows = table.rows;
    for (i = 1; i < (rows.length - 1); i++) {
      shouldSwitch = false;
      x = rows[i].cells[n].textContent.toLowerCase();
      y = rows[i + 1].cells[n].textContent.toLowerCase();
      if (n === lastSortCol) {
        if ((sortDir === 1 && x > y) || (sortDir === -1 && x < y)) {
          shouldSwitch = true;
          break;
        }
      } else {
        if (x > y) {
          shouldSwitch = true;
          break;
        }
      }
    }
    if (shouldSwitch) {
      rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
      switching = true;
    }
  }
  if (n === lastSortCol) {
    sortDir = -sortDir;
  } else {
    sortDir = 1;
    lastSortCol = n;
  }
}
</script>''')
    html.append('</body></html>')
    with open(output_path, "w", encoding="utf-8") as f:
        f.write('\n'.join(html))

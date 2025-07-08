import json
from pathlib import Path
import os

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
    tests = [v for v in db.values() if isinstance(v, dict)]
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
    @media (max-width: 800px) {
      table, thead, tbody, th, td, tr { display: block; }
      th, td { width: 100%; box-sizing: border-box; }
    }
    </style>
    """)
    html.append('</head><body>')
    html.append('<h1>Playwright Test History</h1>')
    # Summary
    total = len(tests)
    passing = sum(1 for t in tests if t.get("last_status") == "✓")
    failing = sum(1 for t in tests if t.get("last_status") == "✗")
    flaky = sum(1 for t in tests if "✓" in t.get("history", []) and "✗" in t.get("history", []))
    multicore_only = [t for t in tests if "results_by_worker_mode" in t and "single" in t["results_by_worker_mode"] and "multi" in t["results_by_worker_mode"] and ("✗" in t["results_by_worker_mode"]["multi"]) and all(x == "✓" for x in t["results_by_worker_mode"]["single"] if x in ("✓", "✗"))]
    html.append(f'<div class="summary">Total: {total} | Passing: {passing} | Failing: {failing} | Flaky: {flaky} | Multicore-only failures: {len(multicore_only)}</div>')
    # Filters and search
    html.append('<div>')
    html.append('<label>Status: <select id="statusFilter"><option value="">All</option><option value="pass">Passing</option><option value="fail">Failing</option><option value="flaky">Flaky</option><option value="multicore">Multicore-only</option></select></label>')
    html.append('<input type="text" id="search" placeholder="Search test name or file...">')
    html.append('</div>')
    # Multicore-only failures section
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
        '</tr>')
    for idx, t in enumerate(tests):
        loc = t.get("location", "?")
        title = t.get("title") or t.get("description") or loc
        last = t.get("last_status", "-")
        rbwm = t.get("results_by_worker_mode", {})
        single = rbwm.get("single", [])
        multi = rbwm.get("multi", [])
        single_str = f"{' '.join(single)}" if single else "-"
        multi_str = f"{' '.join(multi)}" if multi else "-"
        is_flaky = ("✓" in t.get("history", []) and "✗" in t.get("history", []))
        row_class = "flaky" if is_flaky else ("fail" if last == "✗" else "pass")
        if t in multicore_only:
            row_class += " multicore-only"
        file_path = t.get("file", "")
        file_link = f'<a href="{GITHUB_BASE}{file_path}" target="_blank">{file_path}</a>' if file_path else ""
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
        html.append(f'<tr class="{row_class}"><td title="{title}">{title}</td><td>{last}</td><td>{single_str}</td><td>{multi_str}</td><td>{"flaky" if is_flaky else ""}</td><td>{file_link}</td><td class="artifacts">{artifact_links}</td><td style="min-width:90px;">{err_btn}{err_div}</td><td style="min-width:90px;">{hist_btn}{hist_div}</td></tr>')
    html.append('</table>')
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

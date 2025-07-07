import json
from pathlib import Path

def generate_html_report(db, output_path="playwright-history.html"):
    # Only use dict values (skip lists or other types)
    tests = [v for v in db.values() if isinstance(v, dict)]
    GITHUB_BASE = "https://github.com/youngjnick/Massage-Therapy-FIREBASE-PRO/blob/main/"
    html = []
    html.append('<html><head><title>Playwright Test History</title>')
    html.append("<style>.fail{color:red;} .pass{color:green;} .flaky{color:orange;} .multicore-only{background: #ffe0e0;} .singlepass{background: #e0ffe0;} .summary{font-weight:bold;} table{border-collapse:collapse;} th,td{padding:4px 8px;} tr.selected{background:#eef;} #search{margin:10px 0;}</style>")
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
    html.append('<table border=1 id="testTable"><tr><th>Test</th><th>Status</th><th>Single</th><th>Multi</th><th>Flaky</th><th>Source</th></tr>')
    for t in tests:
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
        html.append(f'<tr class="{row_class}"><td>{title}</td><td>{last}</td><td>{single_str}</td><td>{multi_str}</td><td>{"flaky" if is_flaky else ""}</td><td>{file_link}</td></tr>')
    html.append('</table>')
    # JS for filtering/search
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
</script>''')
    html.append('</body></html>')
    with open(output_path, "w", encoding="utf-8") as f:
        f.write('\n'.join(html))

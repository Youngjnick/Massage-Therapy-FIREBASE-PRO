import json
import datetime
from pathlib import Path

JSON_FILE = Path("scripts/playwright-history.json")

def update_live_test_status(results, worker_mode=None):
    if JSON_FILE.exists():
        with open(JSON_FILE, encoding="utf-8") as f:
            db = json.load(f)
    else:
        db = {}
    for r in results:
        loc = f'{r["file"]}:{r["line"]}:{r["col"]}'
        key = f'{r["file"]}::{r["title"]}' if "title" in r else loc
        entry = db.get(key, {"file": r["file"], "title": r.get("title", ""), "location": loc, "history": [], "last_status": "", "last_time": "", "results_by_worker_mode": {}})
        entry["last_status"] = r["status"]
        entry["last_time"] = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        entry["history"] = (entry.get("history") or [])[-9:] + [r["status"]]
        if worker_mode:
            rbwm = entry.get("results_by_worker_mode", {})
            rbwm.setdefault(worker_mode, [])
            rbwm[worker_mode] = (rbwm[worker_mode][-9:] if rbwm[worker_mode] else []) + [r["status"]]
            entry["results_by_worker_mode"] = rbwm
        db[key] = entry
    with open(JSON_FILE, "w", encoding="utf-8") as f:
        json.dump(db, f, indent=2)
    return db

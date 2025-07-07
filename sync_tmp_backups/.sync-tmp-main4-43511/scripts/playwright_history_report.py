#!/usr/bin/env python3
import sys
from playwright_report import parse, db, report_txt, report_html
import argparse
from pathlib import Path

OUTPUT_FILE = Path("scripts/reports/playwright-output.txt")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--worker-mode', choices=['single', 'multi'], default=None, help='Worker mode: single or multi')
    args = parser.parse_args()

    results = parse.parse_output_file(OUTPUT_FILE)
    db_obj = db.update_live_test_status(results, worker_mode=args.worker_mode)

    # For demo, just pass empty run_stats (should be loaded from history for full implementation)
    run_stats = []
    report_txt.write_txt_summary(db_obj, run_stats)
    print("[INFO] Markdown summary written.")
    report_html.generate_html_report(db_obj)
    print("[INFO] HTML summary written.")

if __name__ == "__main__":
    main()

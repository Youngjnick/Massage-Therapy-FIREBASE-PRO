import re

def parse_output_file(output_file):
    results = []
    with open(output_file, encoding="utf-8") as f:
        lines = list(f)
        for line in lines:
            m = re.match(r'^\s*([✓✘])\s+\d+\s+\[.*?\]\s+›\s+([\w/\.-]+\.spec\.[tj]s):(\d+):(\d+)', line)
            if m:
                status, file, line_num, col_num = m.groups()
                results.append({
                    "status": status,
                    "file": file,
                    "line": int(line_num),
                    "col": int(col_num),
                    "raw": line.strip()
                })
    return results

def parse_error_blocks(output_file):
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
            error_lines = []
            i += 1
            while i < len(lines) and (lines[i].startswith('    ') or lines[i].startswith('  ')):
                error_lines.append(lines[i].strip())
                i += 1
            errors[key] = '\n'.join(error_lines)
        else:
            i += 1
    return errors

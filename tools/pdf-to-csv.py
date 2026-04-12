#!/usr/bin/env python3
"""
PDF Change Plan Converter for AdoptIQ
Extracts Impact Assessment, Gap Analysis, and Stakeholder tables from OCM Change Plan PDFs.
Outputs clean CSVs ready for import.

Usage: python3 tools/pdf-to-csv.py <path-to-pdf>
"""

import sys
import os
import csv
import json

try:
    import fitz  # PyMuPDF
except ImportError:
    print("Error: PyMuPDF not installed. Run: pip3 install pymupdf")
    sys.exit(1)

def extract_tables(pdf_path):
    """Extract all tables from PDF using PyMuPDF's table detection."""
    doc = fitz.open(pdf_path)
    all_tables = []

    for page_num in range(doc.page_count):
        page = doc[page_num]
        tables = page.find_tables()
        if not tables or not tables.tables:
            continue
        for tbl in tables.tables:
            data = tbl.extract()
            if len(data) >= 2:
                all_tables.append({
                    'page': page_num + 1,
                    'rows': data,
                    'cols': tbl.col_count
                })

    doc.close()
    return all_tables


def classify_table(headers):
    """Classify a table by its headers to determine import target."""
    h_lower = [h.lower().replace('\n', ' ').strip() if h else '' for h in headers]
    h_text = ' '.join(h_lower)

    # Impact Assessment / Gap Analysis table
    if any(k in h_text for k in ['topic description', 'business need', 'users impact', 'system impact', 'identified gap']):
        return 'impact_gaps'
    if any(k in h_text for k in ['change/ topic', 'change/topic']):
        return 'impact_gaps'

    # Stakeholder matrix
    if 'stakeholder' in h_text and any(k in h_text for k in ['interests', 'influence', 'needs', 'expectations']):
        return 'stakeholders'

    return 'unknown'


def clean_cell(text):
    """Clean a cell value — collapse whitespace, strip."""
    if not text:
        return ''
    return ' '.join(text.replace('\n', ' ').split()).strip()


def merge_continuation_rows(rows, headers):
    """Merge rows where the first column is empty (continuation of previous row)."""
    merged = []
    for row in rows:
        # Check if this is a continuation row (first col empty or None)
        first_col = clean_cell(row[0]) if row[0] else ''
        if not first_col and merged:
            # Merge into previous row
            prev = merged[-1]
            for i, cell in enumerate(row):
                if cell and clean_cell(cell):
                    if i < len(prev):
                        prev[i] = (prev[i] + ' ' + clean_cell(cell)).strip()
        else:
            merged.append([clean_cell(c) for c in row])
    return merged


def extract_impact_gaps(tables):
    """Extract impact assessment and gap analysis data from classified tables."""
    impacts = []
    gaps = []

    for tbl in tables:
        headers = tbl['rows'][0]
        if classify_table(headers) != 'impact_gaps':
            continue

        # Normalize headers
        h_map = {}
        for i, h in enumerate(headers):
            h_clean = clean_cell(h).lower() if h else ''
            if 'topic' in h_clean or 'change' in h_clean:
                h_map['topic'] = i
            elif 'business need' in h_clean:
                h_map['business_need'] = i
            elif 'users impact' in h_clean:
                h_map['users_impact'] = i
            elif 'system impact' in h_clean:
                h_map['system_impact'] = i
            elif 'gap' in h_clean:
                h_map['gaps'] = i
            elif 'stakeholder' in h_clean:
                h_map['stakeholder'] = i

        data_rows = merge_continuation_rows(tbl['rows'][1:], headers)

        for row in data_rows:
            topic = row[h_map.get('topic', 0)] if h_map.get('topic') is not None and h_map['topic'] < len(row) else ''
            if not topic:
                continue

            business_need = row[h_map['business_need']] if h_map.get('business_need') is not None and h_map['business_need'] < len(row) else ''
            users_impact = row[h_map['users_impact']] if h_map.get('users_impact') is not None and h_map['users_impact'] < len(row) else ''
            system_impact = row[h_map['system_impact']] if h_map.get('system_impact') is not None and h_map['system_impact'] < len(row) else ''
            gap_text = row[h_map['gaps']] if h_map.get('gaps') is not None and h_map['gaps'] < len(row) else ''
            stakeholder = row[h_map['stakeholder']] if h_map.get('stakeholder') is not None and h_map['stakeholder'] < len(row) else ''

            # Add as impact group
            impacts.append({
                'Group Name': topic,
                'Impact Level': 'High',
                'Current State': business_need[:500] if business_need else '',
                'Future State': users_impact[:500] if users_impact else '',
                'Change Type': 'Process'
            })

            # Add as gap if gap text exists
            if gap_text:
                gaps.append({
                    'Description': f"{topic}: {gap_text}" if topic else gap_text,
                    'Severity': 'High',
                    'Training Impact': system_impact[:500] if system_impact else '',
                    'Status': 'Open'
                })

    return impacts, gaps


def extract_stakeholders(tables):
    """Extract stakeholder matrix data from classified tables."""
    stakeholders = []

    for tbl in tables:
        headers = tbl['rows'][0]
        if classify_table(headers) != 'stakeholders':
            continue

        h_map = {}
        for i, h in enumerate(headers):
            h_clean = clean_cell(h).lower() if h else ''
            if 'stakeholder' in h_clean:
                h_map['name'] = i
            elif 'interest' in h_clean:
                h_map['interests'] = i
            elif 'influence' in h_clean:
                h_map['influence'] = i
            elif 'need' in h_clean:
                h_map['needs'] = i
            elif 'expectation' in h_clean:
                h_map['expectations'] = i

        data_rows = merge_continuation_rows(tbl['rows'][1:], headers)

        for row in data_rows:
            name = row[h_map.get('name', 0)] if h_map.get('name') is not None and h_map['name'] < len(row) else ''
            if not name or 'key stakeholder' in name.lower():
                continue  # Skip section headers

            interests = row[h_map['interests']] if h_map.get('interests') is not None and h_map['interests'] < len(row) else ''
            influence = row[h_map['influence']] if h_map.get('influence') is not None and h_map['influence'] < len(row) else ''
            needs = row[h_map['needs']] if h_map.get('needs') is not None and h_map['needs'] < len(row) else ''
            expectations = row[h_map['expectations']] if h_map.get('expectations') is not None and h_map['expectations'] < len(row) else ''

            stakeholders.append({
                'Stakeholder': name,
                'Role': interests,
                'Influence': influence,
                'Needs': needs,
                'Expectations': expectations
            })

    return stakeholders


def write_csv(data, filename, fieldnames):
    """Write a list of dicts to CSV."""
    if not data:
        print(f"  ⊘ No data for {filename}")
        return
    with open(filename, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(data)
    print(f"  ✓ {filename} — {len(data)} rows")


def main():
    if len(sys.argv) < 2:
        print("Usage: python3 tools/pdf-to-csv.py <path-to-pdf>")
        sys.exit(1)

    pdf_path = sys.argv[1]
    if not os.path.exists(pdf_path):
        print(f"Error: File not found: {pdf_path}")
        sys.exit(1)

    base = os.path.splitext(os.path.basename(pdf_path))[0]
    out_dir = os.path.dirname(pdf_path) or '.'

    print(f"\nExtracting tables from: {os.path.basename(pdf_path)}")
    print("=" * 50)

    tables = extract_tables(pdf_path)
    print(f"Found {len(tables)} tables across all pages\n")

    # Classify and extract
    impacts, gaps = extract_impact_gaps(tables)
    stakeholders = extract_stakeholders(tables)

    print("Generating CSVs:")
    write_csv(impacts, os.path.join(out_dir, f"{base} — Impact Assessment.csv"),
              ['Group Name', 'Impact Level', 'Current State', 'Future State', 'Change Type'])
    write_csv(gaps, os.path.join(out_dir, f"{base} — Gap Analysis.csv"),
              ['Description', 'Severity', 'Training Impact', 'Status'])
    write_csv(stakeholders, os.path.join(out_dir, f"{base} — Stakeholders.csv"),
              ['Stakeholder', 'Role', 'Influence', 'Needs', 'Expectations'])

    print(f"\nDone! Import the CSVs into AdoptIQ using the Import button.")


if __name__ == '__main__':
    main()

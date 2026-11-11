#!/usr/bin/env python3
"""Import the public reading sheet without requiring Google requests by visitors."""
import argparse
import csv
from collections import Counter
from datetime import date
import io
import json
from pathlib import Path
from urllib.request import urlopen

SOURCE = 'https://docs.google.com/spreadsheets/d/13f8iDJDGdD8f8blAMoJfE5ofbr4PyAroc4fmHpjCRPs'
ROOT = Path(__file__).resolve().parents[1]


def parse_books(text):
    rows = csv.reader(io.StringIO(text.lstrip('\ufeff')))
    header = next(rows)
    start = header.index('Name of the book')
    expected = ['Name of the book', 'Category', 'Author(s)', 'Score (out of 10)', 'Year published', 'Read in']
    if header[start:start + 6] != expected:
        raise ValueError('The reading sheet columns changed; review the importer before updating.')
    books = []
    for row_number, row in enumerate(rows, start=2):
        if len(row) <= start or not row[start].strip():
            continue
        try:
            title, category, authors, score, published, read = [v.strip() for v in row[start:start + 6]]
            score = float(score)
            read, published = int(read), int(published)
            if not (title and category and authors and 0 <= score <= 10 and 1000 <= read <= 9999):
                raise ValueError('Missing or invalid book details')
        except (ValueError, TypeError) as error:
            raise ValueError(f'Invalid book details on sheet row {row_number}: {error}') from error
        books.append(dict(title=title, category=category, authors=authors, score=score,
                          published_year=published, read_year=read, source_row=row_number))
    if not books:
        raise ValueError('No books found; refusing to replace the current snapshot.')
    return sorted(books, key=lambda b: (b['read_year'], b['source_row']), reverse=True)


def make_snapshot(books):
    categories = Counter(book['category'] for book in books)
    years = Counter(book['read_year'] for book in books)
    return dict(source=SOURCE + '/edit?usp=sharing', updated=date.today().isoformat(), books=books,
                stats=dict(entries=len(books), distinct_titles=len({b['title'].casefold() for b in books}),
                           perfect_scores=sum(b['score'] == 10 for b in books),
                           average_score=round(sum(b['score'] for b in books) / len(books), 1),
                           categories=[dict(name=name, count=count) for name, count in sorted(categories.items())],
                           years=[dict(year=year, count=count) for year, count in sorted(years.items(), reverse=True)]))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--csv-file', type=Path, help='Read an existing CSV instead of downloading the public sheet')
    args = parser.parse_args()
    if args.csv_file:
        text = args.csv_file.read_text(encoding='utf-8')
    else:
        with urlopen(SOURCE + '/export?format=csv', timeout=30) as response:
            text = response.read(2_000_001).decode('utf-8')
        if len(text) > 2_000_000:
            raise ValueError('Unexpectedly large response; the snapshot was not updated.')
    snapshot = make_snapshot(parse_books(text))
    output = ROOT / 'data/reading.json'
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(snapshot, ensure_ascii=False, indent=2) + '\n')
    print(f"Imported {snapshot['stats']['entries']} entries in {len(snapshot['stats']['categories'])} categories to {output.relative_to(ROOT)}")


if __name__ == '__main__':
    main()

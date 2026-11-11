"""Check reading-sheet imports and derived statistics without network access."""
import importlib.util
import json
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('reading_import', ROOT / 'scripts/sync-reading-list.py')
reading = importlib.util.module_from_spec(spec)
spec.loader.exec_module(reading)

HEADER = 'Category,Books By Category,,Name of the book,Category,Author(s),Score (out of 10),Year published,Read in\n'


class ReadingImportTests(unittest.TestCase):
    def test_ignores_sheet_summary_and_preserves_repeat_entries(self):
        books = reading.parse_books(HEADER +
            'Business,999,,A book,Tech,A writer,10,2020,2024\n' +
            'TOTAL:,999,,A book,Tech,A writer,8,2020,2025\n' +
            'Biography,99,,Ancient text,Fun,Another writer,9,-400,2023\n')
        snapshot = reading.make_snapshot(books)
        self.assertEqual(snapshot['stats']['entries'], 3)
        self.assertEqual(snapshot['stats']['distinct_titles'], 2)
        self.assertEqual(snapshot['stats']['perfect_scores'], 1)
        self.assertEqual(snapshot['stats']['average_score'], 9)
        self.assertEqual(snapshot['stats']['categories'], [{'name': 'Fun', 'count': 1}, {'name': 'Tech', 'count': 2}])
        self.assertEqual(books[0]['read_year'], 2025)
        self.assertEqual(books[-1]['published_year'], -400)

    def test_rejects_invalid_rows_instead_of_publishing_bad_statistics(self):
        for score in ['11', '-1', 'NaN', 'not a number']:
            with self.subTest(score=score), self.assertRaisesRegex(ValueError, 'sheet row 2'):
                reading.parse_books(HEADER + f',,,A book,Tech,A writer,{score},2020,2025\n')
        with self.assertRaisesRegex(ValueError, 'No books'):
            reading.parse_books(HEADER)
        with self.assertRaises(ValueError):
            reading.parse_books('Title,Author\nA book,A writer\n')

    def test_snapshot_statistics_match_the_imported_entries(self):
        snapshot = json.loads((ROOT / 'data/reading.json').read_text())
        recomputed = reading.make_snapshot(snapshot['books'])
        self.assertEqual(snapshot['stats'], recomputed['stats'])
        self.assertEqual(sum(c['count'] for c in snapshot['stats']['categories']), len(snapshot['books']))
        self.assertEqual(sum(y['count'] for y in snapshot['stats']['years']), len(snapshot['books']))


if __name__ == '__main__':
    unittest.main()

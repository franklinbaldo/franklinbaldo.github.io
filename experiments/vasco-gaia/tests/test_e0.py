import importlib.util
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
def load(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module
r = load('runner', ROOT / 'experiments/vasco-gaia/run.py')
h = load('harvester', ROOT / 'tools/experiment_harvest.py')
HEADER = b'source_id,plate_id,scan_id,gaiaedr3_id,sextractor_flags\n'
RAW = HEADER + b'1,7538,9720,123,0\n2,7538,9720,,0\n3,7538,9720,123,4\n'
class E0(unittest.TestCase):
    def test_classes(self):
        self.assertEqual(r.classify_bytes(RAW), [('1','gaia_clean'),('2','no_gaia_clean'),('3','review')])
    def test_duplicates(self):
        with self.assertRaises(ValueError): r.classify_bytes(RAW+b'1,7538,9720,,0\n')
    def test_limits_and_headers(self):
        with self.assertRaises(ValueError): r.classify_bytes(b'x'*(r.MAX_BYTES+1))
        with self.assertRaises(ValueError): r.classify_bytes(HEADER.replace(b'source_id',b'source_id,source_id')+b'1,1,7538,9720,,0\n')
        rows=HEADER+b''.join(f'{i},7538,9720,,0\n'.encode() for i in range(1,2502))
        with self.assertRaises(ValueError): r.classify_bytes(rows)
    def test_wrong_scan(self):
        with self.assertRaises(ValueError): r.classify_bytes(RAW.replace(b'9720',b'9721'))
    def test_empty(self):
        with self.assertRaises(ValueError): r.classify_bytes(HEADER)
    def test_ragged(self):
        with self.assertRaises(ValueError): r.classify_bytes(HEADER+b'1,7538\n')
    def test_null_and_invalid(self):
        rows=r.classify_bytes(HEADER+b'1,7538,9720,NULL,0\n2,7538,9720,0,0\n3,7538,9720,1,NULL\n')
        self.assertEqual([x[1] for x in rows],['no_gaia_clean','review','review'])
    def test_hash_and_harvest(self):
        with tempfile.TemporaryDirectory() as td:
            src=Path(td)/'raw.csv';src.write_bytes(RAW);out=Path(td)/'out'
            with self.assertRaises(ValueError):r.run(src,out,'0'*64,'UNCOMMITTED')
            self.assertFalse(out.exists())
            counts=r.run(src,out,r.sha256(RAW),'UNCOMMITTED')
            self.assertEqual(h.harvest(out,r.sha256(RAW),'UNCOMMITTED'),counts)
            with self.assertRaises(ValueError):r.run(src,out,r.sha256(RAW),'UNCOMMITTED')
            (out/'classifications.csv').write_text('tampered')
            with self.assertRaises(ValueError):h.harvest(out,r.sha256(RAW),'UNCOMMITTED')
    def test_forged_manifest(self):
        with tempfile.TemporaryDirectory() as td:
            src=Path(td)/'raw.csv';src.write_bytes(RAW);out=Path(td)/'out'
            r.run(src,out,r.sha256(RAW),'UNCOMMITTED')
            manifest=out/'RESULT.md'
            manifest.write_text(manifest.read_text().replace('processed_sources: 3','processed_sources: 999'))
            (out/'SHA256SUMS').write_text(''.join(f'{r.sha256((out/n).read_bytes())}  {n}\n' for n in ['input.csv','classifications.csv','RESULT.md']))
            with self.assertRaises(ValueError):h.harvest(out,r.sha256(RAW),'UNCOMMITTED')
    def test_external_anchor(self):
        with tempfile.TemporaryDirectory() as td:
            src=Path(td)/'raw.csv';src.write_bytes(RAW);out=Path(td)/'out'
            r.run(src,out,r.sha256(RAW),'UNCOMMITTED')
            with self.assertRaises(ValueError):h.harvest(out,'0'*64,'UNCOMMITTED')
            with self.assertRaises(ValueError):h.harvest(out,r.sha256(RAW),'a'*40)
    def test_traversal(self):
        with tempfile.TemporaryDirectory() as td:
            p=Path(td);(p/'SHA256SUMS').write_text('0'*64+'  ../x\n')
            with self.assertRaises(ValueError):h.harvest(p,'0'*64,'UNCOMMITTED')
if __name__ == '__main__':unittest.main()

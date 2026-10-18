import importlib.util
import unittest
from pathlib import Path

p = Path(__file__).resolve().parents[1] / 'collect_official.py'
spec = importlib.util.spec_from_file_location('collector', p)
c = importlib.util.module_from_spec(spec)
spec.loader.exec_module(c)

def xml(status='OK'):
    fields=''.join(f'<FIELD name="{f}"/>' for f in c.FIELDS)
    rows=''.join('<TR>'+''.join(f'<TD>{v}</TD>' for v in [sid,'7538','9720','1.0','2.0','','0'])+'</TR>' for sid in sorted(c.IDS))
    return f'<VOTABLE xmlns="http://www.ivoa.net/xml/VOTable/v1.3"><RESOURCE><INFO name="QUERY_STATUS" value="{status}"/><TABLE>{fields}<DATA><TABLEDATA>{rows}</TABLEDATA></DATA></TABLE></RESOURCE></VOTABLE>'.encode()

class Collection(unittest.TestCase):
    def test_valid(self):
        self.assertEqual(len(c.normalize(xml()).splitlines()),4)
    def test_failed_or_overflow(self):
        for status in ['ERROR','OVERFLOW']:
            with self.assertRaises(ValueError):c.normalize(xml(status))
    def test_wrong_ids(self):
        with self.assertRaises(ValueError):c.normalize(xml().replace(b'40097460019516',b'40097460019517'))
    def test_schema(self):
        with self.assertRaises(ValueError):c.normalize(xml().replace(b'name="scan_id"',b'name="scan_other"'))
    def test_entities_and_cap(self):
        for raw in [b'<!DOCTYPE foo>'+xml(),b'x'*(c.CAP+1)]:
            with self.assertRaises(ValueError):c.normalize(raw)
    def test_redirect(self):
        with self.assertRaises(ValueError):c.NoRedirect().redirect_request(None,None,302,'',{},'https://other.example/')
if __name__=='__main__':unittest.main()

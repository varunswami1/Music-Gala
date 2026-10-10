"""Offline tests for the Person 5 scripts. Run from the repo root:  python -m unittest scripts/test_scripts.py -v
No network is used: API responses are small hand-written samples shaped like the documented ones."""
import json, sys, tempfile, unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import import_data as im, build_artists as ba, build_recs as br, fetch_lyrics as fl, localize_covers as lc, validate_library as vl  # noqa: E402
from _common import norm  # noqa: E402


class ArtistParsing(unittest.TestCase):
    def test_mb_match_requires_exact_name_and_high_score(self):
        resp = {"artists": [{"name": "Arijit Singh Tribute", "score": 100}, {"name": "ARIJIT  SINGH", "score": 97, "id": "x"}, {"name": "Arijit Singh", "score": 60}]}
        self.assertEqual(ba.pick_mb_match("Arijit Singh", resp)["id"], "x")
        self.assertIsNone(ba.pick_mb_match("Someone Else", resp))
        self.assertIsNone(ba.pick_mb_match("Arijit Singh", {"artists": [{"name": "Arijit Singh", "score": 80}]}))
        self.assertIsNone(ba.pick_mb_match("x", None))

    def test_wikidata_and_enwiki(self):
        mb = {"relations": [{"type": "official homepage", "url": {"resource": "http://x"}}, {"type": "wikidata", "url": {"resource": "https://www.wikidata.org/wiki/Q123"}}]}
        self.assertEqual(ba.wikidata_id(mb), "Q123")
        self.assertIsNone(ba.wikidata_id({"relations": []}))
        ent = {"entities": {"Q123": {"sitelinks": {"enwiki": {"title": "Arijit Singh"}}}}}
        self.assertEqual(ba.enwiki_title(ent, "Q123"), "Arijit Singh")
        self.assertIsNone(ba.enwiki_title({}, "Q123"))

    def test_years_origin_genres(self):
        self.assertEqual(ba.active_years({"life-span": {"begin": "2005-03-01"}}), "2005–present")
        self.assertEqual(ba.active_years({"life-span": {"begin": "1990", "end": "2004-01"}}), "1990–2004")
        self.assertIsNone(ba.active_years({"life-span": {}}))
        self.assertEqual(ba.origin_of({"area": {"name": "India"}, "begin-area": {"name": "Kolkata"}}), "Kolkata")
        self.assertEqual(ba.top_genres({"genres": [{"name": "pop", "count": 1}, {"name": "film", "count": 9}]}, 1), ["film"])

    def test_summary_rejects_disambiguation_and_non_music(self):
        good = {"type": "standard", "description": "Indian singer", "extract": "Arijit Singh is an Indian playback singer.", "thumbnail": {"source": "http://t/a.jpg"}}
        self.assertEqual(ba.parse_summary(good), ("Arijit Singh is an Indian playback singer.", "http://t/a.jpg"))
        self.assertEqual(ba.parse_summary({**good, "type": "disambiguation"}), (None, None))
        self.assertEqual(ba.parse_summary({"type": "standard", "description": "Village in Spain", "extract": "A village."}), (None, None))
        self.assertEqual(ba.parse_summary(None), (None, None))


class RecParsing(unittest.TestCase):
    def test_similar(self):
        resp = {"similartracks": {"track": [
            {"name": "Song A", "artist": {"name": "Artist A"}, "match": "0.83"},
            {"name": "", "artist": {"name": "Nobody"}},
            {"name": "Song B", "artist": {"name": "Artist B"}, "match": "oops"}]}}
        out = br.parse_similar(resp, "Seed")
        self.assertEqual([o["title"] for o in out], ["Song A", "Song B"])
        self.assertIn("0.83", out[0]["reason"]); self.assertNotIn("match", out[1]["reason"].split("Listeners")[1][-8:])
        self.assertEqual(br.parse_similar({"similartracks": {"track": {"name": "One", "artist": {"name": "X"}}}}, "S")[0]["title"], "One")
        self.assertEqual(br.parse_similar({"error": 6}, "S"), [])

    def test_seeds_favourites_first(self):
        lib = {"tracks": [{"id": "a", "artistNames": ["x"], "isFavourite": False, "coverUrl": "u"}, {"id": "b", "artistNames": ["x"], "isFavourite": True, "coverUrl": None}, {"id": "c", "artistNames": []}]}
        self.assertEqual([s["id"] for s in br.pick_seeds(lib, 5, False)], ["b", "a"])
        self.assertEqual(len(br.pick_seeds(lib, 1, False)), 1)

    def test_norm_matches_typescript_rule(self):
        self.assertEqual(norm("  Tum  Hi Ho! (Remix) "), "tum hi ho remix")


class LyricsParsing(unittest.TestCase):
    def body(self, text, status=200, restricted=0):
        return {"message": {"header": {"status_code": status}, "body": {"lyrics": {"lyrics_body": text, "restricted": restricted, "lyrics_copyright": "c"}}}}

    def test_strips_notice_and_marks_partial(self):
        r = fl.parse_lyrics(self.body("line one\nline two\n\n...\n\n******* This Lyrics is NOT for Commercial use *******\n(1409617)"), full=False)
        self.assertEqual(r["text"], "line one\nline two\n\n...")
        self.assertTrue(r["partial"]); self.assertFalse(fl.parse_lyrics(self.body("x"), full=True)["partial"])

    def test_missing_or_restricted(self):
        self.assertIsNone(fl.parse_lyrics(self.body("x", status=404), False))
        self.assertIsNone(fl.parse_lyrics(self.body("x", restricted=1), False))
        self.assertIsNone(fl.parse_lyrics(self.body("   "), False))
        self.assertIsNone(fl.parse_lyrics({}, False))
        self.assertIsNone(fl.parse_lyrics(None, False))


class CoversAndValidation(unittest.TestCase):
    def test_is_image(self):
        self.assertTrue(lc.is_image(b"\xff\xd8\xff" + b"0" * 600))
        self.assertFalse(lc.is_image(b"<html>" + b"0" * 600)); self.assertFalse(lc.is_image(b"\xff\xd8\xff"))

    def lib(self):
        return {"rooms": [{"id": "r1", "kind": "scene", "trackCount": 5}], "artists": [{"id": "a1", "roomId": "r1", "songCount": 9, "name": "A"}],
                "tracks": [{"id": "t1", "roomId": "r1", "artistIds": ["a1"], "artistNames": ["A"], "coverUrl": "u", "year": 2020}]}

    def test_validate_clean_and_counts(self):
        errors, warnings, _ = vl.validate(self.lib())
        self.assertEqual(errors, []); self.assertTrue(any("trackCount" in w for w in warnings))
        fixed = vl.fix_counts(self.lib())
        self.assertEqual((fixed["rooms"][0]["trackCount"], fixed["artists"][0]["songCount"]), (1, 1))

    def test_validate_catches_broken_links(self):
        lib = self.lib(); lib["tracks"][0]["roomId"] = "nope"; lib["tracks"][0]["artistIds"] = ["ghost"]; lib["tracks"].append(dict(lib["tracks"][0]))
        errors, _, _ = vl.validate(lib)
        joined = " ".join(errors)
        self.assertIn("unknown roomId", joined); self.assertIn("unknown artist", joined); self.assertIn("duplicate track", joined)

    def test_cli_exit_code(self):
        with tempfile.TemporaryDirectory() as d:
            p = Path(d) / "l.json"; bad = self.lib(); bad["tracks"][0]["roomId"] = "nope"
            p.write_text(json.dumps(bad)); self.assertEqual(vl.main([str(p)]), 1)
            p.write_text(json.dumps(self.lib())); self.assertEqual(vl.main([str(p)]), 0)


class ImportData(unittest.TestCase):
    def test_artists_matched_by_name_and_misses_skipped(self):
        src = {"Karan Aujla": {"name": "Karan Aujla", "bio": " Singer. ", "photoUrl": "http://p"}, "dynmk": {"name": "Dynmk", "queryName": "dynmk", "bio": None, "photoUrl": None},
               "KR$NA": {"name": "KR$NA", "miss": True, "reason": "profile_fetch_failed"}}
        libs = [{"id": "a1", "name": "karan aujla"}, {"id": "a2", "name": "DYNMK"}, {"id": "a3", "name": "KR$NA"}, {"id": "a4", "name": "Unknown"}]
        out = im.convert_artists(src, libs)
        self.assertEqual(out, {"a1": {"bio": "Singer.", "bioSource": im.CREDIT, "imageUrl": "http://p"}})

    def test_lyrics_cleaned_and_empty_dropped(self):
        out = im.convert_lyrics({"abc": {"lyrics": "a\r\nb  \r\n\r\nc\r\n", "source": "None"}, "e": {"lyrics": "  "}, "../x": {"lyrics": "bad"}})
        self.assertEqual(list(out), ["abc"]); self.assertEqual(out["abc"]["text"], "a\nb\n\nc")
        self.assertIn("not recorded", out["abc"]["source"]); self.assertFalse(out["abc"]["partial"])


if __name__ == "__main__":
    unittest.main()

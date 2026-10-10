"""Offline tests with simulated API responses. Run: python -m unittest test_enrich -v"""
import json, tempfile, unittest
from pathlib import Path
import enrich


def track(i, title, artists, room="unsorted", review=True, album=None):
    return dict(id=f"tr_{i}", title=title, artistNames=artists, artistIds=[f"ar_{a}" for a in artists], album=album, year=None,
                roomId=room, wing=None, isFavourite=False, tags=[], sourcePlaylists=[], coverUrl=None, dominantColor=None,
                confidence=0.0, needsReview=review, isrc=None, youtubeId=None)


def make_lib():
    return dict(rooms=[dict(id=i, displayName=i, kind="scene", trackCount=0) for i in enrich.SCENE_IDS] +
                      [dict(id="unsorted", displayName="Cellar", kind="special", trackCount=0)],
                artists=[dict(id="ar_A", roomId="unsorted")],
                tracks=[track(1, "Chaiyya", ["A"]), track(2, "Mystery", ["B"]), track(3, "Sure", ["C"], "english", False)])


class Tests(unittest.TestCase):
    def test_parse_llm_json_fences_and_garbage(self):
        self.assertEqual(enrich.parse_llm_json('```json\n[{"id":"x"}]\n```'), [{"id": "x"}])
        self.assertEqual(enrich.parse_llm_json("not json"), [])
        self.assertEqual(enrich.parse_llm_json('{"id":"x"}'), [])

    def test_apply_llm_thresholds_and_whitelist(self):
        t = track(1, "s", ["A"])
        self.assertFalse(enrich.apply_llm(t, {"scene": "unsure", "confidence": 0.99}))
        self.assertFalse(enrich.apply_llm(t, {"scene": "hindi_film", "confidence": 0.5}))
        self.assertFalse(enrich.apply_llm(t, {"scene": "secret_room; drop table", "confidence": 0.99}))
        self.assertFalse(enrich.apply_llm(t, {"scene": "punjabi", "confidence": "high"}))
        self.assertEqual(t["roomId"], "unsorted")
        self.assertTrue(enrich.apply_llm(t, {"scene": "desi_hiphop", "wing": "global", "confidence": 0.9}))
        self.assertEqual((t["roomId"], t["wing"], t["needsReview"]), ("desi_hiphop", "global", False))
        self.assertTrue(enrich.apply_llm(t, {"scene": "punjabi", "wing": "global", "confidence": 0.75}))
        self.assertEqual((t["wing"], t["needsReview"]), (None, True))

    def test_targets_skip_confident_and_overrides(self):
        lib = make_lib()
        self.assertEqual([t["id"] for t in enrich.targets(lib, set())], ["tr_1", "tr_2"])
        self.assertEqual([t["id"] for t in enrich.targets(lib, {"tr_1"})], ["tr_2"])

    def test_best_match(self):
        res = [dict(artistName="Someone Else", trackName="Chaiyya Chaiyya", collectionName="X"),
               dict(artistName="Sukhwinder Singh", trackName="Chaiyya Chaiyya", collectionName="Dil Se", artworkUrl100="u/100x100bb.jpg")]
        m = enrich.best_match(res, ["Sukhwinder Singh"], "Chaiyya Chaiyya", None)
        self.assertEqual(m["collectionName"], "Dil Se")
        self.assertIsNone(enrich.best_match(res, ["Nobody"], "Zzz", None))

    def test_full_flow_with_fakes_and_cache(self):
        lib, calls = make_lib(), {"llm": 0, "http": 0}
        d = Path(tempfile.mkdtemp())

        def fake_http(url, params, throttle, retries=4):
            calls["http"] += 1
            if "audioscrobbler" in url:
                return {"toptags": {"tag": [{"name": "Bollywood", "count": 100}, {"name": "rare", "count": 2}]}}
            return {"results": [dict(artistName="A", trackName="Chaiyya", collectionName="Dil Se",
                                     artworkUrl100="https://x/100x100bb.jpg", releaseDate="1998-08-01T00:00:00Z")]}

        def fake_llm(items):
            calls["llm"] += 1
            return [dict(id="tr_1", scene="hindi_film", wing=None, confidence=0.92), dict(id="tr_2", scene="unsure", confidence=0)]

        enrich.http_get_json, enrich.call_llm = fake_http, fake_llm
        ctx = dict(limit=0, overrides=set(), lastfm_key="k", lf_cache=enrich.Cache(d / "lf.json"), llm_cache=enrich.Cache(d / "llm.json"),
                   it_cache=enrich.Cache(d / "it.json"), lf_throttle=enrich.Throttle(0), it_throttle=enrich.Throttle(0), log_path=d / "log.csv")
        enrich.stage_tags(lib, ctx); enrich.stage_classify(lib, ctx); enrich.stage_covers(lib, ctx); enrich.recount(lib)
        t1, t2 = lib["tracks"][0], lib["tracks"][1]
        self.assertEqual(t1["genreTags"], ["bollywood"])
        self.assertEqual((t1["roomId"], t1["classifiedBy"], t1["needsReview"]), ("hindi_film", "llm", False))
        self.assertEqual(t2["roomId"], "unsorted")
        self.assertEqual((t1["coverUrl"], t1["year"]), ("https://x/600x600bb.jpg", 1998))
        self.assertEqual(lib["tracks"][2]["roomId"], "english")
        self.assertEqual({r["id"]: r["trackCount"] for r in lib["rooms"]}["hindi_film"], 1)
        self.assertEqual(lib["artists"][0]["roomId"], "hindi_film")
        n_http, n_llm = calls["http"], calls["llm"]
        for c in ("lf_cache", "llm_cache", "it_cache"): ctx[c].save()
        ctx2 = dict(ctx, lf_cache=enrich.Cache(d / "lf.json"), llm_cache=enrich.Cache(d / "llm.json"), it_cache=enrich.Cache(d / "it.json"))
        lib2 = make_lib(); enrich.stage_tags(lib2, ctx2); enrich.stage_classify(lib2, ctx2); enrich.stage_covers(lib2, ctx2)
        self.assertEqual((calls["http"], calls["llm"]), (n_http, n_llm))  # second run: everything from cache
        # third run on the already-enriched library: the log must still list the LLM-decided song, with its old room
        enrich.stage_classify(lib, ctx2)
        rows = list(__import__("csv").DictReader(open(ctx2["log_path"], encoding="utf-8-sig")))
        self.assertEqual([(r["id"], r["old_room"], r["new_room"]) for r in rows], [("tr_1", "unsorted", "hindi_film")])


if __name__ == "__main__":
    unittest.main()

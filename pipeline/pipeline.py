#!/usr/bin/env python3
"""Music Gallery pipeline v0.1 (rules-based, fully offline).

Steps: ingest CSV -> clean titles -> de-duplicate -> classify each SONG into a room
(artist is only a hint) -> write library.json + review files + report.

Run:  python pipeline.py "My_YouTube_Music_Library.csv" [--out out]
Edit scene_lexicon.json, then add artist_labels.csv / song_overrides.csv and re-run.
"""
import argparse, csv, hashlib, json, re, string, unicodedata
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path
import pandas as pd

HERE = Path(__file__).parent
MIN_SCORE, REVIEW_SCORE, REVIEW_CONF = 1.5, 2.5, 0.6
SCENES = ["hindi_film", "punjabi", "desi_hiphop", "english", "indie_pop", "folk_regional"]
ROOMS = [
    ("hindi_film", "The Cinema", "#e8c07a", "scene"), ("punjabi", "The Terrace", "#f08a5d", "scene"),
    ("desi_hiphop", "The Underpass", "#9be15d", "scene"), ("english", "The Skyline", "#8ab4ff", "scene"),
    ("indie_pop", "The Greenroom", "#c9a7ff", "scene"), ("folk_regional", "The Courtyard", "#ffb4a2", "scene"),
    ("favourites", "The Dome", "#ffffff", "special"), ("artists", "The Roll Call", "#e8e8e8", "special"),
    ("unsorted", "The Cellar", "#777777", "special"), ("discover", "The Observatory", "#7ad7f0", "special"),
    ("why", "The Study", "#e8e8e8", "special"),
]
FAV_PLAYLISTS = {"Favorite Songs", "Favorite Albums"}
LABELS = {"legacy", "tseries", "t-series", "sony music india", "zee music company"}
PUNCT = str.maketrans("", "", string.punctuation)
EMOJI = re.compile("[\U0001F000-\U0001FAFF\u2600-\u27BF\uFE0F\u200d]")
HASHTAG = re.compile(r"#\w+")
NOISE = re.compile(r"official|music video|lyric|video song|full video|visuali[sz]er|\baudio\b|\bhd\b|\b4k\b|haryanvi song|punjabi song|hindi song|new song", re.I)
ARTIST_SPLIT = re.compile(r"\s*(?:,|\bfeat\.?|\bft\.?|\bx\b|·|•)\s*", re.I)

SCRIPTS = [  # (regex, scene, weight)
    (re.compile("[\u0A00-\u0A7F]"), "punjabi", 2.5),
    (re.compile("[\u0900-\u097F]"), "hindi_film", 1.0),
    (re.compile("[\u0980-\u09FF\u0A80-\u0AFF\u0B00-\u0B7F\u0B80-\u0BFF\u0C00-\u0C7F\u0C80-\u0CFF\u0D00-\u0D7F]"), "folk_regional", 2.5),
]
KEYWORDS = [  # (regex on lowercased title + album, scene, weight)
    (re.compile(r"\bpunjabi\b|\bpanjabi\b|\bpunjab\b|\bjatt?\b|\bjatti\b|\bgabru\b"), "punjabi", 1.5),
    (re.compile(r"\bfolk\b|rajasthani|\bbhajan\b|\baarti\b|chalisa|\bmantra\b|kirtan|\bgarba\b|bhojpuri|marathi|haryanvi|gujarati|bengali|\btamil\b|\btelugu\b"), "folk_regional", 1.5),
    (re.compile(r"desi hip.?hop|\bdhh\b|\bcypher\b|\bfreestyle\b|\blegacy\b|seedhe maut|\bhip.?hop\b|\brap\b|\bdrill\b"), "desi_hiphop", 1.5),
    (re.compile(r"\(from\s|\bfrom\s+[\"“]|\bost\b|soundtrack|\bfilm\b|bollywood"), "hindi_film", 2.0),
    (re.compile(r"\bindie\b"), "indie_pop", 1.5),
]
WESTERN_ISRC = {"US", "GB", "SE", "DE", "CA", "AU", "NL", "NO", "DK", "IE", "KR"}


def norm(s):
    s = unicodedata.normalize("NFKC", str(s)).lower().translate(PUNCT)
    return re.sub(r"\s+", " ", s).strip()


def sid(prefix, text, n=10):
    return f"{prefix}_{hashlib.sha1(text.encode('utf-8')).hexdigest()[:n]}"


def parse_video_title(raw):
    """Liked videos have no artist/album: pull artists and title out of the video title."""
    t = HASHTAG.sub("", EMOJI.sub("", raw))
    t = re.sub(r"\s+", " ", t).strip()
    t = re.sub(r"[\(\[][^\)\]]*(official|video|audio|lyric|\bhd\b|4k|visuali)[^\)\]]*[\)\]]", "", t, flags=re.I).strip()
    if " - " in t:
        left, right = t.split(" - ", 1)
        return re.split(r"\s*\|\s*", right.strip())[0], [a for a in ARTIST_SPLIT.split(left) if a.strip()], True
    if "|" in t:
        keep = [p.strip() for p in t.split("|") if p.strip() and not NOISE.search(p)]
        if keep:
            artists = [p for p in keep[1:3] if norm(p) not in LABELS]
            return keep[0], artists, True
    return t, [], bool(raw != t)


def key_title(t):
    t = re.sub(r"[\(\[]\s*(from|feat|ft|official|remaster|with)[^\)\]]*[\)\]]", "", t, flags=re.I)
    t = re.sub(r"\s*-\s*from\s+.*$", "", t, flags=re.I)
    return norm(t)


def load_lexicon():
    lex = json.loads((HERE / "scene_lexicon.json").read_text(encoding="utf-8"))
    table = defaultdict(list)  # normalised artist -> [(scene, wing, weight)]
    for key, names in lex.items():
        if key.startswith("_"):
            continue
        if key == "crossover":
            for name, scenes in names.items():
                table[norm(name)] += [(sc, None, 1.5) for sc in scenes]
        else:
            scene, _, wing = key.partition(":")
            for name in names:
                table[norm(name)].append((scene, wing or None, 3.0))
    labels = HERE / "artist_labels.csv"
    if labels.exists():
        for r in csv.DictReader(open(labels, encoding="utf-8-sig")):
            if (r.get("scene") or "").strip():
                table[norm(r["artist"])] = [(r["scene"].strip(), (r.get("wing") or "").strip() or None, 3.0)]
    return table


def classify(song, table):
    votes, wings, why = Counter(), {}, []
    for a in song["artistNames"]:
        for scene, wing, w in table.get(norm(a), []):
            votes[scene] += w
            why.append(f"artist:{a}->{scene}")
            if wing:
                wings[scene] = wing
    text = " ".join([song["rawTitles"][0], song["album"] or ""]).lower()
    raw_text = " ".join(song["rawTitles"]) + " " + " ".join(song["artistNames"])
    indic = False
    for rx, scene, w in SCRIPTS:
        if rx.search(raw_text):
            votes[scene] += w; why.append(f"script->{scene}"); indic = True
    for rx, scene, w in KEYWORDS:
        if rx.search(text):
            votes[scene] += w; why.append(f"keyword->{scene}")
    if "Bollywood" in song["sourcePlaylists"]:
        votes["hindi_film"] += 1.0; why.append("playlist:Bollywood")
    if song["isrc"] and song["isrc"][:2] in WESTERN_ISRC and not indic:
        votes["english"] += 1.5; why.append("isrc:western")
    if not votes:
        return "unsorted", None, 0.0, True, ["no signal"]
    (room, best), *rest = votes.most_common()
    second = rest[0][1] if rest else 0.0
    conf = round(best / sum(votes.values()), 2)
    if best < MIN_SCORE:
        return "unsorted", None, conf, True, why
    review = conf < REVIEW_CONF or best < REVIEW_SCORE or best == second
    wing = wings.get(room) or ("desi" if room == "desi_hiphop" else None)
    return room, wing, conf, review, why


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("csv"); ap.add_argument("--out", default="out")
    args = ap.parse_args()
    out = Path(args.out); out.mkdir(parents=True, exist_ok=True)
    df = pd.read_csv(args.csv, dtype=str).fillna("")
    table = load_lexicon()

    # 1-3: ingest, clean, de-duplicate
    subscribed = {norm(r["Track name"]): r["Track name"] for _, r in df[df["Type"] == "Artist"].iterrows()}
    songs, parsed_rows = {}, 0
    for r in df[df["Type"] != "Artist"].to_dict("records"):
        raw, artist_field = r["Track name"].strip(), r["Artist name"].strip()
        if artist_field:
            title, names, parsed = raw, [a for a in ARTIST_SPLIT.split(artist_field) if a.strip()], False
        else:
            title, names, parsed = parse_video_title(raw); parsed_rows += 1
        key = f"{key_title(title)}|{norm(names[0]) if names else ''}"
        s = songs.setdefault(key, dict(title=title, artistNames=names, album=r["Album"] or None, isrc=r["ISRC"] or None,
                                       rawTitles=[], sourcePlaylists=[], isFavourite=False, parsed=parsed, tags=[]))
        s["rawTitles"].append(raw)
        if r["Playlist name"] not in s["sourcePlaylists"]:
            s["sourcePlaylists"].append(r["Playlist name"])
        s["isFavourite"] |= r["Playlist name"] in FAV_PLAYLISTS
        s["album"] = s["album"] or r["Album"] or None
        s["isrc"] = s["isrc"] or r["ISRC"] or None
        if r["Playlist name"] == "Liked videos" and "liked" not in s["tags"]:
            s["tags"].append("liked")

    # song overrides (id,scene)
    overrides = {}
    ov = HERE / "song_overrides.csv"
    if ov.exists():
        overrides = {r["id"]: r["scene"] for r in csv.DictReader(open(ov, encoding="utf-8-sig")) if r.get("scene")}

    # 4: classify
    tracks, review_rows, artist_rooms, artist_count = [], [], defaultdict(Counter), Counter()
    for key, s in sorted(songs.items()):
        tid = sid("tr", key)
        room, wing, conf, review, why = classify(s, table)
        if tid in overrides:
            room, review, conf, why = overrides[tid], False, 1.0, ["override"]
        ids = []
        for a in s["artistNames"]:
            ids.append(sid("ar", norm(a), 8)); artist_rooms[norm(a)][room] += 1; artist_count[norm(a)] += 1
        t = dict(id=tid, isrc=s["isrc"], youtubeId=None, title=s["title"], artistIds=ids, artistNames=s["artistNames"],
                 album=s["album"], year=None, roomId=room, wing=wing, isFavourite=s["isFavourite"], tags=s["tags"],
                 sourcePlaylists=s["sourcePlaylists"], coverUrl=None, dominantColor=None, confidence=conf,
                 needsReview=review or s["parsed"] and not s["artistNames"])
        tracks.append(t)
        if t["needsReview"]:
            review_rows.append([tid, s["title"], "; ".join(s["artistNames"]), room, conf, " | ".join(why[:6])])

    # artists
    names = {}
    for t in tracks:
        for aid, nm in zip(t["artistIds"], t["artistNames"]):
            names[norm(nm)] = nm
    artists = []
    for n in sorted(set(names) | set(subscribed)):
        rooms = Counter({k: v for k, v in artist_rooms.get(n, {}).items() if k != "unsorted"})
        hint = [sc for sc, _, _ in table.get(n, [])]
        room = rooms.most_common(1)[0][0] if rooms else (hint[0] if hint else "unsorted")
        artists.append(dict(id=sid("ar", n, 8), name=names.get(n) or subscribed[n], subscribed=n in subscribed, roomId=room, songCount=artist_count.get(n, 0)))

    counts = Counter(t["roomId"] for t in tracks)
    rooms = [dict(id=i, displayName=d, accent=a, kind=k, trackCount=(counts.get(i, 0) if k == "scene" or i == "unsorted" else None)) for i, d, a, k in ROOMS]
    for r in rooms:
        if r["id"] == "favourites": r["trackCount"] = sum(t["isFavourite"] for t in tracks)
        if r["id"] == "artists": r["trackCount"] = sum(a["subscribed"] for a in artists)
    lib = dict(version=2, generatedAt=datetime.now(timezone.utc).isoformat(), rooms=rooms, artists=artists, tracks=tracks)
    (out / "library.json").write_text(json.dumps(lib, ensure_ascii=False, indent=1), encoding="utf-8")

    # review files
    with open(out / "needs_review.csv", "w", newline="", encoding="utf-8-sig") as f:
        w = csv.writer(f); w.writerow(["id", "title", "artists", "room", "confidence", "signals"]); w.writerows(review_rows)
    weak = defaultdict(list)
    for t in tracks:
        if t["needsReview"]:
            for nm in t["artistNames"] or ["(unknown artist)"]:
                weak[nm].append(t["title"])
    ranked = sorted(weak.items(), key=lambda kv: -len(kv[1]))
    with open(out / "artist_review.csv", "w", newline="", encoding="utf-8-sig") as f:
        w = csv.writer(f); w.writerow(["artist", "scene", "wing", "weak_songs", "sample_titles"])
        for nm, ts in ranked:
            w.writerow([nm, "", "", len(ts), " / ".join(ts[:3])])

    # report
    n = len(tracks); nr = sum(t["needsReview"] for t in tracks)
    lines = [f"Rows read: {len(df)}  | artist subscriptions: {len(subscribed)}  | video titles parsed: {parsed_rows}",
             f"Unique songs after de-duplication: {n}", "", "Songs per room:"]
    lines += [f"  {d:<15} {counts.get(i, 0):>5}" for i, d, _, k in ROOMS if k == "scene" or i == "unsorted"]
    lines += [f"  {'The Dome (fav)':<15} {sum(t['isFavourite'] for t in tracks):>5}  (flag, overlaps rooms)",
              "", f"Needs review: {nr} ({nr / n:.0%})  | high-confidence: {n - nr}"]
    top = sum(len(ts) for _, ts in ranked[:150]); tot = sum(len(ts) for _, ts in ranked)
    lines += [f"Weak songs by artist: top 150 artists in artist_review.csv cover {top} of {tot} artist-song links ({top / max(tot, 1):.0%})."]
    (out / "report.txt").write_text("\n".join(lines), encoding="utf-8")
    print("\n".join(lines))


if __name__ == "__main__":
    main()

# Music Gallery: Design Spec v0.3

A personal, unpublished 3D website where your music library becomes a gallery of rooms you can walk through. The mood (dark, wireframe, monospace) is inspired by a studio site you liked. All models, layouts, names and text here are original.

**What changed since v0.2:** room names are approved, Punjabi and desi hip-hop stay separate, songs (not artists) decide their room, and recommendations now look **outside** your library, shown mainly as a strip at the bottom of each song card.

---

## 1. Vision

You enter a dark wireframe space. Each **scene** of your music (Bollywood, Punjabi, desi hip-hop, English and so on) is a **room** with its own name, shape and light. Inside, album covers hang like posters and sit on shelves. Click a cover to open the song. A discovery room recommends what to explore next, and a personal room explains why you built this.

Design words: *dark, wireframe, monospace, quiet, spatial, album art as colour.*

---

## 2. What your library actually looks like

From the exported CSV (roughly, and to be re-checked by the pipeline):

| Fact | Value | Design consequence |
|---|---|---|
| Rows in file | 8,924 | Includes non-song rows |
| Artist subscriptions | 693 | Becomes its own hall, and seeds genre classification |
| Unique songs after de-duplication | ~6,000 to 6,500 | Too many for posters: rooms show albums and artists, songs open one level deeper |
| Playlists | 10, mostly giant buckets (about 4,000 / 1,700 / 680 / 600 songs) | Names say nothing about content, so they are **never** used as room names |
| Songs in more than one playlist | ~24% | De-duplicate by ISRC, give each song one *primary* room |
| Liked videos | 611, with no artist, album or ISRC | Need title parsing and an LLM pass; some need manual review |
| Songs with ISRC | ~7,600 rows | ISRC is the main ID for merging and cover lookup |
| Origin | About half have Indian ISRC codes | The scene list must be built around Indian music |

---

## 3. Rooms (organised by language / scene)

Names are **display names only**. Ids are fixed so renaming costs nothing.

| Id | Display name (placeholder) | Contains |
|---|---|---|
| `hindi_film` | **The Cinema** | Bollywood and Hindi film music |
| `punjabi` | **The Terrace** | Punjabi pop and hip-hop |
| `desi_hiphop` | **The Underpass** | Indian rap and hip-hop scene, with a global wing for English hip-hop |
| `english` | **The Skyline** | English pop, R&B, rock |
| `indie_pop` | **The Greenroom** | Indian independent, pop and singer-songwriters |
| `folk_regional` | **The Courtyard** | Folk, devotional, regional and other languages |
| `favourites` | **The Dome** | Your favourite songs and albums (a special room) |
| `artists` | **The Roll Call** | Hall of your subscribed artists |
| `unsorted` | **The Cellar** | Low-confidence or unknown songs awaiting review |
| `discover` | **The Observatory** | Recommendations |
| `why` | **The Study** | Your personal story |

Every room has a **style/mood tag layer** (romantic, party, chill, workout, sad) used for lighting and recommendations, not for room membership.

Room rules:
- Each **song** (not artist) has exactly one primary room, decided by the song itself. A pure Punjabi song goes to The Terrace and a desi hip-hop-style song goes to The Underpass, even if the same artist made both. Songs can also carry secondary tags.
- The Roll Call lists each artist with all their songs, across every room.
- A room shows at most about 150 covers at a time (see performance). Larger rooms use sub-sections (by artist, year or mood).
- The gallery home shows only the doors. Door size or glow reflects how many songs the room holds.

---

## 4. Experience flow

1. **Intro:** black loader, spaced monospace title, **LAUNCH**, and a skip option.
2. **Gallery home:** a corridor of doors, one per room. The far wall shows a slow collage of covers (cheap canvas slideshow, not real video).
3. **Room:** covers on walls and shelves, a search box that is always visible, and sorting by year, mood or recently added.
4. **Song card:** opens when you click a cover. It shows the cover art, title, artist, album, year and room, the YouTube player, and at the bottom a strip of **similar songs** with a two-way toggle: **From library** and **New**. *New* shows songs from outside your library and is the default.
5. **The Observatory:** two lists, each with a reason on every item. *From your library:* songs to play for your current mood. *New to you:* songs from outside your library.
6. **The Study:** your own story and timeline.
7. **Flat 2D mode:** plain lists of the same data. Used for mobile, accessibility, weak devices and debugging.

---

## 5. Data pipeline

```
CSV export or YouTube API
        │
[1 Ingest]  parse, drop non-song rows, split artist subscriptions
        │
[2 Clean]   strip "(Official Video)", hashtags, brackets; split "Artist - Title"
        │
[3 De-duplicate]  by ISRC, else by normalised title + artist
        │
[4 Classify]  artist = starting hint, song = final decision
        │       a. community tags (Last.fm / MusicBrainz) where available
        │       b. LLM maps those tags into YOUR fixed scene list, returns JSON + confidence
        │       c. low confidence goes to a manual review file
        │
[5 Enrich]  square cover art, year, dominant colour, mood tags
        │
   library.json  (the only contract between modules)
```

Notes:
- **Artist gives a hint, the song decides.** Classify each artist once as a cheap starting guess, then check every song against its own tags, title and language. Crossover artists (a Punjabi rapper) can have songs in several rooms. Low-confidence songs go to The Cellar.
- **Fixed scene list.** The LLM may only choose from your list, or `unsorted`.
- **Cache everything** so re-runs are cheap and results are stable.
- **No audio extraction.** Genre comes from metadata, not from the audio.
- **Check terms and limits** of every API (YouTube, Last.fm, MusicBrainz, cover sources) before building. Keep keys out of the repo.
- YouTube's official API does not expose a separate YouTube Music library, so the CSV export is the dependable source. The API can add new playlist items later.

---

## 6. Shared data contract (`library.json`)

```json
{
  "version": 2,
  "generatedAt": "ISO-8601",
  "rooms": [
    { "id": "hindi_film", "displayName": "The Cinema", "accent": "#e8c07a", "trackCount": 0 }
  ],
  "artists": [
    { "id": "ar_001", "name": "string", "subscribed": true, "roomId": "hindi_film" }
  ],
  "tracks": [
    {
      "id": "tr_001",
      "isrc": "string | null",
      "youtubeId": "string | null",
      "title": "string",
      "artistIds": ["ar_001"],
      "album": "string | null",
      "year": 2021,
      "roomId": "hindi_film",
      "tags": ["romantic"],
      "sourcePlaylists": ["Mix2"],
      "coverUrl": "string (square, 600px+)",
      "dominantColor": "#RRGGBB",
      "confidence": 0.92,
      "needsReview": false
    }
  ]
}
```

Rules: ids never change. Missing values are `null`, never empty strings. Every track has a `coverUrl` (fallback allowed). `displayName` is the only field the UI shows for rooms. `sourcePlaylists` is metadata only.

---

### Recommendations (runtime, cached in `recs_cache.json`)

```json
{
  "forTrackId": "tr_001",
  "generatedAt": "ISO-8601",
  "similar": [
    {
      "title": "string",
      "artist": "string",
      "youtubeId": "string",
      "coverUrl": "string",
      "source": "lastfm | llm_verified",
      "reason": "same mood and tempo",
      "inLibrary": false
    }
  ]
}
```

How it works:
1. Ask a similarity source (for example Last.fm's similar-tracks and similar-artists data) for candidates for the opened song.
2. **Mark each candidate as in your library or not** (match by ISRC, else by normalised title and artist). The *New* tab shows only `inLibrary: false`. The *From library* tab shows `inLibrary: true` and is also filled from your own library by shared tags, artist and mood.
3. Resolve each remaining candidate to a playable YouTube video and a square cover.
4. Cache the result, so each song is computed once, on first open, not for all 6,000 up front.

An LLM may suggest candidates, but every suggestion must be verified against a real source before showing it, because LLMs invent songs. Check each API's current terms and limits. As far as I know, YouTube's "related videos" feature is gone and Spotify's recommendation endpoints are restricted for new apps, so don't plan around either.

---

## 7. Architecture and five-part split

| # | Module | Owns |
|---|---|---|
| 1 | **Ingest and auth** | CSV parsing, optional YouTube sign-in, caching, refresh |
| 2 | **Classification and enrichment** (Python) | Cleaning, de-duplication, scene classification, cover lookup, review file, `library.json` |
| 3 | **3D engine** (Three.js) | Renderer, camera, LAUNCH transition, loaders, performance, 2D switch |
| 4 | **Rooms and interaction** | Corridor, room layouts, posters/shelves/dome, hover and click, track view, player |
| 5 | **Recommendations, design system and docs** | Recommendation service (outside library), Observatory, Study, tokens, menu overlay, this spec |

If you already have a team split document, reconcile it with this table first. The boundaries matter more than the labels.

---

## 8. Shared standards

**Code:** one repo with a protected `main`. Branches `m<module>/<name>`. Small pull requests with one review from another module owner. Types for `library.json`. Folders: `/ingest`, `/pipeline`, `/web/engine`, `/web/rooms`, `/web/ui`, `/docs`, `/data`.

**3D:** 1 unit = 1 metre, Y up, eye height 1.6. Every room extends one `Room` base class with `load()`, `enter()`, `exit()`, `dispose()`. Rooms must free their geometry and textures on exit.

**Design tokens (module 5):** `--bg #000`, `--fg #e8e8e8`, `--dim #777`, plus each room's accent. One monospace font, one heading weight. Motion is ease-out, about 600 ms between rooms, and off for `prefers-reduced-motion`.

**Performance:** 60 fps on a normal laptop, 30 fps on mobile. At most about 150 covers visible at once. Covers are 512 px, compressed and loaded by distance. Use instancing or texture atlases past that.

**Definition of done:** works on the mock data, meets the budget, has a 2D fallback, and has a short note in `/docs`.

---

## 9. Design recommendations

1. **Cover colour lights the room.** Tint lights, fog and lines from the dominant colours of the covers inside.
2. **Room shape follows scene.** Make The Underpass narrow and tall, The Terrace open and bright, The Dome round and warm.
3. **One layout per room type.** Posters up to about 100 covers, shelves for dense sections, dome for favourites.
4. **Don't force free walking.** Use click-to-move or hotspots, plus a floor map and always-on search.
5. **Two kinds of recommendations, always with a reason.** *From your library:* by mood, or "added long ago and never revisited". *New to you:* similar songs from outside your library, shown at the bottom of each song card and in The Observatory. The song-card strip has a **From library / New** toggle.
6. **Make The Study real.** Write it yourself: your story, the first song you added, a short timeline.
7. **Audio-reactive lines.** Pulse line brightness with playback state first, real audio analysis later (if the player allows it).
8. **Handle the awkward states:** first import of thousands of songs, empty rooms, failed covers, and re-importing when you add songs.
9. **Start small.** One corridor, one room, ten covers, one playing track. Add the dome, particles and 3D intro after the feel is right.
10. **Stay original.** Borrow the mood only.

---

## 10. Milestones

1. Agree the scene list, room names and `library.json` (all five).
2. Mock data with realistic volume, and wireframes of each room type.
3. Pipeline v1: ingest, clean, de-duplicate, classify by artist.
4. Static corridor and one room with mock covers (feel test).
5. Real data in the room, track view and player, 2D fallback.
6. Recommendation service (outside library), song-card strip, all rooms, Observatory and Study.
7. Polish: transitions, tinting, performance.

---

## 11. Decisions

**Settled**
- Room names as listed in section 3.
- Punjabi (The Terrace) and desi hip-hop (The Underpass) are separate rooms.
- Songs, not artists, decide their room.
- Recommendations look outside your library, in two kinds (section 4).
- The similar-songs strip has a toggle between *From library* and *New*.

**Still open**
- Which similarity source do we use first, and what is the fallback when it finds nothing for an obscure song?
- Should The Observatory's mood list use a mood you pick, or the time of day, or both?

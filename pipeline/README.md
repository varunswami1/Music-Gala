# Music Gallery pipeline v0.1

Offline, rules-based first pass: CSV -> clean -> de-duplicate -> classify each song into a room -> `library.json`.

## Run
```
pip install pandas
python pipeline.py "My_YouTube_Music_Library.csv" --out out
```
Outputs in `out/`: `library.json` (the contract from the spec), `needs_review.csv`, `artist_review.csv`, `report.txt`.

## Improve the result (loop)
1. Open `out/artist_review.csv`. It lists artists whose songs are unsorted or low-confidence, biggest first.
2. Fill the `scene` column (`hindi_film`, `punjabi`, `desi_hiphop`, `english`, `indie_pop`, `folk_regional`). Optional `wing` = `global` for English hip-hop.
   You can paste the top rows into any LLM with this prompt and paste its answers back:
   *"Classify each artist into exactly one of: hindi_film, punjabi, desi_hiphop, english, indie_pop, folk_regional. Use 'unsure' if you do not know. Do not guess. Return CSV: artist,scene."*
3. Save the file as `artist_labels.csv` (same folder as `pipeline.py`) and re-run.
4. For single songs, add `song_overrides.csv` with columns `id,scene` (ids are in `library.json`).
5. Extend `scene_lexicon.json` with any artists you know.

## How a song gets its room
Votes from: artist lexicon (3.0, crossover artists 1.5 per scene), Gurmukhi/Devanagari/other Indic script, title and album keywords, the "Bollywood" playlist, and a western ISRC country code. The top scene wins if it scores 1.5 or more, otherwise the song goes to The Cellar. A song needs review if confidence is under 0.6, the top score is under 2.5, or two scenes tie.

## Not done yet (needs internet)
Cover art, year, YouTube ids, dominant colour (enrichment) and Last.fm / MusicBrainz tags. Those fields are `null` in `library.json` for now.

## Online enrichment (enrich.py)
Needs internet, a free Last.fm key and an Anthropic key.
```
pip install anthropic
set LASTFM_API_KEY=...        (Windows: set / PowerShell: $env:LASTFM_API_KEY="...")
set ANTHROPIC_API_KEY=...
python enrich.py --stage tags --limit 20      # small trial first
python enrich.py                              # full run, safe to stop and resume
```
Writes `out/library.enriched.json` (original untouched) and `out/enrich_log.csv` (every LLM decision, for checking).
Stages: `tags` (Last.fm) -> `classify` (LLM, accepts only answers with confidence 0.7 or more, otherwise leaves the song where it was) -> `covers` (iTunes Search: cover and year).
Never overwritten: songs listed in `song_overrides.csv`. Run offline tests with `python -m unittest test_enrich -v`.

## Fixing songs by hand (no re-running)
1. Open `out/enrich_log_full.csv` and look at rows with `changed = yes` and low `confidence` first.
2. For each wrong song, add a line to `song_overrides.csv`: `id,scene` (optional third column `wing`).
3. Run: `python apply_overrides.py out/library.enriched.json song_overrides.csv --output out/library.final.json`
`library.final.json` is the file to share with the team.

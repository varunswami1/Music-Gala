"""Shared helpers for the data scripts (standard library only). Owner: Person 5."""
import json, re, string, sys, time, unicodedata, urllib.error, urllib.parse, urllib.request
from pathlib import Path

PUNCT = str.maketrans("", "", string.punctuation)
ROOT = Path(__file__).resolve().parent.parent


def norm(s):
    """Same normalisation as pipeline/enrich.py and src/data/recommend.ts, so matches agree everywhere."""
    s = unicodedata.normalize("NFKC", str(s)).lower().translate(PUNCT)
    return re.sub(r"\s+", " ", s).strip()


class Throttle:
    def __init__(self, interval):
        self.interval, self.last = interval, 0.0

    def wait(self):
        d = self.last + self.interval - time.monotonic()
        if d > 0:
            time.sleep(d)
        self.last = time.monotonic()


class Cache:
    """JSON file cache. Only real answers are stored (a miss that was a network failure is never cached), so re-running retries failures."""
    def __init__(self, path):
        self.path = Path(path); self.path.parent.mkdir(parents=True, exist_ok=True)
        self.d = json.loads(self.path.read_text(encoding="utf-8")) if self.path.exists() else {}
        self.dirty = 0

    def has(self, k): return k in self.d
    def get(self, k): return self.d.get(k)

    def set(self, k, v):
        self.d[k] = v; self.dirty += 1
        if self.dirty >= 20:
            self.save()

    def save(self):
        tmp = self.path.with_suffix(".tmp")
        tmp.write_text(json.dumps(self.d, ensure_ascii=False), encoding="utf-8")
        tmp.replace(self.path); self.dirty = 0


def get_json(url, params, throttle, user_agent, retries=3):
    """Returns parsed JSON, or None on failure (404 included). Never raises."""
    full = url + ("?" + urllib.parse.urlencode(params) if params else "")
    for i in range(retries):
        throttle.wait()
        try:
            req = urllib.request.Request(full, headers={"User-Agent": user_agent, "Accept": "application/json"})
            with urllib.request.urlopen(req, timeout=30) as r:
                return json.loads(r.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            if e.code in (404, 400):
                return None
            time.sleep(2 ** (i + 1))
        except Exception:
            time.sleep(2 ** (i + 1))
    return None


def load_library(path):
    return json.loads(Path(path).read_text(encoding="utf-8"))

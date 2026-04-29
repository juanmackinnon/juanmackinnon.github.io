#!/usr/bin/env python3
"""
fetch_news.py — Not-ITS-ias
Fetches RSS feeds, filters by relevance keywords, classifies by category,
and writes news.json for the static frontend.

Runs via GitHub Actions 3x/day.
"""

import feedparser
import json
import re
import hashlib
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime

# ============================================================
# FEEDS
# ============================================================
FEEDS = [
    {"name": "Traffic Technology Today", "url": "https://www.traffictechnologytoday.com/feed"},
    {"name": "ITS International",        "url": "https://www.itsinternational.com/rss.xml"},
    {"name": "Intelligent Transport",    "url": "https://www.intelligenttransport.com/feed"},
    {"name": "Smart Cities World",       "url": "https://www.smartcitiesworld.net/rss.xml"},
    {"name": "Smart Cities Dive",        "url": "https://www.smartcitiesdive.com/feeds/news"},
    {"name": "Cities Today",             "url": "https://cities-today.com/feed"},
    {"name": "AV International",         "url": "https://www.autonomousvehicleinternational.com/feed"},
    {"name": "Electrive",               "url": "https://www.electrive.com/feed"},
    {"name": "Mobility Portal",          "url": "https://mobilityportal.lat/feed"},
    {"name": "Toll Review",              "url": "https://www.tollreview.com/feed"},
    {"name": "IBTTA",                    "url": "https://www.ibtta.org/rss.xml"},
    {"name": "ERTICO ITS Europe",        "url": "https://ertico.com/feed"},
    {"name": "ITS America",             "url": "https://itsa.org/feed"},
]

# ============================================================
# RELEVANCE KEYWORDS (case-insensitive)
# ============================================================
RELEVANCE_KEYWORDS = [
    "traffic", "ITS", "intelligent transport", "smart city", "autonomous",
    "connected vehicle", "V2X", "C-ITS", "tolling", "mobility", "transport",
    "infrastructure", "sensor", "enforcement", "corridor", "highway",
    "intersection", "fleet", "ATMS", "signal", "pedestrian", "road safety",
    "urban mobility", "MaaS", "EV charging", "tráfico", "transporte",
    "movilidad", "peaje", "ciudad inteligente", "vehículo autónomo",
    "infraestructura vial", "smart mobility", "vehicle", "road", "transit",
    "congestion", "tunnel", "freeway", "expressway", "toll", "CAV",
    "cooperative", "automated", "electromobility", "micromobility",
    "bike share", "scooter", "public transport", "bus rapid",
]

# Build compiled regex for speed
_relevance_pattern = re.compile(
    "|".join(re.escape(kw) for kw in RELEVANCE_KEYWORDS),
    re.IGNORECASE
)

# ============================================================
# CATEGORY RULES
# ============================================================
CATEGORY_RULES = {
    "autonomos": [
        r"\bAV\b", r"autonomous vehicle", r"self.driving", r"driverless",
        r"ADAS", r"\bV2X\b", r"\bC.ITS\b", r"connected vehicle",
        r"cooperative driving", r"automated vehicle", r"\bCAV\b",
        r"vehicle.to.everything", r"platooning",
    ],
    "trafico": [
        r"\bATMS\b", r"traffic management", r"traffic signal",
        r"traffic control", r"intersection", r"congestion",
        r"semáforo", r"enforcement", r"speed camera",
        r"red light", r"traffic flow", r"incident detection",
        r"variable message", r"\bVMS\b", r"traffic light",
    ],
    "infraestructura": [
        r"toll", r"tolling", r"peaje", r"tunnel", r"highway",
        r"motorway", r"freeway", r"expressway", r"autopista",
        r"road infrastructure", r"bridge", r"obra vial",
        r"road construction", r"gantry", r"barrier",
    ],
    "movilidad": [
        r"\bEV\b", r"electric vehicle", r"EV charging",
        r"MaaS", r"mobility.as.a.service", r"micromobility",
        r"e.scooter", r"bike.share", r"first.mile", r"last.mile",
        r"shared mobility", r"ride.hail", r"public transport",
        r"bus rapid transit", r"\bBRT\b", r"metro", r"tram",
        r"electromobility", r"fleet electrification",
    ],
    "smartcities": [
        r"smart city", r"smart cities", r"ciudad inteligente",
        r"digital twin", r"urban sensor", r"IoT", r"urban data",
        r"city platform", r"govtech", r"smart infrastructure",
        r"connected city", r"urban mobility platform",
    ],
    "regulacion": [
        r"regulation", r"standard", r"legislation", r"policy",
        r"funding", r"grant", r"government", r"ministry",
        r"normativa", r"financiamiento", r"public tender",
        r"ISO \d+", r"ETSI", r"directive", r"compliance",
    ],
    "industria": [
        r"acquisition", r"merger", r"contract", r"awarded",
        r"partnership", r"investment", r"startup", r"IPO",
        r"tender", r"licitación", r"deal", r"signed",
        r"agreement", r"company", r"launches", r"appoints",
    ],
}

_category_patterns = {
    cat: [re.compile(p, re.IGNORECASE) for p in patterns]
    for cat, patterns in CATEGORY_RULES.items()
}

# ============================================================
# HELPERS
# ============================================================

def strip_html(text: str) -> str:
    text = re.sub(r"<[^>]+>", " ", text or "")
    text = text.replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">")
    text = text.replace("&nbsp;", " ").replace("&#8217;", "'").replace("&#8220;", '"').replace("&#8221;", '"')
    return re.sub(r"\s+", " ", text).strip()


def parse_date(entry) -> str:
    for field in ("published", "updated"):
        raw = entry.get(f"{field}_parsed") or entry.get(field)
        if raw:
            try:
                if isinstance(raw, str):
                    dt = parsedate_to_datetime(raw)
                else:
                    dt = datetime(*raw[:6], tzinfo=timezone.utc)
                return dt.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
            except Exception:
                continue
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def make_id(url: str) -> str:
    return hashlib.md5(url.encode()).hexdigest()[:12]


def is_relevant(title: str, description: str) -> bool:
    text = f"{title} {description}"
    return bool(_relevance_pattern.search(text))


def classify(title: str, description: str) -> str:
    text = f"{title} {description}"
    for cat, patterns in _category_patterns.items():
        for p in patterns:
            if p.search(text):
                return cat
    return "industria"


def get_image(entry) -> str | None:
    if hasattr(entry, "media_thumbnail") and entry.media_thumbnail:
        return entry.media_thumbnail[0].get("url")
    if hasattr(entry, "media_content") and entry.media_content:
        for m in entry.media_content:
            if m.get("medium") == "image" or m.get("type", "").startswith("image"):
                return m.get("url")
    if hasattr(entry, "enclosures") and entry.enclosures:
        for enc in entry.enclosures:
            if enc.get("type", "").startswith("image"):
                return enc.get("url") or enc.get("href")
    for field in ("content", "summary"):
        val = entry.get(field, "")
        if isinstance(val, list):
            val = val[0].get("value", "") if val else ""
        m = re.search(r'<img[^>]+src=["\']([^"\']+)["\']', val or "")
        if m:
            return m.group(1)
    return None

# ============================================================
# FETCH + PROCESS
# ============================================================

def fetch_feed(feed_meta: dict) -> list[dict]:
    articles = []
    try:
        parsed = feedparser.parse(feed_meta["url"], request_headers={"User-Agent": "Not-ITS-ias/1.0"})
        if parsed.bozo and not parsed.entries:
            print(f"  ⚠ Bozo feed: {feed_meta['name']}")
            return []

        for entry in parsed.entries[:30]:
            title = strip_html(entry.get("title", ""))
            summary = strip_html(entry.get("summary", "") or entry.get("description", ""))
            link = entry.get("link", "")

            if not title or not link:
                continue

            if not is_relevant(title, summary):
                continue

            articles.append({
                "id":          make_id(link),
                "title":       title,
                "summary":     summary[:300] + ("…" if len(summary) > 300 else ""),
                "url":         link,
                "source":      feed_meta["name"],
                "date":        parse_date(entry),
                "category":    classify(title, summary),
                "image":       get_image(entry),
            })

    except Exception as e:
        print(f"  ✗ Error fetching {feed_meta['name']}: {e}")

    return articles


def deduplicate(articles: list[dict]) -> list[dict]:
    seen = {}
    for a in articles:
        aid = a["id"]
        if aid not in seen or a["date"] > seen[aid]["date"]:
            seen[aid] = a
    return list(seen.values())


def pick_destacadas(articles: list[dict], n: int = 10) -> list[dict]:
    sorted_all = sorted(articles, key=lambda x: x["date"], reverse=True)
    return sorted_all[:n]


def build_news_json(articles: list[dict]) -> dict:
    articles = sorted(articles, key=lambda x: x["date"], reverse=True)

    categories = {
        "destacadas": [],
        "trafico": [],
        "smartcities": [],
        "movilidad": [],
        "autonomos": [],
        "infraestructura": [],
        "industria": [],
        "regulacion": [],
    }

    for a in articles:
        cat = a["category"]
        if cat in categories:
            categories[cat].append(a)

    categories["destacadas"] = pick_destacadas(articles, 10)

    stats = {
        "total":    len(articles),
        "by_category": {k: len(v) for k, v in categories.items() if k != "destacadas"},
        "by_source": {},
        "updated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    }
    for a in articles:
        stats["by_source"][a["source"]] = stats["by_source"].get(a["source"], 0) + 1

    return {
        "version":    "1.0",
        "updated_at": stats["updated_at"],
        "stats":      stats,
        "categories": categories,
    }

# ============================================================
# MAIN
# ============================================================

def main():
    print(f"\n{'='*60}")
    print(f"  Not-ITS-ias fetch — {datetime.now(timezone.utc).isoformat()}")
    print(f"{'='*60}\n")

    all_articles = []

    for feed in FEEDS:
        print(f"→ Fetching: {feed['name']}")
        articles = fetch_feed(feed)
        print(f"  ✓ {len(articles)} relevant articles")
        all_articles.extend(articles)

    all_articles = deduplicate(all_articles)
    print(f"\n✓ Total after dedup: {len(all_articles)} articles")

    news = build_news_json(all_articles)

    with open("not-ITS-ias/news.json", "w", encoding="utf-8") as f:
        json.dump(news, f, ensure_ascii=False, indent=2)

    print(f"\n✓ news.json written — {news['stats']['total']} articles across {len(news['categories'])} categories")
    print(f"  Updated at: {news['updated_at']}\n")


if __name__ == "__main__":
    main()

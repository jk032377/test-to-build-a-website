#!/usr/bin/env python3
from __future__ import annotations

import html
import mimetypes
import re
import sys
from pathlib import Path
from urllib.parse import urljoin, urlparse, unquote

import requests
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
POSTS_DIR = ROOT / "_posts"
IMG_ROOT = ROOT / "assets" / "images" / "mukai"
BASE = "https://mukaiword.com"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; MukaiWordMigration/1.0; +https://mukaiword.com)"
}

POSTS = [
    {
        "id": 1850,
        "date": "2025-06-15",
        "slug": "youth-creation-award-meeting-2025",
        "category": "創作現場",
        "tone": "sand",
        "description": "文化部青年創作獎勵交流會側記：從詩、散文、小說到出版，整理創作者與評審現場分享。",
    },
    {
        "id": 1818,
        "date": "2024-12-15",
        "slug": "natural-unnatural-poetry-selection",
        "category": "文學閱讀",
        "tone": "sage",
        "description": "從自然到不自然：城市、科技、環境與人，如何在詩裡重新形成一條光譜。",
    },
    {
        "id": 1686,
        "date": "2023-10-07",
        "slug": "the-boy-and-the-heron-review",
        "category": "電影札記",
        "tone": "blue",
        "description": "從真人與蒼鷺、三代角色、火美與夏子，拆解《蒼鷺與少年》裡謊言、真心與成長的結構。",
    },
    {
        "id": 1609,
        "date": "2023-09-02",
        "slug": "confidence-iceberg",
        "category": "創作方法",
        "tone": "clay",
        "description": "當創作走到低潮，先別急著逼自己產出；從信心冰山重新看見那些已經累積、卻暫時看不見的部分。",
    },
    {
        "id": 1601,
        "date": "2023-08-31",
        "slug": "how-to-sit-down-and-write-poetry",
        "category": "創作方法",
        "tone": "rose",
        "description": "不靠複雜儀式，把一段時間真正留給寫作：詩集《城市燈塔》的改稿紀錄與工作方法。",
    },
]

KEEP_TAGS = {
    "p","h2","h3","h4","ul","ol","li","blockquote","strong","b","em","i",
    "a","br","hr","figure","figcaption","img","div","span","code","pre"
}

def safe_yaml(value: str) -> str:
    return '"' + value.replace("\\", "\\\\").replace('"', '\\"').replace("\n", " ") + '"'

def request(url: str) -> requests.Response:
    r = requests.get(url, headers=HEADERS, timeout=45)
    r.raise_for_status()
    return r

def select_content(soup: BeautifulSoup):
    selectors = [
        ".entry-content",
        ".post-content",
        ".wp-block-post-content",
        "article .content",
        "main article .entry-content",
    ]
    for sel in selectors:
        node = soup.select_one(sel)
        if node and len(node.get_text(" ", strip=True)) > 100:
            return node
    article = soup.find("article")
    if article:
        return article
    main = soup.find("main")
    if main:
        return main
    raise RuntimeError("Cannot locate article content")

def clean_filename(url: str, fallback: str) -> str:
    name = unquote(Path(urlparse(url).path).name) or fallback
    name = re.sub(r"[^A-Za-z0-9._-]+", "-", name).strip("-")
    return name or fallback

def extension_from_response(resp, filename):
    ext = Path(filename).suffix.lower()
    if ext in {".jpg",".jpeg",".png",".webp",".gif",".avif"}:
        return filename
    ctype = resp.headers.get("content-type","").split(";")[0]
    ext = mimetypes.guess_extension(ctype) or ".jpg"
    return filename + ext

def download_image(src: str, out_dir: Path, preferred_name: str | None = None) -> str | None:
    try:
        src = urljoin(BASE, src)
        resp = request(src)
        if not resp.headers.get("content-type","").startswith("image/"):
            return None
        filename = preferred_name or clean_filename(src, "image.jpg")
        filename = extension_from_response(resp, filename)
        target = out_dir / filename
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(resp.content)
        return filename
    except Exception as exc:
        print(f"[image warning] {src}: {exc}", file=sys.stderr)
        return None

def strip_attrs(tag):
    if tag.name == "a":
        href = tag.get("href")
        tag.attrs = {"href": href} if href else {}
    elif tag.name == "img":
        allowed = {}
        for key in ("src","alt","title","loading"):
            if tag.get(key):
                allowed[key] = tag.get(key)
        tag.attrs = allowed
    else:
        tag.attrs = {}

def migrate(spec):
    page_url = f"{BASE}/?p={spec['id']}"
    print(f"Migrating {page_url}")
    soup = BeautifulSoup(request(page_url).text, "html.parser")

    title_el = soup.find("h1")
    if not title_el:
        raise RuntimeError(f"No title for {page_url}")
    title = title_el.get_text(" ", strip=True)

    content = select_content(soup)

    # Remove common WordPress extras if they slipped into the article container.
    for selector in [
        "script","style","noscript","form",".sharedaddy",".jp-relatedposts",
        ".post-tags",".entry-footer",".author-bio",".comments-area",".sd-sharing-enabled",
        ".wp-block-jetpack-contact-info"
    ]:
        for node in content.select(selector):
            node.decompose()

    # Avoid duplicating the page title when fallback selection picked a wider article node.
    for h1 in content.find_all("h1"):
        if h1.get_text(" ", strip=True) == title:
            h1.decompose()
        else:
            h1.name = "h2"

    out_dir = IMG_ROOT / str(spec["id"])
    out_dir.mkdir(parents=True, exist_ok=True)

    # Download every article image and rewrite it to a repo-local Liquid-aware URL.
    first_local = None
    for idx, img in enumerate(content.find_all("img"), start=1):
        src = img.get("data-lazy-src") or img.get("data-src") or img.get("src")
        if (not src or src.startswith("data:")) and img.get("srcset"):
            src = img.get("srcset").split(",")[-1].strip().split(" ")[0]
        if not src or src.startswith("data:"):
            continue
        filename = download_image(src, out_dir, preferred_name=clean_filename(src, f"image-{idx}.jpg"))
        if not filename:
            continue
        local = f"/assets/images/mukai/{spec['id']}/{filename}"
        if first_local is None:
            first_local = local
        img["src"] = "{{ '" + local + "' | relative_url }}"
        img.attrs.pop("srcset", None)
        img.attrs.pop("sizes", None)

    # Prefer Open Graph featured image as article cover.
    cover = None
    og = soup.find("meta", attrs={"property":"og:image"})
    if og and og.get("content"):
        src = og["content"]
        filename = download_image(src, out_dir, preferred_name="cover" + (Path(urlparse(src).path).suffix or ".jpg"))
        if filename:
            cover = f"/assets/images/mukai/{spec['id']}/{filename}"
    cover = cover or first_local

    # Keep semantic HTML but remove WordPress-only styling/classes.
    for tag in list(content.find_all(True)):
        if tag.name not in KEEP_TAGS:
            tag.unwrap()
        else:
            strip_attrs(tag)

    # Remove empty wrappers and tracking pixels.
    for img in content.find_all("img"):
        src = img.get("src","")
        if "emoji" in src or "pixel" in src:
            img.decompose()

    body = "".join(str(child) for child in content.children).strip()

    front = [
        "---",
        "layout: post",
        f"title: {safe_yaml(title)}",
        f"description: {safe_yaml(spec['description'])}",
        f"category: {spec['category']}",
        f"tone: {spec['tone']}",
        "cover_word: MUKAI",
        "migrated: true",
        f"legacy_id: {spec['id']}",
        f"legacy_url: {safe_yaml(page_url)}",
    ]
    if cover:
        front.append(f"image: {cover}")
        front.append(f"image_alt: {safe_yaml(title)}")
    front.extend(["---",""])

    target = POSTS_DIR / f"{spec['date']}-{spec['slug']}.md"
    target.write_text("\n".join(front) + body + "\n", encoding="utf-8")
    print(f"  -> {target.relative_to(ROOT)}")

def main():
    POSTS_DIR.mkdir(exist_ok=True)
    IMG_ROOT.mkdir(parents=True, exist_ok=True)
    failures = []
    for spec in POSTS:
        try:
            migrate(spec)
        except Exception as exc:
            failures.append((spec["id"], str(exc)))
            print(f"[FAILED] {spec['id']}: {exc}", file=sys.stderr)
    if failures:
        raise SystemExit("Migration failures: " + ", ".join(f"{pid}: {err}" for pid, err in failures))
    print("Migration complete.")

if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Generate unique 16:9 systems-blueprint covers for catalog posts."""
from __future__ import annotations

import hashlib
import json
import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
POSTS = json.loads((ROOT / "blog" / "posts.json").read_text())
OUT = ROOT / "blog" / "assets" / "covers"
OUT.mkdir(parents=True, exist_ok=True)

W, H = 1200, 675
BG = (10, 15, 29)
FONT_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
FONT_REG = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
FONT_MONO = "/usr/share/fonts/truetype/jetbrains-mono/JetBrainsMono-Regular.ttf"

PALETTES = [
    ((56, 189, 248), (167, 139, 250)),  # cyan / purple
    ((52, 211, 153), (56, 189, 248)),  # emerald / cyan
    ((167, 139, 250), (244, 114, 182)),  # purple / pink
    ((251, 191, 36), (56, 189, 248)),  # amber / cyan
    ((45, 212, 191), (129, 140, 248)),  # teal / indigo
    ((248, 113, 113), (167, 139, 250)),  # coral / purple
]


def rng_vals(slug: str):
    h = hashlib.sha256(slug.encode()).digest()
    return h


def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def wrap(text: str, font: ImageFont.FreeTypeFont, max_w: int, draw: ImageDraw.ImageDraw) -> list[str]:
    words = text.split()
    lines, cur = [], ""
    for w in words:
        trial = (cur + " " + w).strip()
        if draw.textlength(trial, font=font) <= max_w:
            cur = trial
        else:
            if cur:
                lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines[:5]


def draw_grid(draw: ImageDraw.ImageDraw, accent, alpha=28):
    step = 36
    col = (*accent, alpha)
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    g = ImageDraw.Draw(overlay)
    for x in range(0, W, step):
        g.line([(x, 0), (x, H)], fill=col, width=1)
    for y in range(0, H, step):
        g.line([(0, y), (W, y)], fill=col, width=1)
    return overlay


def draw_graph(draw: ImageDraw.ImageDraw, seed: bytes, accent, accent2, variant: int):
    n = 10 + (seed[4] % 8)
    cx, cy = 340, 340
    pts = []
    for i in range(n):
        ang = (i / n) * math.tau + (seed[5] / 255) * 0.7
        r = 90 + (seed[(6 + i) % 32] % 160)
        if variant % 3 == 1:
            r = 70 + 18 * (i % 5) + (seed[i % 32] % 40)
        x = int(cx + math.cos(ang) * r * (0.85 if i % 2 else 1.15))
        y = int(cy + math.sin(ang) * r * 0.72)
        pts.append((x, y, 8 + (seed[(8 + i) % 32] % 10)))
    for i, (x, y, rad) in enumerate(pts):
        j = (i + 1 + (seed[i % 32] % 3)) % n
        x2, y2, _ = pts[j]
        draw.line([(x, y), (x2, y2)], fill=accent if i % 2 == 0 else accent2, width=2)
        k = (i + 3) % n
        draw.line([(x, y), pts[k][:2]], fill=accent2, width=1)
    for i, (x, y, rad) in enumerate(pts):
        color = accent if i % 2 == 0 else accent2
        draw.ellipse([x - rad, y - rad, x + rad, y + rad], outline=color, width=2)
        if i % 3 == 0:
            draw.ellipse([x - 3, y - 3, x + 3, y + 3], fill=color)


def draw_hex(draw: ImageDraw.ImageDraw, seed: bytes, accent, accent2):
    size = 28
    cols, rows = 11, 9
    for row in range(rows):
        for col in range(cols):
            x = 48 + col * size * 1.7 + (size if row % 2 else 0)
            y = 70 + row * size * 1.5
            if x > 620:
                continue
            jitter = seed[(row * cols + col) % 32] / 255
            if jitter < 0.35:
                continue
            color = accent if (row + col) % 2 == 0 else accent2
            pts = []
            for a in range(6):
                ang = math.tau * a / 6 + math.pi / 6
                pts.append((x + math.cos(ang) * size, y + math.sin(ang) * size))
            draw.polygon(pts, outline=color)
            if jitter > 0.82:
                draw.ellipse([x - 4, y - 4, x + 4, y + 4], fill=color)


def draw_circuit(draw: ImageDraw.ImageDraw, seed: bytes, accent, accent2):
    for i in range(14):
        x1 = 40 + (seed[i] % 40)
        y1 = 80 + i * 38
        x2 = 120 + (seed[(i + 3) % 32] % 420)
        y2 = y1
        y3 = 80 + ((i * 3 + seed[7]) % 12) * 38
        draw.line([(x1, y1), (x2, y1), (x2, y3)], fill=accent if i % 2 == 0 else accent2, width=2)
        draw.rectangle([x2 - 6, y3 - 6, x2 + 6, y3 + 6], outline=accent2, width=2)
        if i % 2 == 0:
            draw.ellipse([x1 - 5, y1 - 5, x1 + 5, y1 + 5], fill=accent)


def draw_isometric(draw: ImageDraw.ImageDraw, seed: bytes, accent, accent2):
    for i in range(9):
        x = 90 + (i % 3) * 150 + (seed[i] % 20)
        y = 140 + (i // 3) * 140
        s = 46 + seed[(i + 2) % 32] % 18
        top = [(x, y - s // 2), (x + s, y), (x, y + s // 2), (x - s, y)]
        draw.polygon(top, outline=accent)
        left = [(x - s, y), (x, y + s // 2), (x, y + s), (x - s, y + s // 2)]
        draw.polygon(left, outline=accent2)
        right = [(x + s, y), (x, y + s // 2), (x, y + s), (x + s, y + s // 2)]
        draw.polygon(right, outline=accent)


def render_cover(post: dict) -> Image.Image:
    slug = post["slug"]
    seed = rng_vals(slug)
    accent, accent2 = PALETTES[seed[0] % len(PALETTES)]
    variant = seed[1] % 4

    base = Image.new("RGB", (W, H), BG)
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    grid = draw_grid(od, accent)
    img = Image.alpha_composite(base.convert("RGBA"), grid)
    d = ImageDraw.Draw(img)

    # vignette spine
    d.rectangle([628, 0, 636, H], fill=(*accent, 110))
    for y in range(0, H, 10):
        d.ellipse([620, y, 644, y + 8], outline=accent2)

    if variant == 0:
        draw_graph(d, seed, accent, accent2, variant)
    elif variant == 1:
        draw_hex(d, seed, accent, accent2)
    elif variant == 2:
        draw_circuit(d, seed, accent, accent2)
    else:
        draw_isometric(d, seed, accent, accent2)

    title_font_size = 36
    title_font = ImageFont.truetype(FONT_BOLD, title_font_size)
    kicker_font = ImageFont.truetype(FONT_MONO, 14)
    tag_font = ImageFont.truetype(FONT_REG, 13)
    brand_font = ImageFont.truetype(FONT_MONO, 12)

    d.text((668, 48), "SYSTEMS ARCHITECTURE ESSAY", font=kicker_font, fill=accent)
    lines = wrap(post["title"], title_font, 480, d)
    while len(lines) > 4 and title_font_size > 26:
        title_font_size -= 2
        title_font = ImageFont.truetype(FONT_BOLD, title_font_size)
        lines = wrap(post["title"], title_font, 480, d)

    y = 92
    for line in lines:
        d.text((668, y), line, font=title_font, fill=(243, 244, 246))
        y += title_font_size + 8

    y += 16
    d.line([(668, y), (1140, y)], fill=accent, width=2)
    y += 22
    tags = (post.get("tags") or [])[:3]
    x = 668
    for tag in tags:
        tw = d.textlength(tag, font=tag_font)
        d.rounded_rectangle([x, y, x + tw + 18, y + 26], radius=6, outline=accent2, width=1)
        d.text((x + 9, y + 5), tag, font=tag_font, fill=(226, 232, 240))
        x += tw + 28

    d.text((668, 628), "AKMAL KHAN  ·  ENGINEERING PUBLICATION", font=brand_font, fill=(148, 163, 184))
    return img.convert("RGB")


def main():
    preserve = {
        "async-request-apis-nextjs-15-cookies-headers-params-concurrency",
        "deconstructing-react-flight-protocol-rsc-wire-format-streaming",
        "nextjs-self-hosting-kubernetes-docker-cache-handlers-fargate",
        "nodejs-event-loop-trap-react-server-components-cpu-starvation",
        "partial-prerendering-dynamicio-hybrid-http-streams-nextjs",
        "react-19-resource-loading-float-activity-offscreen-viewport-memory",
        "react-compiler-vs-signals-fine-grained-reactivity-ast-tradeoffs",
        "server-action-security-attack-surface-full-stack-rpc-threat-model",
        "the-great-un-caching-nextjs-15-caching-architecture-defaults",
    }
    written = 0
    skipped = 0
    for p in POSTS:
        dest = OUT / f"{p['slug']}.jpg"
        if p["slug"] in preserve and dest.exists():
            skipped += 1
            continue
        cover = render_cover(p)
        cover.save(dest, "JPEG", quality=84, optimize=True)
        written += 1
    print(json.dumps({"written": written, "preserved_custom": skipped, "total": len(POSTS)}))


if __name__ == "__main__":
    main()

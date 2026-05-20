#!/usr/bin/env python3
"""Remove edge-connected off-white / paper matte from RGBA PNGs (numpy + ffmpeg)."""
from __future__ import annotations

import subprocess
import sys
from collections import deque
from pathlib import Path

import numpy as np


def ffprobe_wh(path: Path) -> tuple[int, int]:
    out = subprocess.run(
        [
            "ffprobe",
            "-v",
            "error",
            "-select_streams",
            "v:0",
            "-show_entries",
            "stream=width,height",
            "-of",
            "csv=p=0:s=x",
            str(path),
        ],
        capture_output=True,
        text=True,
        check=True,
    ).stdout.strip()
    w, h = out.split("x")
    return int(w), int(h)


def read_rgba(path: Path) -> np.ndarray:
    w, h = ffprobe_wh(path)
    raw = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", str(path), "-f", "rawvideo", "-pix_fmt", "rgba", "-"],
        capture_output=True,
        check=True,
    ).stdout
    expected = w * h * 4
    if len(raw) != expected:
        raise RuntimeError(f"size mismatch {path}: got {len(raw)} want {expected}")
    return np.frombuffer(raw, dtype=np.uint8).reshape((h, w, 4))


def write_rgba(path: Path, arr: np.ndarray) -> None:
    h, w, _ = arr.shape
    raw = arr.tobytes()
    subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-f",
            "rawvideo",
            "-pix_fmt",
            "rgba",
            "-s",
            f"{w}x{h}",
            "-i",
            "pipe:0",
            "-frames:v",
            "1",
            str(path),
        ],
        input=raw,
        check=True,
        capture_output=True,
    )


def edge_connected_paper_mask(rgb: np.ndarray, alpha: np.ndarray) -> np.ndarray:
    """True = pixel made fully transparent (edge-connected paper / matte)."""
    r = rgb[:, :, 0].astype(np.float32)
    g = rgb[:, :, 1].astype(np.float32)
    b = rgb[:, :, 2].astype(np.float32)
    mx = np.maximum(np.maximum(r, g), b)
    mn = np.minimum(np.minimum(r, g), b)
    chroma = mx - mn
    lum = 0.299 * r + 0.587 * g + 0.114 * b
    sat = np.divide(mx - mn, mx, out=np.zeros_like(mx), where=mx > 1e-3)

    # Near-neutral bright (AI white / gray paper), without eating saturated UI colors.
    neutral_paper = (chroma < 22.0) & (lum >= 236.0)
    # Extra-tight pure highlights
    pureish = (lum >= 250.0) & (sat <= 0.12)

    removable_color = neutral_paper | pureish

    h, w = alpha.shape
    passable = (alpha < 8) | removable_color

    visited = np.zeros((h, w), dtype=np.bool_)
    transparent = np.zeros((h, w), dtype=np.bool_)
    q: deque[tuple[int, int]] = deque()

    for x in range(w):
        q.append((x, 0))
        q.append((x, h - 1))
    for y in range(h):
        q.append((0, y))
        q.append((w - 1, y))

    while q:
        x, y = q.popleft()
        if visited[y, x]:
            continue
        visited[y, x] = True
        if not passable[y, x]:
            continue
        transparent[y, x] = True
        if x > 0 and not visited[y, x - 1]:
            q.append((x - 1, y))
        if x + 1 < w and not visited[y, x + 1]:
            q.append((x + 1, y))
        if y > 0 and not visited[y - 1, x]:
            q.append((x, y - 1))
        if y + 1 < h and not visited[y + 1, x]:
            q.append((x, y + 1))

    return transparent


def process_file(path: Path) -> None:
    arr = read_rgba(path).copy()
    rgb = arr[:, :, :3]
    a = arr[:, :, 3]
    mask = edge_connected_paper_mask(rgb, a)
    arr[:, :, 3] = np.where(mask, 0, a).astype(np.uint8)
    arr[mask, 0:3] = 0
    write_rgba(path, arr)


def main() -> int:
    project = Path(__file__).resolve().parents[1]
    roots = [
        project / "assets/bundles/module/watermelonMinGame/ui/auto",
        project / "assets/bundles/module/watermelonMinGame/ui",
        project / "assets/resources/ui",
    ]
    paths: list[Path] = []
    for root in roots:
        if not root.is_dir():
            continue
        paths.extend(sorted(root.glob("*shuimo*.png")))

    # de-dupe
    seen: set[Path] = set()
    uniq: list[Path] = []
    for p in paths:
        rp = p.resolve()
        if rp not in seen:
            seen.add(rp)
            uniq.append(p)

    for p in uniq:
        process_file(p)
        print("ok", p.relative_to(Path(__file__).resolve().parents[1]))
    return 0


if __name__ == "__main__":
    sys.exit(main())

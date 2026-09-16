"""Measure shift, palette match, and shoulder width variance between directions & reactions WebPs.
Outputs JSON: { "shift": float, "paletteMatch": float, "widthChange": float, "verdict": str }
Usage: python3 verify.py <name>
"""
import json
import os
import sys
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.environ.get('MASCOT_ROOT', os.getcwd())
DEST = os.environ.get('MASCOT_DEST', os.path.join(ROOT, 'public', 'mascots'))
DISPLAY = 140.0
SEARCH = 24


def cells(path):
    im = Image.open(path).convert('RGBA')
    t = im.size[0] // 3
    return t, [np.array(im.crop(((i % 3) * t, (i // 3) * t, (i % 3 + 1) * t, (i // 3 + 1) * t)))
               for i in range(9)]


def body(cell):
    opaque = cell[..., 3] > 120
    labels, count = ndimage.label(opaque)
    if count == 0:
        return opaque
    return labels == int(np.argmax(ndimage.sum(opaque, labels, range(1, count + 1)))) + 1


def lower_band(mask):
    band = np.zeros_like(mask)
    top = int(mask.shape[0] * 0.55)
    bottom = int(mask.shape[0] * 0.78)
    band[top:bottom] = mask[top:bottom]
    return band


def best_shift(ref, other):
    scores = []
    for dy in range(-SEARCH, SEARCH + 1):
        shifted = np.roll(other, dy, axis=0)
        if dy > 0:
            shifted[:dy] = False
        elif dy < 0:
            shifted[dy:] = False
        union = (shifted | ref).sum()
        scores.append(((shifted & ref).sum() / max(union, 1), dy))
    return max(scores)


def palette(cells_list):
    counts = np.zeros(4096, dtype=np.float64)
    for cell in cells_list:
        mask = body(cell) & (cell[..., 3] > 200)
        if not mask.any():
            continue
        rgb = (cell[mask][:, :3] // 16).astype(np.int32)
        counts += np.bincount(rgb[:, 0] * 256 + rgb[:, 1] * 16 + rgb[:, 2],
                              minlength=4096).astype(np.float64)
    total = counts.sum()
    return counts / total if total else counts


def shoulder_width(cells_list):
    widths = []
    for cell in cells_list:
        mask = body(cell)
        rows = np.where(mask.any(axis=1))[0]
        if not len(rows):
            continue
        band = mask[rows.min() + int((rows.max() - rows.min()) * 0.85):rows.max() + 1]
        if band.any():
            widths.append(band.sum(axis=1).max())
    return float(np.mean(widths)) if widths else 0.0


def main():
    if len(sys.argv) < 2:
        sys.exit(1)
    name = sys.argv[1]
    dir_path = os.path.join(DEST, f'{name}-directions.webp')
    react_path = os.path.join(DEST, f'{name}-reactions.webp')

    if not os.path.exists(dir_path) or not os.path.exists(react_path):
        print(json.dumps({"error": "WebP files missing"}))
        sys.exit(1)

    tile, directions = cells(dir_path)
    _, reactions = cells(react_path)
    scale = DISPLAY / float(tile)

    ref = lower_band(body(directions[4]))
    results = [best_shift(ref, lower_band(body(c))) for c in reactions]
    shift = max(abs(dy) for _, dy in results) * scale
    overlap = min(score for score, _ in results)

    match = float(np.minimum(palette(directions), palette(reactions)).sum())
    dw, rw = shoulder_width(directions), shoulder_width(reactions)
    width = abs(rw - dw) / max(dw, 1.0)

    verdict = "PASS" if shift <= 2.0 and match >= 0.22 and width <= 0.12 else "MARGINAL"

    output = {
        "shift": round(float(shift), 2),
        "paletteMatch": round(float(match) * 100.0, 1),
        "widthChange": round(float(width) * 100.0, 1),
        "overlap": round(float(overlap) * 100.0, 1),
        "verdict": verdict
    }
    print(json.dumps(output))


if __name__ == '__main__':
    main()

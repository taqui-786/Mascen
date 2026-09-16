"""Turn a character's two 3x3 source sheets into the two atlases in public/mascots.
Includes auto-mirror detection & column swap.
Usage: python3 build.py <name> [--anchor shoulders]
"""
import os
import sys
import tempfile
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

ROOT = os.environ.get('MASCOT_ROOT', os.getcwd())
SRC = os.environ.get('MASCOT_SRC', os.path.join(ROOT, 'characters'))
DEST = os.environ.get('MASCOT_DEST', os.path.join(ROOT, 'public', 'mascots'))
os.makedirs(DEST, exist_ok=True)

TILE = 360
HEAD_BAND = 0.55
BODY_BAND = 0.40
SHOULDER_BAND = 0.05
FACE_TOLERANCE = 34
SCALE_CLAMP = 0.10
MATCH_CLAMP = float(os.environ.get('MATCH_CLAMP', 0.20))
FIT_BAND = 0.86
SETTLE = 26
FADE_DEPTH = float(os.environ.get('FADE_DEPTH', 0.12))
BOTTOM_ANCHOR = 0.93
BLUR_RADII = [1.5, 3, 6, 12]


def drop_bleed(tile):
    a = np.array(tile)
    opaque = a[..., 3] > 40
    edges = np.concatenate([opaque[:2, :].ravel(), opaque[-2:, :].ravel(),
                            opaque[:, :2].ravel(), opaque[:, -2:].ravel()])
    if not edges.any():
        return tile
    labels, count = ndimage.label(opaque)
    if count == 0:
        return tile
    keep = int(np.argmax(ndimage.sum(opaque, labels, range(1, count + 1)))) + 1
    touching = set(np.unique(np.concatenate([
        labels[:2, :].ravel(), labels[-2:, :].ravel(),
        labels[:, :2].ravel(), labels[:, -2:].ravel(),
    ]))) - {0, keep}
    if not touching:
        return tile
    a[np.isin(labels, list(touching)), 3] = 0
    return Image.fromarray(a, 'RGBA')


def check_and_fix_mirror(im):
    """Check if directions sheet has inverted columns, and swap cols 0 and 2 if so."""
    W = im.size[0] // 3
    # Look at row 1, col 0 (left) and row 1, col 2 (right)
    left_cell = np.array(im.crop((0, W, W, 2 * W)))[..., 3] > 100
    right_cell = np.array(im.crop((2 * W, W, 3 * W, 2 * W)))[..., 3] > 100
    
    if left_cell.any() and right_cell.any():
        lx = np.where(left_cell)[1].mean() / W
        rx = np.where(right_cell)[1].mean() / W
        # If left cell's mass is noticeably to the right of right cell's mass, columns are inverted
        if lx > rx + 0.05:
            print("  -> auto-detected mirrored directions sheet! Swapping columns 0 and 2...")
            fixed = im.copy()
            for r in range(3):
                c0 = im.crop((0, r * W, W, (r + 1) * W))
                c2 = im.crop((2 * W, r * W, 3 * W, (r + 1) * W))
                fixed.paste(c2, (0, r * W))
                fixed.paste(c0, (2 * W, r * W))
            return fixed
    return im


def tiles(path, is_directions=False):
    sheet = Image.open(path).convert('RGBA')
    if is_directions:
        sheet = check_and_fix_mirror(sheet)
    w = sheet.size[0] // 3
    return w, [drop_bleed(sheet.crop((c * w, r * w, (c + 1) * w, (r + 1) * w)))
               for r in range(3) for c in range(3)]


def body_mask(opaque):
    labels, count = ndimage.label(opaque)
    if count == 0:
        return opaque
    sizes = ndimage.sum(opaque, labels, range(1, count + 1))
    return labels == int(np.argmax(sizes)) + 1


def anchor_box(tile, mode):
    a = np.array(tile)
    rgb, alpha = a[..., :3].astype(int), a[..., 3]
    opaque = alpha > 128
    body = body_mask(opaque)
    ys, xs = np.where(body)
    if not len(ys) or not len(xs):
        return 0, 0, tile.size[0], tile.size[1]

    if mode == 'shoulders':
        floor = ys.max()
        band = max(0, floor - int(alpha.shape[0] * SHOULDER_BAND))
        yy, xx = np.where(body[band:, :])
        if len(xx) and len(yy):
            return xx.min(), yy.min() + band, xx.max(), yy.max() + band

    return xs.min(), ys.min(), xs.max(), ys.max()


def blur_premultiplied(image, radius):
    a = np.array(image).astype(np.float32)
    alpha = a[..., 3:4] / 255.0
    colour = Image.fromarray(np.clip(a[..., :3] * alpha, 0, 255).astype(np.uint8), 'RGB')
    colour = colour.filter(ImageFilter.GaussianBlur(radius))
    faded = Image.fromarray(a[..., 3].astype(np.uint8), 'L').filter(ImageFilter.GaussianBlur(radius))
    blurred = np.array(colour).astype(np.float32)
    weight = np.array(faded).astype(np.float32)[..., None] / 255.0
    rgb = np.where(weight > 0.004, blurred / np.maximum(weight, 0.004), 0)
    return Image.fromarray(np.dstack([np.clip(rgb, 0, 255), weight[..., 0] * 255]).astype(np.uint8), 'RGBA')


def main():
    if len(sys.argv) < 2:
        sys.exit(1)
    name = sys.argv[1]
    mode = 'shoulders'
    if '--anchor' in sys.argv:
        mode = sys.argv[sys.argv.index('--anchor') + 1]

    W, direction_tiles = tiles(os.path.join(SRC, name, 'directions.png'), is_directions=True)
    _, reaction_tiles = tiles(os.path.join(SRC, name, 'reactions.png'), is_directions=False)

    boxes = [anchor_box(t, mode) for t in direction_tiles]
    target_cx = sum((b[0] + b[2]) / 2 for b in boxes) / 9
    target_cy = sum((b[1] + b[3]) / 2 for b in boxes) / 9
    target_w = max(sum(b[2] - b[0] for b in boxes) / 9, 1.0)

    widths = [b[2] - b[0] for b in boxes]
    anchor_noise = (max(widths) - min(widths)) / target_w
    clamp = SCALE_CLAMP if anchor_noise > 0.03 else 0.35

    PAD = W // 2

    def align(tile):
        box = anchor_box(tile, mode)
        bw = max(box[2] - box[0], 1)
        scale = min(1 + clamp, max(1 - clamp, target_w / bw))
        scaled = tile.resize((round(W * scale), round(W * scale)), Image.LANCZOS)
        cx, cy = (box[0] + box[2]) / 2 * scale, (box[1] + box[3]) / 2 * scale
        canvas = Image.new('RGBA', (W + 2 * PAD, W * 2 + 2 * PAD), (0, 0, 0, 0))
        canvas.alpha_composite(scaled, (PAD + round(target_cx - cx), PAD + round(target_cy - cy)))
        return canvas

    direction_frames = [align(t) for t in direction_tiles]
    reaction_frames = [align(t) for t in reaction_tiles]

    def silhouette(group):
        frames = []
        for frame in group:
            mask = body_mask(np.array(frame)[..., 3] > 100)
            rows = np.where(mask.any(axis=1))[0]
            if len(rows):
                cut = rows.min() + int((rows.max() - rows.min()) * FIT_BAND)
                body = np.zeros_like(mask)
                body[cut:rows.max() + 1] = mask[cut:rows.max() + 1]
                frames.append(body.astype(np.float32))
        if not frames:
            return np.zeros((W // 4, W // 4), dtype=np.float32)
        return np.mean(frames, axis=0)[::4, ::4]

    direction_mask = silhouette(direction_frames)
    reaction_mask = silhouette(reaction_frames)
    H, Wm = direction_mask.shape

    def overlap(scale, dy):
        zoomed = ndimage.zoom(reaction_mask, scale, order=1)
        canvas = np.zeros_like(direction_mask)
        oy = round((H - zoomed.shape[0]) / 2 + dy)
        ox = round((Wm - zoomed.shape[1]) / 2)
        sy, sx = max(0, -oy), max(0, -ox)
        ey = min(zoomed.shape[0], H - oy)
        ex = min(zoomed.shape[1], Wm - ox)
        if ey <= sy or ex <= sx:
            return 0.0
        canvas[oy + sy:oy + ey, ox + sx:ox + ex] = zoomed[sy:ey, sx:ex]
        union = np.maximum(canvas, direction_mask).sum()
        return float(np.minimum(canvas, direction_mask).sum() / max(union, 1e-6))

    best = max(((overlap(sc / 1000, dy), sc / 1000, dy)
                for sc in range(1000 - int(MATCH_CLAMP * 1000), 1000 + int(MATCH_CLAMP * 1000) + 1, 10)
                for dy in range(-30, 31, 2)), default=(0.5, 1.0, 0))
    score, correction, shift_quarter = best
    shift = shift_quarter * 4

    def match(frame):
        w, h = frame.size
        scaled = frame.resize((round(w * correction), round(h * correction)), Image.LANCZOS)
        canvas = Image.new('RGBA', (w, h), (0, 0, 0, 0))
        canvas.alpha_composite(scaled, (round((w - scaled.size[0]) / 2),
                                        round((h - scaled.size[1]) / 2) + shift))
        return canvas

    def lower_band(frame):
        mask = body_mask(np.array(frame)[..., 3] > 120)
        rows = np.where(mask.any(axis=1))[0]
        band = np.zeros_like(mask)
        if len(rows):
            start = rows.min() + int((rows.max() - rows.min()) * 0.66)
            band[start:rows.max() + 1] = mask[start:rows.max() + 1]
        return band

    def settle(frame, reference):
        band = lower_band(frame)
        best_val = (-1.0, 0)
        for dy in range(-SETTLE, SETTLE + 1):
            shifted = np.roll(band, dy, axis=0)
            if dy > 0:
                shifted[:dy] = False
            elif dy < 0:
                shifted[dy:] = False
            union = (shifted | reference).sum()
            best_val = max(best_val, ((shifted & reference).sum() / max(union, 1), dy))
        dy = best_val[1]
        if dy == 0:
            return frame
        canvas = Image.new('RGBA', frame.size, (0, 0, 0, 0))
        canvas.alpha_composite(frame, (0, dy))
        return canvas

    matched = [match(f) for f in reaction_frames]
    reference_band = lower_band(direction_frames[4])
    settled = [settle(f, reference_band) for f in matched]

    frames = direction_frames + settled

    bboxes = [f.getbbox() or (0, 0, W, W) for f in frames]
    top = min(b[1] for b in bboxes) - 8
    left = min(b[0] for b in bboxes)
    right = max(b[2] for b in bboxes)
    content_bottom = max(b[3] for b in bboxes)

    side = max(right - left + 16, round((content_bottom - top) / BOTTOM_ANCHOR))
    centre = (left + right) / 2
    crop_left = round(centre - side / 2)
    crop_top = content_bottom - round(BOTTOM_ANCHOR * side)
    crop = (crop_left, crop_top, crop_left + side, crop_top + side)
    S = side

    ys, xs = np.mgrid[0:S, 0:S].astype(np.float32)

    def bottom_fade(cropped):
        rows = np.where((np.array(cropped)[..., 3] > 40).any(axis=1))[0]
        end = rows.max() if len(rows) else S
        linear = np.clip((ys - (end - FADE_DEPTH * S)) / max(FADE_DEPTH * S, 1e-4), 0, 1)
        return linear * linear * (3 - 2 * linear)

    def dissolve(frame):
        stacked = frame.crop(crop)
        ramp = bottom_fade(stacked)
        for i, radius in enumerate(BLUR_RADII):
            band = np.clip((ramp - i / len(BLUR_RADII)) * len(BLUR_RADII), 0, 1)
            mask = Image.fromarray((band * 255).astype(np.uint8), 'L')
            stacked = Image.composite(blur_premultiplied(stacked, radius), stacked, mask)
        a = np.array(stacked).astype(np.float32)
        a[..., 3] *= 1 - ramp
        return Image.fromarray(a.astype(np.uint8), 'RGBA').resize((TILE, TILE), Image.LANCZOS)

    staged = []
    for kind, group in (('directions', frames[:9]), ('reactions', frames[9:])):
        atlas = Image.new('RGBA', (TILE * 3, TILE * 3), (0, 0, 0, 0))
        for i, frame in enumerate(group):
            atlas.paste(dissolve(frame), ((i % 3) * TILE, (i // 3) * TILE))
        fd, tmp = tempfile.mkstemp(suffix='.webp', dir=DEST)
        os.close(fd)
        atlas.save(tmp, quality=92, method=6)
        os.chmod(tmp, 0o644)
        staged.append((tmp, os.path.join(DEST, f'{name}-{kind}.webp'), kind))

    for tmp, final, kind in staged:
        os.replace(tmp, final)
        print(f"  built: {final} ({os.path.getsize(final) // 1024} KB)")

if __name__ == '__main__':
    main()

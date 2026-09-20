"""Turn a raw 3x3 logo exploration sheet into a clean, transparent 3x3 logo sheet.
Supports both solid backgrounds and simulated transparency checkerboards.
Slices 9 logo cells, extracts true alpha transparency, strips stray artifacts,
and centers each mark with generous margins.
Usage: python3 build_logo.py <input_path> <output_path> [--export-dir <dir>]
"""
import sys
import os
import numpy as np
from PIL import Image
from scipy import ndimage


def extract_logo_alpha(im):
    """Extract true transparent alpha from solid white or simulated checkerboard backdrops."""
    rgba = im.convert('RGBA')
    a = np.array(rgba)

    # 1. Native transparency check
    if (a[..., 3] < 20).mean() > 0.04:
        return rgba

    rgb = a[..., :3]
    rgb_f = rgb.astype(np.float32)
    H, W, _ = rgb.shape

    border = np.zeros((H, W), dtype=bool)
    border[0, :] = border[-1, :] = border[:, 0] = border[:, -1] = True

    # Check color variance across corners
    corners = np.array([rgb[0, 0], rgb[0, -1], rgb[-1, 0], rgb[-1, -1]], dtype=np.float32)
    corner_std = corners.std(axis=0).mean()

    channel_spread = np.max(rgb_f, axis=-1) - np.min(rgb_f, axis=-1)
    mean_lum = np.mean(rgb_f, axis=-1)

    if corner_std < 20:
        # Solid flat background (e.g. solid white or off-white)
        bg_ref = np.median(corners, axis=0)
        dist = np.sqrt(np.sum((rgb_f - bg_ref) ** 2, axis=-1))
        is_bg = dist < 45.0
    else:
        # Checkerboard simulated transparency (neutral grey and white squares)
        is_bg = (channel_spread < 16.0) & (mean_lum > 165.0)

    # Flood fill only components touching image boundaries
    labels, count = ndimage.label(is_bg)
    if count == 0:
        return rgba

    touching_border = np.unique(labels[border])
    touching_border = touching_border[touching_border > 0]
    if len(touching_border) == 0:
        return rgba

    bg_mask = np.isin(labels, touching_border)

    # Signed distance transform for edge anti-aliasing
    body = ~bg_mask
    dist_to_bg = ndimage.distance_transform_edt(body)
    dist_to_body = ndimage.distance_transform_edt(~body)
    signed_dist = dist_to_bg - dist_to_body

    feather = 1.2
    alpha = np.clip((signed_dist + feather) / (2.0 * feather), 0.0, 1.0) * 255.0

    a[..., 3] = alpha.astype(np.uint8)
    return Image.fromarray(a, 'RGBA')


def clean_cell_mark(cell):
    """Isolate the main logo mark inside a cell, dropping stray bleed and detached noise."""
    a = np.array(cell)
    opaque = a[..., 3] > 40

    labels, count = ndimage.label(opaque)
    if count == 0:
        return cell

    sizes = ndimage.sum(opaque, labels, range(1, count + 1))
    max_label = int(np.argmax(sizes)) + 1

    # Keep the largest component (the mark) and close connected elements
    main_ys, main_xs = np.where(labels == max_label)
    if len(main_ys) == 0:
        return cell

    main_y_min, main_y_max = main_ys.min(), main_ys.max()
    cell_h = cell.size[1]

    keep_labels = {max_label}
    for i in range(1, count + 1):
        if i == max_label:
            continue
        ys, xs = np.where(labels == i)
        if len(ys) == 0:
            continue
        comp_size = sizes[i - 1]
        comp_y_center = ys.mean()

        # Reject tiny bottom margin artifacts
        is_bottom_noise = (comp_y_center > cell_h * 0.78) and (comp_size < 500)
        if not is_bottom_noise and (comp_size > 20 or comp_y_center < main_y_max + 15):
            keep_labels.add(i)

    mask = np.isin(labels, list(keep_labels))
    a[~mask, 3] = 0
    return Image.fromarray(a, 'RGBA')


def build_logo_sheet(input_path, output_path, tile_size=360, export_dir=None):
    im = Image.open(input_path)
    sheet = extract_logo_alpha(im)

    W = sheet.size[0] // 3
    H = sheet.size[1] // 3

    out_sheet = Image.new('RGBA', (tile_size * 3, tile_size * 3), (0, 0, 0, 0))
    tiles = {}

    for r in range(3):
        for c in range(3):
            x0 = c * W
            y0 = r * H
            x1 = (c + 1) * W
            y1 = (r + 1) * H

            cell = sheet.crop((x0, y0, x1, y1))
            cleaned_cell = clean_cell_mark(cell)

            bbox = cleaned_cell.getbbox()
            if bbox:
                mark = cleaned_cell.crop(bbox)
                mw, mh = mark.size

                # Fit mark within 78% of tile_size maintaining aspect ratio
                max_dim = int(tile_size * 0.78)
                scale = min(max_dim / max(mw, 1), max_dim / max(mh, 1), 1.0)
                if scale < 1.0:
                    new_w = max(1, int(mw * scale))
                    new_h = max(1, int(mh * scale))
                    mark = mark.resize((new_w, new_h), Image.Resampling.LANCZOS)
                    mw, mh = mark.size

                px = (tile_size - mw) // 2
                py = (tile_size - mh) // 2

                tile = Image.new('RGBA', (tile_size, tile_size), (0, 0, 0, 0))
                tile.paste(mark, (px, py), mark)
            else:
                tile = cleaned_cell.resize((tile_size, tile_size), Image.Resampling.LANCZOS)

            out_sheet.paste(tile, (c * tile_size, r * tile_size))
            tiles[(r, c)] = tile

    out_dir = os.path.dirname(output_path)
    if out_dir:
        os.makedirs(out_dir, exist_ok=True)

    out_sheet.save(output_path, 'PNG', optimize=True)
    print(f"Successfully generated clean transparent logo sheet: {output_path} ({out_sheet.size})")

    # If export_dir is provided, also export standard variant marks
    if export_dir:
        os.makedirs(export_dir, exist_ok=True)
        # (1, 1) -> contrast mark
        tiles[(1, 1)].save(os.path.join(export_dir, 'mascen-contrast.png'), 'PNG')
        # (0, 0) -> signature 3D mark
        tiles[(0, 0)].save(os.path.join(export_dir, 'mascen-signature.png'), 'PNG')
        # (0, 1) -> app icon
        tiles[(0, 1)].save(os.path.join(export_dir, 'mascen-app-icon.png'), 'PNG')
        # (2, 1) -> upright emblem mark
        tiles[(2, 1)].save(os.path.join(export_dir, 'mascen-emblem.png'), 'PNG')
        print(f"Exported individual marks to {export_dir}")


if __name__ == '__main__':
    if len(sys.argv) < 3:
        print("Usage: python3 build_logo.py <input_path> <output_path> [--export-dir <dir>]")
        sys.exit(1)

    exp_dir = None
    if '--export-dir' in sys.argv:
        idx = sys.argv.index('--export-dir')
        if idx + 1 < len(sys.argv):
            exp_dir = sys.argv[idx + 1]

    build_logo_sheet(sys.argv[1], sys.argv[2], export_dir=exp_dir)

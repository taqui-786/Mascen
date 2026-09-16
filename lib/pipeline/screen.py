"""Screen a source sheet before spending compute building it.
Usage: python3 screen.py <path_to_png>
Outputs JSON: { "alpha": "ok"|"missing", "spread": float, "ratio": float, "verdict": "GOOD"|"marginal"|"REJECT" }
"""
import json
import os
import sys
import numpy as np
from PIL import Image
from scipy import ndimage

sys.path.insert(0, os.path.dirname(__file__))
from build import extract_alpha

def screen_sheet(path):
    im = Image.open(path)
    fmt = im.format
    raw_a = np.array(im.convert('RGBA'))
    native_alpha_ok = fmt == 'PNG' and bool((raw_a[..., 3] < 10).mean() > 0.05)
    
    # Extract alpha if native alpha is missing (e.g. solid white backdrop)
    matted = extract_alpha(im)
    a = np.array(matted)
    W = a.shape[0] // 3
    alpha_ok = native_alpha_ok or bool((a[..., 3] < 10).mean() > 0.05)
    
    widths = []
    for i in range(9):
        c, r = i % 3, i // 3
        op = a[r*W:(r+1)*W, c*W:(c+1)*W, 3] > 100
        if not op.any():
            continue
        ys, xs = np.where(op)
        band = ys.max() - int(W * 0.05)
        sy, sx = np.where(op[band:, :])
        if len(sx) > 0:
            widths.append(int(sx.max() - sx.min()))
            
    spread = 100.0 * (max(widths) - min(widths)) / float(np.mean(widths)) if widths else 99.0

    op = a[W:2*W, W:2*W, 3] > 100
    if op.any():
        ys, xs = np.where(op)
        top, bot = ys.min(), ys.max()
        hy, hx = np.where(op[top:top + int((bot - top) * 0.55), :])
        sy, sx = np.where(op[bot - int(W * 0.05):, :])
        hw = float(hx.max() - hx.min()) if len(hx) else 1.0
        sw = float(sx.max() - sx.min()) if len(sx) else 1.0
        ratio = sw / max(hw, 1.0)
    else:
        ratio = 1.0

    is_reactions = os.path.basename(path).startswith('reactions')
    verdict = 'GOOD' if is_reactions else ('GOOD' if spread < 3 else ('marginal' if spread < 8 else 'REJECT'))

    return {
        "alpha": "ok" if alpha_ok else "missing",
        "spread": round(spread, 2),
        "ratio": round(ratio, 2),
        "verdict": verdict
    }

if __name__ == '__main__':
    if len(sys.argv) < 2:
        sys.exit(1)
    res = screen_sheet(sys.argv[1])
    print(json.dumps(res))

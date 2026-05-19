#!/usr/bin/env python3
"""
Convert PNG artwork into a smooth low-color SVG icon.
Requires: pillow, numpy, opencv-python, scikit-image
"""

from __future__ import annotations
import math
from pathlib import Path
from typing import List
import cv2
import numpy as np
from PIL import Image, ImageFilter

def rgb_to_hex(rgb: np.ndarray) -> str:
    return "#%02x%02x%02x" % tuple(int(x) for x in rgb[:3])

def chaikin_closed(points: np.ndarray, iterations: int = 3) -> np.ndarray:
    pts = np.asarray(points, dtype=float)
    if len(pts) < 4: return pts
    for _ in range(iterations):
        new_pts = []
        n = len(pts)
        for i in range(n):
            p0, p1 = pts[i], pts[(i + 1) % n]
            new_pts.append(0.75 * p0 + 0.25 * p1)
            new_pts.append(0.25 * p0 + 0.75 * p1)
        pts = np.array(new_pts)
    return pts

def simplify_points(points: np.ndarray, spacing: float = 2.2) -> np.ndarray:
    if len(points) == 0: return points
    out = [points[0]]
    for p in points[1:]:
        if np.linalg.norm(p - out[-1]) >= spacing: out.append(p)
    if len(out) > 1 and np.linalg.norm(out[0] - out[-1]) < spacing * 0.8: out = out[:-1]
    return np.array(out)

def points_to_path(points: np.ndarray) -> str:
    if len(points) < 3: return ""
    parts = [f"M {points[0,0]:.2f} {points[0,1]:.2f}"]
    parts += [f"L {p[0]:.2f} {p[1]:.2f}" for p in points[1:]]
    parts.append("Z")
    return " ".join(parts)

def clean_mask(mask: np.ndarray, min_area: int = 120, morph: int = 5, dilate: int = 1) -> np.ndarray:
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (morph, morph))
    mask8 = (mask.astype(np.uint8) * 255)
    mask8 = cv2.morphologyEx(mask8, cv2.MORPH_OPEN, kernel)
    mask8 = cv2.morphologyEx(mask8, cv2.MORPH_CLOSE, kernel)
    num_labels, labels, stats, _ = cv2.connectedComponentsWithStats((mask8 > 0).astype(np.uint8), connectivity=8)
    out = np.zeros_like(mask8, dtype=np.uint8)
    for i in range(1, num_labels):
        if stats[i, cv2.CC_STAT_AREA] >= min_area: out[labels == i] = 255
    if dilate > 0:
        dk = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * dilate + 1, 2 * dilate + 1))
        out = cv2.dilate(out, dk)
    return out

def trace_mask(mask: np.ndarray, min_area: int = 120, morph: int = 5, blur: float = 1.0) -> List[np.ndarray]:
    mask8 = clean_mask(mask, min_area=min_area, morph=morph)
    if blur > 0:
        mask8 = cv2.GaussianBlur(mask8, (0, 0), sigmaX=blur, sigmaY=blur)
        mask8 = np.where(mask8 >= 127, 255, 0).astype(np.uint8)
    contours, _ = cv2.findContours(mask8, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    paths = []
    for cnt in contours:
        if abs(cv2.contourArea(cnt)) < min_area: continue
        pts = cnt[:, 0, :].astype(float)
        pts = chaikin_closed(pts, iterations=3)
        pts = simplify_points(pts, spacing=2.2)
        if len(pts) >= 3: paths.append(pts)
    paths.sort(key=lambda p: -len(p))
    return paths

def dominant_index(labels: np.ndarray) -> int:
    vals, counts = np.unique(labels[labels != 255], return_counts=True)
    return int(vals[np.argmax(counts)]) if len(vals) > 0 else 0

def convert(input_png: str, output_svg: str, colors: int = 6, min_area: int = 120):
    img = Image.open(input_png).convert("RGBA")
    arr = np.array(img)
    alpha, rgb = arr[:, :, 3], arr[:, :, :3]
    background = (alpha < 10) | np.all(rgb >= 245, axis=2)
    foreground = ~background
    soft = Image.fromarray(rgb).filter(ImageFilter.GaussianBlur(radius=1.2))
    soft_arr = np.array(soft)
    ys, xs = np.where(foreground)
    if len(xs) == 0: raise ValueError("No foreground detected.")
    x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
    crop = Image.fromarray(soft_arr[y0:y1, x0:x1])
    quant = crop.quantize(colors=colors, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)
    quant_arr = np.array(quant)
    palette = np.array(quant.getpalette(), dtype=np.uint8).reshape(-1, 3)
    labels = np.full(foreground.shape, 255, dtype=np.uint8)
    labels[y0:y1, x0:x1] = quant_arr
    labels[background] = 255
    h, w = labels.shape
    parts = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}" shape-rendering="geometricPrecision">', '<g fill-rule="evenodd">']
    base_idx = dominant_index(labels)
    base_color = rgb_to_hex(palette[base_idx])
    base_paths = trace_mask(foreground, min_area=min_area * 2, morph=7, blur=1.0)
    base_d = " ".join(points_to_path(p) for p in base_paths)
    if base_d: parts.append(f'<path d="{base_d}" fill="{base_color}"/>')
    unique = [i for i in np.unique(labels) if i != 255]
    luminance = {i: float(np.dot(palette[i], [0.2126, 0.7152, 0.0722])) for i in unique}
    unique.sort(key=lambda i: luminance[i], reverse=True)
    for idx in unique:
        paths = trace_mask(labels == idx, min_area=min_area, morph=5, blur=1.0)
        d = " ".join(points_to_path(p) for p in paths)
        if d: parts.append(f'<path d="{d}" fill="{rgb_to_hex(palette[idx])}"/>')
    parts.append("</g></svg>")
    Path(output_svg).write_text("\n".join(parts), encoding="utf-8")
    print(f"Successfully converted {input_png} to {output_svg}")

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("input_png")
    parser.add_argument("output_svg")
    parser.add_argument("--colors", type=int, default=6)
    parser.add_argument("--min-area", type=int, default=120)
    args = parser.parse_args()
    convert(args.input_png, args.output_svg, colors=args.colors, min_area=args.min_area)

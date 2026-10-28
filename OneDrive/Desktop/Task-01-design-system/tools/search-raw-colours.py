#!/usr/bin/env python3
"""
Raw-colour and palette-reference search for the Kobo Watt project.

Walks the project recursively (hidden files included), skips Git internals,
dependency folders, binary files, non-UTF-8 files and this evidence file,
then prints every matching line as path:line:content.

Usage:
  python tools/search-raw-colours.py --patterns colours
  python tools/search-raw-colours.py --patterns symbols --ext html css js mjs
  python tools/search-raw-colours.py --patterns symbols --paths <files...>

Options:
  --patterns {colours,symbols,all}  Which pattern groups to run.
  --ext EXT [EXT ...]               Limit the walk to these file extensions.
  --paths PATH [PATH ...]           Scan only these files.
  --out PATH                        Write UTF-8 output to PATH.
  --append                          Append to --out instead of replacing it.
"""
from __future__ import annotations

import argparse
import os
import re
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
EVIDENCE_REL = "evidence/07-raw-value-search.txt"

EXCLUDED_DIRS = {".git", "node_modules", ".venv", "venv", "__pycache__"}

BINARY_EXT = {
    ".png", ".jpg", ".jpeg", ".gif", ".webp", ".ico", ".bmp", ".tif", ".tiff",
    ".pdf", ".mp4", ".mov", ".avi", ".webm", ".mp3", ".wav", ".woff", ".woff2",
    ".ttf", ".otf", ".eot", ".zip", ".gz", ".tar", ".rar", ".7z", ".exe", ".dll",
    ".so", ".dylib", ".class", ".jar",
}

HEX_RE = re.compile(
    r"(?<![A-Za-z0-9_])"
    r"#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})"
    r"(?![A-Za-z0-9_-])"
)

COLOUR_FUNCTION_RE = re.compile(
    r"(?<![A-Za-z0-9_-])"
    r"(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color|color-mix|light-dark|"
    r"device-cmyk|color-contrast)\s*\(",
    re.IGNORECASE,
)

NAMED_COLOURS = (
    "aliceblue", "antiquewhite", "aqua", "aquamarine", "azure", "beige",
    "bisque", "black", "blanchedalmond", "blue", "blueviolet", "brown",
    "burlywood", "cadetblue", "chartreuse", "chocolate", "coral",
    "cornflowerblue", "cornsilk", "crimson", "cyan", "darkblue", "darkcyan",
    "darkgoldenrod", "darkgray", "darkgreen", "darkgrey", "darkkhaki",
    "darkmagenta", "darkolivegreen", "darkorange", "darkorchid", "darkred",
    "darksalmon", "darkseagreen", "darkslateblue", "darkslategray",
    "darkslategrey", "darkturquoise", "darkviolet", "deeppink", "deepskyblue",
    "dimgray", "dimgrey", "dodgerblue", "firebrick", "floralwhite",
    "forestgreen", "fuchsia", "gainsboro", "ghostwhite", "gold", "goldenrod",
    "gray", "green", "greenyellow", "grey", "honeydew", "hotpink",
    "indianred", "indigo", "ivory", "khaki", "lavender", "lavenderblush",
    "lawngreen", "lemonchiffon", "lightblue", "lightcoral", "lightcyan",
    "lightgoldenrodyellow", "lightgray", "lightgreen", "lightgrey",
    "lightpink", "lightsalmon", "lightseagreen", "lightskyblue",
    "lightslategray", "lightslategrey", "lightsteelblue", "lightyellow",
    "lime", "limegreen", "linen", "magenta", "maroon", "mediumaquamarine",
    "mediumblue", "mediumorchid", "mediumpurple", "mediumseagreen",
    "mediumslateblue", "mediumspringgreen", "mediumturquoise",
    "mediumvioletred", "midnightblue", "mintcream", "mistyrose", "moccasin",
    "navajowhite", "navy", "oldlace", "olive", "olivedrab", "orange",
    "orangered", "orchid", "palegoldenrod", "palegreen", "paleturquoise",
    "palevioletred", "papayawhip", "peachpuff", "peru", "pink", "plum",
    "powderblue", "purple", "rebeccapurple", "red", "rosybrown", "royalblue",
    "saddlebrown", "salmon", "sandybrown", "seagreen", "seashell", "sienna",
    "silver", "skyblue", "slateblue", "slategray", "slategrey", "snow",
    "springgreen", "steelblue", "tan", "teal", "thistle", "tomato",
    "turquoise", "violet", "wheat", "white", "whitesmoke", "yellow",
    "yellowgreen", "transparent", "currentcolor",
)

NAMED_RE = re.compile(
    r"(?<![A-Za-z0-9_-])(?:" + "|".join(NAMED_COLOURS) + r")(?![A-Za-z0-9_-])",
    re.IGNORECASE,
)

PALETTE_RE = re.compile(r"--kw-palette-")
MATERIAL_RE = re.compile(r"material-theme", re.IGNORECASE)

SECTIONS = {
    "hex": ("RAW COLOUR VALUES: HEX", HEX_RE),
    "functions": ("RAW COLOUR VALUES: CSS COLOUR FUNCTIONS", COLOUR_FUNCTION_RE),
    "named": ("RAW COLOUR VALUES: NAMED CSS COLOURS", NAMED_RE),
    "palette": ("PRIMITIVE PALETTE VARIABLE REFERENCES (--kw-palette-)", PALETTE_RE),
    "material": ("MATERIAL-THEME REFERENCES", MATERIAL_RE),
}
COLOUR_KEYS = ("hex", "functions", "named")
SYMBOL_KEYS = ("palette", "material")


def collect_files(exts: set[str] | None, paths: list[str] | None):
    skipped_binary: list[str] = []
    skipped_text: list[str] = []
    skipped_evidence: list[str] = []
    files: list[tuple[Path, str]] = []

    if paths:
        candidates = []
        for raw in paths:
            p = Path(raw)
            if not p.is_absolute():
                p = PROJECT_ROOT / p
            candidates.append(p)
    else:
        candidates = []
        for dirpath, dirnames, filenames in os.walk(PROJECT_ROOT):
            dirnames[:] = sorted(d for d in dirnames if d not in EXCLUDED_DIRS)
            for name in sorted(filenames):
                candidates.append(Path(dirpath) / name)
        candidates.sort()

    for p in candidates:
        try:
            rel = p.resolve().relative_to(PROJECT_ROOT).as_posix()
        except ValueError:
            rel = str(p)
        if rel == EVIDENCE_REL:
            skipped_evidence.append(rel)
            continue
        if not p.is_file():
            continue
        if exts is not None and p.suffix.lower().lstrip(".") not in exts:
            continue
        if p.suffix.lower() in BINARY_EXT:
            skipped_binary.append(rel)
            continue
        files.append((p, rel))

    return files, skipped_binary, skipped_text, skipped_evidence


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--patterns", choices=("colours", "symbols", "all"), default="all")
    parser.add_argument("--ext", nargs="*", default=None)
    parser.add_argument("--paths", nargs="*", default=None)
    parser.add_argument("--out", default=None)
    parser.add_argument("--append", action="store_true")
    args = parser.parse_args()

    exts = {e.lower().lstrip(".") for e in args.ext} if args.ext else None
    keys = COLOUR_KEYS if args.patterns == "colours" else SYMBOL_KEYS if args.patterns == "symbols" else COLOUR_KEYS + SYMBOL_KEYS
    active = {k: SECTIONS[k] for k in keys}

    files, skipped_binary, skipped_text, skipped_evidence = collect_files(exts, args.paths)
    results: dict[str, list[str]] = {k: [] for k in keys}

    for p, rel in files:
        try:
            text = p.read_bytes().decode("utf-8-sig")
        except (UnicodeDecodeError, OSError):
            skipped_text.append(rel)
            continue
        for number, line in enumerate(text.splitlines(), 1):
            for key, (_, regex) in active.items():
                if regex.search(line):
                    results[key].append(f"{rel}:{number}:{line}")

    lines: list[str] = []
    lines.append("--- SKIPPED: binary extension ---")
    for rel in skipped_binary:
        lines.append(rel)
    lines.append(f"({len(skipped_binary)} files)")
    lines.append("--- SKIPPED: not valid UTF-8 text ---")
    for rel in skipped_text:
        lines.append(rel)
    lines.append(f"({len(skipped_text)} files)")
    lines.append("--- SKIPPED: evidence output file ---")
    for rel in skipped_evidence:
        lines.append(rel)
    lines.append(f"({len(skipped_evidence)} files)")
    lines.append(f"--- FILES SCANNED: {len(files)} ---")

    for key, (title, _) in active.items():
        lines.append(f"=== {title} ===")
        lines.extend(results[key])
        lines.append(f"--- {len(results[key])} matching lines ---")

    output = "\n".join(lines) + "\n"
    if args.out:
        out_path = Path(args.out)
        if not out_path.is_absolute():
            out_path = PROJECT_ROOT / out_path
        out_path.parent.mkdir(parents=True, exist_ok=True)
        mode = "a" if args.append else "w"
        prefix = "\n" if args.append and out_path.exists() and out_path.stat().st_size else ""
        with out_path.open(mode, encoding="utf-8", newline="\n") as handle:
            handle.write(prefix + output)
        print(f"Wrote {len(lines)} lines to {out_path}")
    else:
        sys.stdout.write(output)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())

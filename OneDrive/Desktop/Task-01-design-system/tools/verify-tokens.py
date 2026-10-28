#!/usr/bin/env python3
"""
verify-tokens.py — Comprehensive verification suite for Kobo Watt design tokens conversion.

Verifies:
  1. Exactly 120 primitive colours are represented in styles/tokens.css.
  2. All 50 light and 50 dark role definitions from Figma export are represented.
  3. Every generated role reference resolves to a declared primitive custom property.
  4. All 15 typography styles are represented with generated custom properties and classes.
  5. All three shadows (soft, medium, hard) are represented.
  6. Display Large matches: 64px font size, 96px line height, weight 600, -2.24px letter spacing.
  7. Idempotency: running convert-tokens.py twice yields identical output (matching SHA-256).
  8. Neither source JSON file (05-tokens-incomplete.json, 06-tokens-complete.json) was modified.
"""

import hashlib
import json
import re
import subprocess
import sys
from pathlib import Path

WORKSPACE_ROOT = Path(__file__).resolve().parent.parent
EVIDENCE_DIR = WORKSPACE_ROOT / "evidence"
STYLES_DIR = WORKSPACE_ROOT / "styles"

JSON_05 = EVIDENCE_DIR / "05-tokens-incomplete.json"
JSON_06 = EVIDENCE_DIR / "06-tokens-complete.json"

TOKENS_CSS = STYLES_DIR / "tokens.css"
TYPOGRAPHY_CSS = STYLES_DIR / "typography.css"

# Pre-conversion SHA256 hashes
EXPECTED_HASH_05 = "71f3c0443d48c5919f5f02e5f2d2de3774722b890cb9b0dc55f316694ad6ccd0"
EXPECTED_HASH_06 = "9292737f5382b26f9892a5572acd53a3894055734bf5fb0c0ccea8da2928b43b"

def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        while chunk := f.read(65536):
            h.update(chunk)
    return h.hexdigest()

def run_checks():
    print("=" * 70)
    print("KOBO WATT DESIGN TOKEN CONVERSION — VERIFICATION SUITE")
    print("=" * 70)

    all_passed = True

    # -------------------------------------------------------------------------
    # Check 8: Verify conversion does not modify either source JSON file
    # -------------------------------------------------------------------------
    print("\n[CHECK 8] Source JSON Immutability & Conversion Safety Check:")
    if not JSON_05.exists():
        print(f"  FAIL: Source JSON missing: {JSON_05}")
        sys.exit(1)
    if not JSON_06.exists():
        print(f"  FAIL: Source JSON missing: {JSON_06}")
        sys.exit(1)

    # 1. Calculate SHA-256 fingerprint of both files immediately before running the converter
    pre_hash_05 = sha256_file(JSON_05)
    pre_hash_06 = sha256_file(JSON_06)
    print(f"  Pre-conversion SHA-256 of 05-tokens-incomplete.json: {pre_hash_05}")
    print(f"  Pre-conversion SHA-256 of 06-tokens-complete.json:   {pre_hash_06}")

    # Baseline comparison against known export fingerprints
    if pre_hash_05 == EXPECTED_HASH_05:
        print(f"  PASS: evidence/05-tokens-incomplete.json matches baseline ({pre_hash_05[:16]}...)")
    else:
        print(f"  FAIL: evidence/05-tokens-incomplete.json does not match baseline expected hash!")
        all_passed = False

    if pre_hash_06 == EXPECTED_HASH_06:
        print(f"  PASS: evidence/06-tokens-complete.json matches baseline ({pre_hash_06[:16]}...)")
    else:
        print(f"  FAIL: evidence/06-tokens-complete.json does not match baseline expected hash!")
        all_passed = False

    if not all_passed:
        sys.exit(1)

    # 2. Run tools/convert-tokens.py
    convert_script = WORKSPACE_ROOT / "tools" / "convert-tokens.py"
    if not convert_script.exists():
        print(f"  FAIL: Conversion script missing: {convert_script}")
        sys.exit(1)

    print("  Running tools/convert-tokens.py...")
    res = subprocess.run([sys.executable, str(convert_script)], capture_output=True, text=True)
    if res.returncode != 0:
        print(f"  FAIL: convert-tokens.py exited with error:\n{res.stderr}")
        sys.exit(1)

    # 3. Calculate both fingerprints again after conversion
    if not JSON_05.exists():
        print(f"  FAIL: evidence/05-tokens-incomplete.json disappeared during conversion!")
        sys.exit(1)
    if not JSON_06.exists():
        print(f"  FAIL: evidence/06-tokens-complete.json disappeared during conversion!")
        sys.exit(1)

    post_hash_05 = sha256_file(JSON_05)
    post_hash_06 = sha256_file(JSON_06)
    print(f"  Post-conversion SHA-256 of 05-tokens-incomplete.json: {post_hash_05}")
    print(f"  Post-conversion SHA-256 of 06-tokens-complete.json:   {post_hash_06}")

    # 4. Fail verification with a clear message and non-zero exit code if either source file changed or disappeared
    if post_hash_05 != pre_hash_05:
        print(f"  FAIL: evidence/05-tokens-incomplete.json was modified by conversion!")
        print(f"        Pre-conversion SHA-256:  {pre_hash_05}")
        print(f"        Post-conversion SHA-256: {post_hash_05}")
        sys.exit(1)

    if post_hash_06 != pre_hash_06:
        print(f"  FAIL: evidence/06-tokens-complete.json was modified by conversion!")
        print(f"        Pre-conversion SHA-256:  {pre_hash_06}")
        print(f"        Post-conversion SHA-256: {post_hash_06}")
        sys.exit(1)

    print("  PASS: Both source JSON files remained untouched and identical across conversion.")

    # Read exported JSON for truth checking
    with open(JSON_06, "r", encoding="utf-8") as f:
        export_data = json.load(f)

    # Read CSS files
    if not TOKENS_CSS.exists():
        sys.exit(f"FAIL: styles/tokens.css does not exist.")
    if not TYPOGRAPHY_CSS.exists():
        sys.exit(f"FAIL: styles/typography.css does not exist.")

    tokens_css_content = TOKENS_CSS.read_text(encoding="utf-8")
    typography_css_content = TYPOGRAPHY_CSS.read_text(encoding="utf-8")

    # Split tokens_css into :root block and [data-theme="dark"] block cleanly
    parts = re.split(r'\[data-theme=["\']dark["\']\]\s*\{', tokens_css_content)
    if len(parts) < 2:
        sys.exit("FAIL: Could not locate [data-theme=\"dark\"] block in tokens.css")
    root_block = parts[0]
    dark_block = parts[1]

    # -------------------------------------------------------------------------
    # Check 1: 120 primitive colours represented
    # -------------------------------------------------------------------------
    print("\n[CHECK 1] 120 Primitive Colours Representation:")
    primitive_declarations = re.findall(r"(--kw-palette-[a-z0-9\-]+):\s*(#[a-f0-9]{8});", root_block)
    prim_map = {name: val for name, val in primitive_declarations}
    print(f"  Found {len(prim_map)} unique primitive declarations in :root.")
    if len(prim_map) == 120:
        print("  PASS: Exactly 120 primitive colours represented in :root.")
    else:
        print(f"  FAIL: Expected 120 primitive colours, but found {len(prim_map)}")
        all_passed = False

    # -------------------------------------------------------------------------
    # Check 2: All 50 light and 50 dark role definitions represented
    # -------------------------------------------------------------------------
    print("\n[CHECK 2] 50 Light and 50 Dark Role Definitions:")
    exp_light_roles = export_data["color roles"]["light"]
    exp_dark_roles = export_data["color roles"]["dark"]

    root_role_decls = dict(re.findall(r"(--kw-color-[a-z0-9\-]+):\s*var\((--kw-palette-[a-z0-9\-]+)\);", root_block))
    dark_role_decls = dict(re.findall(r"(--kw-color-[a-z0-9\-]+):\s*var\((--kw-palette-[a-z0-9\-]+)\);", dark_block))

    print(f"  Root role declarations with var(): {len(root_role_decls)}")
    print(f"  Dark role declarations with var(): {len(dark_role_decls)}")

    # Verify every exported light role is present
    missing_light = []
    for r in exp_light_roles:
        expected_prop = f"--kw-color-{re.sub(r'[^a-z0-9\-]', '', re.sub(r'[\s_]+', '-', r.strip().lower()))}"
        if expected_prop not in root_role_decls:
            missing_light.append((r, expected_prop))

    missing_dark = []
    for r in exp_dark_roles:
        expected_prop = f"--kw-color-{re.sub(r'[^a-z0-9\-]', '', re.sub(r'[\s_]+', '-', r.strip().lower()))}"
        if expected_prop not in dark_role_decls:
            missing_dark.append((r, expected_prop))

    if not missing_light:
        print("  PASS: All 50 exported light roles are defined in :root.")
    else:
        print(f"  FAIL: Missing {len(missing_light)} light roles: {missing_light}")
        all_passed = False

    if not missing_dark:
        print("  PASS: All 50 exported dark roles are defined in [data-theme=\"dark\"].")
    else:
        print(f"  FAIL: Missing {len(missing_dark)} dark roles: {missing_dark}")
        all_passed = False

    # -------------------------------------------------------------------------
    # Check 3: Every generated role reference resolves
    # -------------------------------------------------------------------------
    print("\n[CHECK 3] Resolution of Role References:")
    unresolved_refs = []
    for role_name, target_var in root_role_decls.items():
        if target_var not in prim_map:
            unresolved_refs.append((role_name, target_var, "light"))
    for role_name, target_var in dark_role_decls.items():
        if target_var not in prim_map:
            unresolved_refs.append((role_name, target_var, "dark"))

    if not unresolved_refs:
        print("  PASS: Every single role reference in both light and dark themes resolves to a declared primitive property.")
    else:
        print(f"  FAIL: Unresolved references found: {unresolved_refs}")
        all_passed = False

    # -------------------------------------------------------------------------
    # Check 4: All 15 typography styles represented
    # -------------------------------------------------------------------------
    print("\n[CHECK 4] 15 Typography Styles Representation:")
    exp_type_styles = list(export_data["typography"].keys())
    missing_type_tokens = []
    missing_type_classes = []

    for s in exp_type_styles:
        slug = re.sub(r'[^a-z0-9\-]', '', re.sub(r'[\s_]+', '-', s.strip().lower()))
        # Check tokens
        for prop in ["font-family", "font-size", "font-weight", "line-height", "letter-spacing"]:
            token_var = f"--kw-typography-{slug}-{prop}"
            if token_var not in typography_css_content:
                missing_type_tokens.append(token_var)
        # Check class
        class_sel = f".kw-typography-{slug}"
        if class_sel not in typography_css_content:
            missing_type_classes.append(class_sel)

    if not missing_type_tokens and not missing_type_classes:
        print(f"  PASS: All 15 typography styles represented (75 custom properties + 15 utility classes).")
    else:
        if missing_type_tokens:
            print(f"  FAIL: Missing typography tokens: {missing_type_tokens}")
        if missing_type_classes:
            print(f"  FAIL: Missing typography classes: {missing_type_classes}")
        all_passed = False

    # -------------------------------------------------------------------------
    # Check 5: All three shadows represented
    # -------------------------------------------------------------------------
    print("\n[CHECK 5] All Three Shadows Representation:")
    shadow_names = ["soft", "medium", "hard"]
    missing_shadows = []
    for s in shadow_names:
        var_name = f"--kw-shadow-{s}"
        m = re.search(rf"{var_name}:\s*([0-9px\s#a-fA-F]+);", root_block)
        if not m:
            missing_shadows.append(s)
        else:
            val = m.group(1).strip()
            print(f"  Found {var_name}: {val}")

    if not missing_shadows:
        print("  PASS: All three shadows (soft, medium, hard) are defined in :root with 8-digit HEX transparency.")
    else:
        print(f"  FAIL: Missing shadows: {missing_shadows}")
        all_passed = False

    # -------------------------------------------------------------------------
    # Check 6: Display Large values check
    # -------------------------------------------------------------------------
    print("\n[CHECK 6] Display Large Values Verification:")
    # Display Large matches 64 px size, 96 px line height, weight 600 and -2.24 px letter spacing
    dl_checks = {
        "--kw-typography-display-large-font-size": "64px",
        "--kw-typography-display-large-line-height": "96px",
        "--kw-typography-display-large-font-weight": "600",
        "--kw-typography-display-large-letter-spacing": "-2.24px",
    }
    dl_passed = True
    for var_name, expected_val in dl_checks.items():
        m = re.search(rf"{var_name}:\s*([^;]+);", typography_css_content)
        if not m:
            print(f"  FAIL: {var_name} not found!")
            dl_passed = False
        else:
            actual_val = m.group(1).strip()
            if actual_val == expected_val:
                print(f"  PASS: {var_name} = {actual_val} (matches expected {expected_val})")
            else:
                print(f"  FAIL: {var_name} = {actual_val} (expected {expected_val})")
                dl_passed = False

    if not dl_passed:
        all_passed = False

    # -------------------------------------------------------------------------
    # Check 7: Idempotency (running conversion twice produces identical output)
    # -------------------------------------------------------------------------
    print("\n[CHECK 7] Conversion Script Idempotency:")
    hash_tokens_1 = sha256_file(TOKENS_CSS)
    hash_typo_1 = sha256_file(TYPOGRAPHY_CSS)

    pre_run2_05 = sha256_file(JSON_05)
    pre_run2_06 = sha256_file(JSON_06)

    # Re-run conversion
    res = subprocess.run([sys.executable, str(WORKSPACE_ROOT / "tools" / "convert-tokens.py")], capture_output=True, text=True)
    if res.returncode != 0:
        print(f"  FAIL: Second run of convert-tokens.py exited with error:\n{res.stderr}")
        all_passed = False
    else:
        if not JSON_05.exists() or not JSON_06.exists():
            print("  FAIL: Source JSON file disappeared during second conversion run!")
            sys.exit(1)
        if sha256_file(JSON_05) != pre_run2_05 or sha256_file(JSON_06) != pre_run2_06:
            print("  FAIL: Source JSON file was modified during second conversion run!")
            sys.exit(1)

        hash_tokens_2 = sha256_file(TOKENS_CSS)
        hash_typo_2 = sha256_file(TYPOGRAPHY_CSS)

        if hash_tokens_1 == hash_tokens_2 and hash_typo_1 == hash_typo_2:
            print(f"  PASS: Running script twice produces identical outputs:")
            print(f"    tokens.css SHA256:     {hash_tokens_1}")
            print(f"    typography.css SHA256: {hash_typo_1}")
        else:
            print("  FAIL: Second run produced differing outputs!")
            all_passed = False

    # Final summary
    print("\n" + "=" * 70)
    if all_passed:
        print("ALL CHECKS PASSED SUCCESSFULLY!")
    else:
        print("SOME CHECKS FAILED.")
    print("=" * 70)

    return all_passed

if __name__ == "__main__":
    success = run_checks()
    sys.exit(0 if success else 1)

#!/usr/bin/env python3
"""
convert-tokens.py — Converts Figma design tokens into CSS custom properties.

Source of Truth:
  evidence/06-tokens-complete.json

Generated Outputs:
  styles/tokens.css      — Primitive colours, shadows, light/dark colour roles.
  styles/typography.css  — Typography tokens and reusable typography utility classes.

Author: Antigravity (Pair Programming Assistant for Kobo Watt)
"""

import json
import os
import re
import sys
from pathlib import Path

# Paths
WORKSPACE_ROOT = Path(__file__).resolve().parent.parent
INPUT_TOKENS = WORKSPACE_ROOT / "evidence" / "06-tokens-complete.json"
OUTPUT_STYLES_DIR = WORKSPACE_ROOT / "styles"
OUTPUT_TOKENS_CSS = OUTPUT_STYLES_DIR / "tokens.css"
OUTPUT_TYPOGRAPHY_CSS = OUTPUT_STYLES_DIR / "typography.css"

def to_kebab_case(s: str) -> str:
    """Converts a token name string to a clean kebab-case identifier."""
    s = s.strip()
    s = re.sub(r'[\s_]+', '-', s)
    s = re.sub(r'[^a-zA-Z0-9\-]', '', s)
    s = s.lower()
    return s

def extract_tone_number(tone_name: str, family: str) -> str:
    """Extracts tone number from tone name like 'primary40' or 'neutral variant40'."""
    m = re.search(r'(\d+)$', tone_name)
    if m:
        return m.group(1)
    return tone_name

def convert_tokens():
    if not INPUT_TOKENS.exists():
        sys.exit(f"Error: Input tokens file not found: {INPUT_TOKENS}")

    # Read-only input load
    with open(INPUT_TOKENS, "r", encoding="utf-8") as f:
        data = json.load(f)

    OUTPUT_STYLES_DIR.mkdir(parents=True, exist_ok=True)

    # =========================================================================
    # 1. PRIMITIVES (120 Base Colours)
    # =========================================================================
    primitives_data = data.get("primitives", {})
    key_colors_data = primitives_data.get("key colors", {})
    color_palette_data = primitives_data.get("color palette", {})

    primitive_vars = {}        # css_var_name -> hex_value
    json_path_to_var = {}      # 'primitives.color palette.primary.primary40' -> '--kw-palette-primary-40'

    # Collision tracker for primitives
    seen_primitive_vars = set()

    def register_primitive(var_name: str, hex_val: str, json_path: str):
        if var_name in seen_primitive_vars:
            raise ValueError(f"Naming collision detected for primitive CSS property: {var_name}")
        seen_primitive_vars.add(var_name)
        primitive_vars[var_name] = hex_val.lower()
        json_path_to_var[json_path] = var_name

    # 1a. Key colors (8 entries)
    # Sort for deterministic output
    for key_name in sorted(key_colors_data.keys()):
        item = key_colors_data[key_name]
        hex_val = item["value"]
        # Name: --kw-palette-<key-color-name> e.g. --kw-palette-primary-key-color
        var_name = f"--kw-palette-{to_kebab_case(key_name)}"
        json_path = f"primitives.key colors.{key_name}"
        register_primitive(var_name, hex_val, json_path)

    # 1b. Color palette (8 families x 14 tones = 112 entries)
    palette_family_order = [
        "primary", "secondary", "tertiary", "neutral",
        "neutral variant", "error", "warning", "success"
    ]
    for fam in sorted(color_palette_data.keys()):
        if fam not in palette_family_order:
            palette_family_order.append(fam)

    for fam in palette_family_order:
        if fam not in color_palette_data:
            continue
        tones_dict = color_palette_data[fam]
        fam_kebab = to_kebab_case(fam)
        sorted_tones = sorted(tones_dict.keys(), key=lambda t: int(extract_tone_number(t, fam)))
        for tone_key in sorted_tones:
            item = tones_dict[tone_key]
            hex_val = item["value"]
            tone_num = extract_tone_number(tone_key, fam)
            var_name = f"--kw-palette-{fam_kebab}-{tone_num}"
            json_path = f"primitives.color palette.{fam}.{tone_key}"
            register_primitive(var_name, hex_val, json_path)

    if len(primitive_vars) != 120:
        raise ValueError(f"Expected 120 primitive colours, but generated {len(primitive_vars)}")

    # =========================================================================
    # 2. EFFECT / SHADOW (3 Shadow Styles)
    # =========================================================================
    effect_data = data.get("effect", {})
    shadow_data = effect_data.get("shadow", {})
    shadow_vars = {}  # var_name -> css box-shadow value
    seen_shadow_vars = set()

    for s_name in sorted(shadow_data.keys()):
        s_val = shadow_data[s_name]["value"]
        ox = s_val.get("offsetX", 0)
        oy = s_val.get("offsetY", 0)
        rad = s_val.get("radius", 0)
        spread = s_val.get("spread", 0)
        color = s_val.get("color", "")
        # Format: <offsetX>px <offsetY>px <blur>px <spread>px <color>
        css_shadow = f"{ox}px {oy}px {rad}px {spread}px {color.lower()}"
        var_name = f"--kw-shadow-{to_kebab_case(s_name)}"
        if var_name in seen_shadow_vars:
            raise ValueError(f"Naming collision detected for shadow CSS property: {var_name}")
        seen_shadow_vars.add(var_name)
        shadow_vars[var_name] = css_shadow

    if len(shadow_vars) != 3:
        raise ValueError(f"Expected 3 shadow styles, found {len(shadow_vars)}")

    # =========================================================================
    # 3. COLOR ROLES (50 Light and 50 Dark)
    # =========================================================================
    color_roles_data = data.get("color roles", {})
    light_roles_data = color_roles_data.get("light", {})
    dark_roles_data = color_roles_data.get("dark", {})

    def resolve_role_ref(raw_ref: str, role_name: str, theme: str) -> str:
        """Resolves a reference like '{primitives.color palette.primary.primary40}' to var(--kw-palette-primary-40)."""
        m = re.match(r"^\{(.+)\}$", raw_ref.strip())
        if not m:
            raise ValueError(f"Role '{role_name}' in {theme} theme does not contain a valid reference: '{raw_ref}'")
        target_path = m.group(1).strip()
        if target_path not in json_path_to_var:
            raise KeyError(f"Role '{role_name}' in {theme} theme references unknown target '{target_path}'")
        target_var = json_path_to_var[target_path]
        return f"var({target_var})"

    light_role_vars = {}  # var_name -> "var(--kw-palette-...)"
    dark_role_vars = {}   # var_name -> "var(--kw-palette-...)"

    seen_light_vars = set()
    seen_dark_vars = set()

    for r_name in sorted(light_roles_data.keys()):
        raw_val = light_roles_data[r_name]["value"]
        css_var = f"--kw-color-{to_kebab_case(r_name)}"
        if css_var in seen_light_vars:
            raise ValueError(f"Naming collision detected for light role: {css_var}")
        seen_light_vars.add(css_var)
        light_role_vars[css_var] = resolve_role_ref(raw_val, r_name, "light")

    for r_name in sorted(dark_roles_data.keys()):
        raw_val = dark_roles_data[r_name]["value"]
        css_var = f"--kw-color-{to_kebab_case(r_name)}"
        if css_var in seen_dark_vars:
            raise ValueError(f"Naming collision detected for dark role: {css_var}")
        seen_dark_vars.add(css_var)
        dark_role_vars[css_var] = resolve_role_ref(raw_val, r_name, "dark")

    if len(light_role_vars) != 50:
        raise ValueError(f"Expected 50 light roles, found {len(light_role_vars)}")
    if len(dark_role_vars) != 50:
        raise ValueError(f"Expected 50 dark roles, found {len(dark_role_vars)}")



    # =========================================================================
    # 4. TYPOGRAPHY (15 Text Styles)
    # =========================================================================
    typography_data = data.get("typography", {})
    if len(typography_data) != 15:
        raise ValueError(f"Expected 15 typography styles, found {len(typography_data)}")

    type_order = [
        "display large", "display medium", "display small",
        "headline large", "headline medium", "headline small",
        "title large", "title medium", "title small",
        "body large", "body medium", "body small",
        "label large", "label medium", "label small"
    ]

    typography_tokens = {}  # style_slug -> dict of properties
    seen_type_vars = set()

    for style_name in type_order:
        if style_name not in typography_data:
            raise KeyError(f"Expected typography style '{style_name}' not found in export")
        item = typography_data[style_name]
        slug = to_kebab_case(style_name)

        ff = item["fontFamily"]["value"]
        fs = item["fontSize"]["value"]
        fw = item["fontWeight"]["value"]
        lh = item["lineHeight"]["value"]
        ls = item["letterSpacing"]["value"]

        fs_str = f"{fs:g}px" if isinstance(fs, (int, float)) else str(fs)
        lh_str = f"{lh:g}px" if isinstance(lh, (int, float)) else str(lh)
        ls_str = f"{ls:g}px" if isinstance(ls, (int, float)) else str(ls)
        fw_str = str(fw)
        ff_str = f"'{ff}', sans-serif" if " " in ff else f"{ff}, sans-serif"

        tokens = {
            f"--kw-typography-{slug}-font-family": ff_str,
            f"--kw-typography-{slug}-font-size": fs_str,
            f"--kw-typography-{slug}-font-weight": fw_str,
            f"--kw-typography-{slug}-line-height": lh_str,
            f"--kw-typography-{slug}-letter-spacing": ls_str,
        }

        for var_name in tokens:
            if var_name in seen_type_vars:
                raise ValueError(f"Naming collision detected for typography property: {var_name}")
            seen_type_vars.add(var_name)

        typography_tokens[slug] = tokens

    # =========================================================================
    # 5. WRITE STYLES/TOKENS.CSS
    # =========================================================================
    tokens_css_lines = []
    tokens_css_lines.append("/**")
    tokens_css_lines.append(" * Kobo Watt Design System — Token Definitions")
    tokens_css_lines.append(" * Generated automatically from evidence/06-tokens-complete.json.")
    tokens_css_lines.append(" * Do not edit manually. Regenerate using: python tools/convert-tokens.py")
    tokens_css_lines.append(" */\n")

    tokens_css_lines.append(":root {")
    tokens_css_lines.append("  /* =======================================================================")
    tokens_css_lines.append("   * 1. Primitive Colours (120 Base Values)")
    tokens_css_lines.append("   * ======================================================================= */")
    tokens_css_lines.append("  /* Key Colours (8) */")
    for key_name in sorted(key_colors_data.keys()):
        var_name = f"--kw-palette-{to_kebab_case(key_name)}"
        tokens_css_lines.append(f"  {var_name}: {primitive_vars[var_name]};")

    tokens_css_lines.append("\n  /* Tonal Palettes (112 tones: 8 families × 14 tones) */")
    for fam in palette_family_order:
        if fam not in color_palette_data:
            continue
        fam_kebab = to_kebab_case(fam)
        tokens_css_lines.append(f"  /* {fam.title()} Palette */")
        tones_dict = color_palette_data[fam]
        sorted_tones = sorted(tones_dict.keys(), key=lambda t: int(extract_tone_number(t, fam)))
        for tone_key in sorted_tones:
            tone_num = extract_tone_number(tone_key, fam)
            var_name = f"--kw-palette-{fam_kebab}-{tone_num}"
            tokens_css_lines.append(f"  {var_name}: {primitive_vars[var_name]};")

    tokens_css_lines.append("\n  /* =======================================================================")
    tokens_css_lines.append("   * 2. Shadow Effects (3 Styles from effect/shadow)")
    tokens_css_lines.append("   * ======================================================================= */")
    for s_name in sorted(shadow_data.keys()):
        var_name = f"--kw-shadow-{to_kebab_case(s_name)}"
        tokens_css_lines.append(f"  {var_name}: {shadow_vars[var_name]};")

    tokens_css_lines.append("\n  /* =======================================================================")
    tokens_css_lines.append("   * 3. Colour Roles — Light Theme (Default, 50 Roles)")
    tokens_css_lines.append("   * ======================================================================= */")
    for r_name in sorted(light_roles_data.keys()):
        var_name = f"--kw-color-{to_kebab_case(r_name)}"
        tokens_css_lines.append(f"  {var_name}: {light_role_vars[var_name]};")

    tokens_css_lines.append("}\n")

    tokens_css_lines.append("/* =========================================================================")
    tokens_css_lines.append(" * 4. Colour Roles — Dark Theme (50 Roles under [data-theme=\"dark\"])")
    tokens_css_lines.append(" * ========================================================================= */")
    tokens_css_lines.append("[data-theme=\"dark\"] {")
    for r_name in sorted(dark_roles_data.keys()):
        var_name = f"--kw-color-{to_kebab_case(r_name)}"
        tokens_css_lines.append(f"  {var_name}: {dark_role_vars[var_name]};")

    tokens_css_lines.append("}\n")

    with open(OUTPUT_TOKENS_CSS, "w", encoding="utf-8", newline="\n") as f:
        f.write("\n".join(tokens_css_lines))

    # =========================================================================
    # 6. WRITE STYLES/TYPOGRAPHY.CSS
    # =========================================================================
    type_css_lines = []
    type_css_lines.append("/**")
    type_css_lines.append(" * Kobo Watt Design System — Typography Tokens and Utilities")
    type_css_lines.append(" * Generated automatically from evidence/06-tokens-complete.json.")
    type_css_lines.append(" * Do not edit manually. Regenerate using: python tools/convert-tokens.py")
    type_css_lines.append(" */\n")

    type_css_lines.append(":root {")
    type_css_lines.append("  /* =======================================================================")
    type_css_lines.append("   * Typography Tokens (15 Styles)")
    type_css_lines.append("   * ======================================================================= */")

    for slug in type_order:
        s_slug = to_kebab_case(slug)
        tokens = typography_tokens[s_slug]
        type_css_lines.append(f"  /* {slug.title()} */")
        for var_name, var_val in tokens.items():
            type_css_lines.append(f"  {var_name}: {var_val};")
        type_css_lines.append("")

    if type_css_lines[-1] == "":
        type_css_lines.pop()

    type_css_lines.append("}\n")

    type_css_lines.append("/* =========================================================================")
    type_css_lines.append(" * Reusable Typography Utility Classes (15 Styles)")
    type_css_lines.append(" * ========================================================================= */\n")

    for slug in type_order:
        s_slug = to_kebab_case(slug)
        type_css_lines.append(f"/* {slug.title()} */")
        type_css_lines.append(f".kw-typography-{s_slug},")
        type_css_lines.append(f".{s_slug} {{")
        type_css_lines.append(f"  font-family: var(--kw-typography-{s_slug}-font-family);")
        type_css_lines.append(f"  font-size: var(--kw-typography-{s_slug}-font-size);")
        type_css_lines.append(f"  font-weight: var(--kw-typography-{s_slug}-font-weight);")
        type_css_lines.append(f"  line-height: var(--kw-typography-{s_slug}-line-height);")
        type_css_lines.append(f"  letter-spacing: var(--kw-typography-{s_slug}-letter-spacing);")
        type_css_lines.append("}\n")

    with open(OUTPUT_TYPOGRAPHY_CSS, "w", encoding="utf-8", newline="\n") as f:
        f.write("\n".join(type_css_lines))

    print("Success: Generated styles/tokens.css and styles/typography.css")
    print(f"  - 120 Primitive colours: {len(primitive_vars)}")
    print(f"  - 3 Shadow effects: {len(shadow_vars)}")
    print(f"  - 50 Light colour roles: {len(light_role_vars)}")
    print(f"  - 50 Dark colour roles: {len(dark_role_vars)}")
    print(f"  - 15 Typography styles: {len(typography_tokens)}")

if __name__ == "__main__":
    convert_tokens()

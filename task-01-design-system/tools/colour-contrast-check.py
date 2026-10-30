from pathlib import Path
import re
ROOT = Path(__file__).resolve().parents[1]
def luminance(h):
    channels = [int(h[i:i+2], 16) / 255 for i in (1, 3, 5)]
    linear = [c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4 for c in channels]
    return sum(c * w for c, w in zip(linear, (0.2126, 0.7152, 0.0722)))
def contrast(a, b):
    low, high = sorted((luminance(a), luminance(b)))
    return (high + 0.05) / (low + 0.05)
assert contrast('#000000', '#FFFFFF') == 21
assert contrast('#006B5E', '#006B5E') == 1
lines = ['WCAG relative-luminance calculation; solid sRGB, full opacity.',
         'Formula: (lighter luminance + 0.05) / (darker luminance + 0.05).',
         'Results are calculated from docs/colour-roles.md; this is not a Figma inspection.',
         'Sanity checks: black/white = 21; same colour = 1.']
count = 0
for row in (ROOT / 'docs/colour-roles.md').read_text(encoding='utf-8').splitlines():
    if row.startswith(('| light |', '| dark |')):
        cells = [c.strip() for c in row.strip('|').split('|')]
        a, b = re.findall(r'#[0-9A-Fa-f]{6}', row)[:2]
        value = contrast(a, b)
        minimum = float(cells[5].split(':')[0])
        result = 'Pass' if value >= minimum else 'Fail'
        assert cells[4] == f'{value:.2f}:1', row
        assert cells[6] == result, row
        lines.append(f'{cells[0]} | {cells[1]} / {cells[2]} | {value:.8f}:1 | minimum {minimum}:1 | {result}')
        count += 1
    elif row.startswith('|') and re.search(r'#[0-9A-Fa-f]{6} / #[0-9A-Fa-f]{6}', row):
        cells = [c.strip() for c in row.strip('|').split('|')]
        a, b, replacement = re.findall(r'#[0-9A-Fa-f]{6}', row)
        value, fixed = contrast(a, b), contrast(replacement, b)
        assert cells[2] == f'{value:.2f}:1'
        assert cells[5] == f'{fixed:.2f}:1'
        lines.append(f'Restriction: {a}/{b} = {value:.8f}:1; replacement {replacement}/{b} = {fixed:.8f}:1')
assert count == 56
lines.append(f'All {count} listed role rows and four restrictions match the document.')
report = '\n'.join(lines) + '\n'
(ROOT / 'evidence/02b-contrast-script-output.txt').write_text(report, encoding='utf-8')
print(lines[-1])

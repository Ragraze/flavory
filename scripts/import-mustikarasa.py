"""Fetch a versioned, local copy of Wikisumber's Mustikarasa transcription."""

import json
import hashlib
import html
import re
import subprocess
from pathlib import Path
from urllib.parse import urlencode

ROOT = Path(__file__).resolve().parents[1]
CACHE = Path('/tmp/flavory-mustikarasa')
CACHE.mkdir(exist_ok=True)


def query(params, cache_name):
    cached = CACHE / cache_name
    if not cached.exists():
        url = 'https://id.wikisource.org/w/api.php?' + urlencode({
            'action': 'query', 'format': 'json', **params,
        })
        result = subprocess.run(
            ['curl', '-sSfL', '--retry', '3', '--max-time', '60', url],
            check=True, capture_output=True,
        )
        data = json.loads(result.stdout)
        if 'error' in data:
            raise ValueError(data['error'])
        cached.write_text(json.dumps(data, ensure_ascii=False))
    return json.loads(cached.read_text())


titles = []
continuation = {}
while True:
    data = query({
        'list': 'allpages', 'apnamespace': 104,
        'apprefix': 'Mustikarasa.pdf/', 'aplimit': 500, **continuation,
    }, f'index-{len(titles)}.json')
    titles.extend(p['title'] for p in data['query']['allpages'])
    if 'continue' not in data:
        break
    continuation = data['continue']

titles.sort(key=lambda title: int(title.rsplit('/', 1)[1]))
pages = []
for offset in range(0, len(titles), 50):
    data = query({
        'prop': 'revisions', 'rvprop': 'ids|content', 'rvslots': 'main',
        'titles': '|'.join(titles[offset:offset + 50]),
    }, f'pages-{offset}.json')
    for page in data['query']['pages'].values():
        revision = page['revisions'][0]
        pages.append({
            'page': int(page['title'].rsplit('/', 1)[1]),
            'revision': revision['revid'],
            'text': revision['slots']['main']['*'],
        })
    print(f'{min(offset + 50, len(titles))}/{len(titles)} pages', flush=True)

pages.sort(key=lambda page: page['page'])
output = ROOT / 'public/data/mustikarasa-source.json'
output.parent.mkdir(parents=True, exist_ok=True)
output.write_text(json.dumps({
    'title': 'Mustikarasa', 'year': 1967,
    'source': 'https://id.wikisource.org/wiki/Indeks:Mustikarasa.pdf',
    'license': 'CC BY-SA 4.0 (transkripsi Wikisumber); pindaian domain publik',
    'pages': pages,
}, ensure_ascii=False, separators=(',', ':')))
print(f'Saved {len(pages)} pages to {output}')


def plain(value):
    value = re.sub(r'<noinclude>.*?</noinclude>', '', value, flags=re.S)
    value = re.sub(r'<!--.*?-->', '', value, flags=re.S)
    value = re.sub(r'\[\[(?:[^]|]*\|)?([^]]+)\]\]', r'\1', value)
    value = re.sub(r'\{\{(?:gap|rule|rh|nop)\b[^{}]*\}\}?', ' ', value, flags=re.I)
    for _ in range(8):
        value = re.sub(r'\{\{[^{}|]+\|([^{}]*)\}\}', r'\1', value)
    value = re.sub(r'\{\{[^{}]*\}\}', '', value)
    value = re.sub(r'<br\s*/?>', '\n', value, flags=re.I)
    value = re.sub(r'<[^>]*>', '', value)
    value = value.replace("'''", '').replace("''", '')
    return html.unescape(value).strip()


def blocks(text):
    result = []
    in_table = False
    text = re.sub(r'<noinclude>.*?</noinclude>', '', text, flags=re.S)
    # Centered headings often wrap over lines; unwrap before splitting rows.
    text = re.sub(r'\{\{c\|([\s\S]*?)\}\}', r'\1', text, flags=re.I)
    text = re.sub(r'\{\{ordered list\s*\|([\s\S]*?)\}\}',
                  lambda match: '\n'.join('#' + item.strip() for item in match[1].split('|')
                                           if item.strip() and not re.match(r'\w+\s*=', item.strip())),
                  text, flags=re.I)
    for raw in text.splitlines():
        line = raw.strip()
        if line.startswith('{|'):
            in_table = True
            continue
        if line.startswith('|}'):
            in_table = False
            continue
        if line.startswith('|-') or line.startswith('<section'):
            continue
        if in_table and line.startswith('|'):
            cells = [plain(cell) for cell in line.lstrip('|').split('||')]
            cells = [cell for cell in cells if cell]
            if cells:
                result.append({'kind': 'row', 'cells': cells})
            continue
        cleaned = plain(line.lstrip('#*'))
        if not cleaned:
            continue
        kind = 'step' if line.startswith('#') else 'paragraph'
        if re.match(r'^(?:Bahan|Bumbu|Tjara|Cara|Keterangan|Kererangan)', cleaned, re.I):
            kind = 'heading'
        result.append({'kind': kind, 'text': cleaned})
    return result


sections = {}
for page in pages:
    text = re.sub(r'<noinclude>.*?</noinclude>', '', page['text'], flags=re.S)
    markers = list(re.finditer(r'<section\s+(begin|end)=["\']([^"\']+)["\']\s*/>', text))
    for index, marker in enumerate(markers):
        if marker[1] != 'begin':
            continue
        stop = markers[index + 1].start() if index + 1 < len(markers) else len(text)
        part = text[marker.end():stop]
        section = sections.setdefault(marker[2], {'parts': [], 'pages': []})
        section['parts'].append(part)
        if page['page'] not in section['pages']:
            section['pages'].append(page['page'])

recipes = []
for key, section in sections.items():
    text = '\n'.join(section['parts'])
    title = re.search(r"'''(.*?)'''", text, re.S)
    if not title or not re.search(r'Bahan|Bumbu', text, re.I):
        continue
    name = plain(title[1]).strip()
    if not name or len(name) > 160:
        continue
    body = blocks(text)
    body = [block for block in body if block.get('text') != name]
    recipes.append({
        'id': 'mr-' + hashlib.sha256(key.encode()).hexdigest()[:12],
        'title': name, 'pages': section['pages'], 'blocks': body,
    })

archive = {
    'title': 'Mustikarasa', 'year': 1967,
    'source': 'https://id.wikisource.org/wiki/Indeks:Mustikarasa.pdf',
    'license': 'CC BY-SA 4.0',
    'recipes': recipes,
    'pages': [{'page': page['page'], 'revision': page['revision'],
               'blocks': blocks(page['text'])} for page in pages],
}
(output.parent / 'mustikarasa.json').write_text(json.dumps(
    archive, ensure_ascii=False, separators=(',', ':'),
))
print(f'Indexed {len(recipes)} recipe sections; all {len(pages)} source pages retained.')

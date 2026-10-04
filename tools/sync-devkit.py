#!/usr/bin/env python3
"""Import reference data only; blog UI files remain owned by the blog."""
import argparse
import json
from pathlib import Path
import urllib.request

ROOT = Path(__file__).resolve().parents[1]

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--source', type=Path, help='local devkit checkout')
    parser.add_argument('--ref', default='main', help='devkit commit or branch')
    args = parser.parse_args()
    ref = args.ref
    if not args.source and ref == 'main':
        request = urllib.request.Request('https://api.github.com/repos/clang-engineer/devkit/commits/main', headers={'User-Agent': 'devkit-reference-sync'})
        with urllib.request.urlopen(request, timeout=30) as response:
            ref = json.load(response)['sha']
    def read(path):
        if args.source:
            return json.loads((args.source / path).read_text())
        with urllib.request.urlopen(f'https://raw.githubusercontent.com/clang-engineer/devkit/{ref}/{path}', timeout=30) as response:
            return json.load(response)
    cheats = read('reference/cheatsheets/catalog.json')
    cli = read('reference/cli/catalog.json')
    slugs = []
    for group in cheats['groups']:
        for item in group['items']:
            slugs.append(item['slug'])
            if args.source and not (args.source / 'reference/cheatsheets' / item['file']).is_file():
                raise ValueError('Missing cheatsheet: ' + item['file'])
    if len(slugs) != len(set(slugs)):
        raise ValueError('Duplicate cheatsheet slug')
    for category in cli['categories']:
        names = {item['name'] for item in category['commands']}
        for relation in category['relations']:
            if relation['from'] not in names or relation['to'] not in names:
                raise ValueError('Unknown CLI relation endpoint')
    for path, data in [('_data/cheatsheets.json', cheats), ('cmdtreemap/catalog.json', cli)]:
        target = ROOT / path
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
    (ROOT / '_data/cheatsheets.yml').unlink(missing_ok=True)
    (ROOT / 'cmdtreemap/commands.json').unlink(missing_ok=True)
    (ROOT / '_data/devkit-source.json').write_text(json.dumps({'repository': 'clang-engineer/devkit', 'ref': ref, 'generated': True}, indent=2) + '\n')

if __name__ == '__main__':
    main()

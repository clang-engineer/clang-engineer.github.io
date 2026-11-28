"""Derive Tinty scheme popularity from Radar repositories without changing rankings."""
import argparse
import json
import re
from pathlib import Path

GENERIC = {"vim", "nvim", "neovim", "tmux", "vscode", "terminal", "theme", "colorscheme", "colors", "emacs", "kitty", "ghostty", "alacritty"}

VARIANTS = {"dark", "light", "hard", "medium", "soft", "mocha", "latte", "frappe", "macchiato", "moon", "dawn", "day", "night", "storm", "terminal", "wave", "dragon", "darker", "lighter", "contrast", "high", "low", "pale", "deep", "eighties"}

def normalize(value):
    return re.sub(r"[^a-z0-9]", "", value.lower())

def repo_candidates(item):
    owner, name = item["id"].lower().split("/", 1)
    # Only use owner as a fallback for a generic application port name.
    stem = re.sub(r"(?:[._-](?:nvim|vim|neovim|theme|colorscheme|vscode|tmux))+$", "", name)
    if normalize(stem) in GENERIC:
        return {normalize(owner)}
    return {normalize(stem)}

def build(items, schemes):
    candidates = {}
    for item in items:
        for key in repo_candidates(item):
            if key and key not in GENERIC:
                candidates.setdefault(key, []).append(item)
    families = {}
    matches = {}
    for scheme in sorted(set(schemes)):
        slug = scheme.split("-", 1)[1]
        words = slug.split("-")
        keys = [normalize("-".join(words[:n])) for n in range(1, len(words)+1)]
        # Match exact names first; only strip recognized variant suffixes.
        key = keys[-1] if keys[-1] in candidates else None
        if key is None:
            for n in range(len(words)-1, 0, -1):
                suffix = words[n:]
                if all(w in VARIANTS for w in suffix) and keys[n-1] in candidates:
                    key = keys[n-1]
                    break
        if not key:
            continue
        repos = sorted(candidates[key], key=lambda r: (-r["stars"], r["id"]))
        families[key] = {"stars": repos[0]["stars"], "representative": repos[0]["id"],
                         "repositories": [r["id"] for r in repos]}
        matches[scheme] = key
    return {"version": 1, "families": families, "schemes": matches,
            "coverage": {"total": len(set(schemes)), "matched": len(matches),
                         "unmatched": sorted(set(schemes)-matches.keys())}}

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("rankings", type=Path)
    parser.add_argument("schemes", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    data = json.loads(args.rankings.read_text())
    items = next(c["items"] for c in data["categories"] if c["id"] == "developer-color-themes")
    schemes = [f"{system}-{p.stem}" for system in ("base16", "base24")
               for p in (args.schemes / system).glob("*.yaml")]
    if not schemes:
        raise SystemExit("No scheme files found")
    result = build(items, schemes)
    args.output.write_text(json.dumps(result, indent=2, sort_keys=True) + "\n")
    print(f"Matched {result['coverage']['matched']} of {len(schemes)} schemes")

if __name__ == "__main__":
    main()

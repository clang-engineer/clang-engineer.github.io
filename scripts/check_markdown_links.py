#!/usr/bin/env python3
"""Check local Markdown file links in the repository (not external URLs).

Usage: python3 scripts/check_markdown_links.py
"""
from pathlib import Path
from urllib.parse import unquote, urlsplit
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
LINK = re.compile(r"(?<!!)\[[^\]]*\]\((<?[^\s)]+>?)(?:\s+['\"][^)]*['\"])?\)")
REF_DEF = re.compile(r"^\s*\[[^\]]+\]:\s*(<?\S+>?)", re.MULTILINE)
FENCE = re.compile(r"^\s*(`{3,}|~{3,})")
POST_URL = re.compile(r"{%\s*post_url\s+([^%]+?)\s*%}")
IGNORED = ("http:", "https:", "mailto:", "tel:", "data:", "javascript:", "#", "{{", "{%")

def strip_code(source):
    out, marker = [], None
    for line in source.splitlines():
        match = FENCE.match(line)
        if match:
            delim = match.group(1)
            if marker is None:
                marker = delim[0]
            elif marker == delim[0]:
                marker = None
            out.append("")
        else:
            out.append("" if marker else line)
    return "\n".join(out)

def target_exists(source, href):
    href = href.strip("<>")
    if href.startswith(IGNORED) or not href:
        return True
    if href.startswith("//"):
        return True
    path = unquote(urlsplit(href).path)
    if not path:
        return True
    candidate = (ROOT / path.lstrip("/")) if path.startswith("/") else (source.parent / path)
    variants = [candidate, candidate.with_suffix(".md") if not candidate.suffix else candidate,
                candidate / "index.md", candidate / "index.html"]
    return any(p.exists() for p in variants)

def main():
    failures = []
    docs = sorted(list(ROOT.rglob("*.md")))
    for doc in docs:
        if any(part in {".git", "_site", "node_modules", "vendor"} for part in doc.parts):
            continue
        body = strip_code(doc.read_text(encoding="utf-8-sig"))
        for m in list(LINK.finditer(body)) + list(REF_DEF.finditer(body)):
            href = m.group(1)
            if not target_exists(doc, href):
                line = body.count("\n", 0, m.start()) + 1
                failures.append((doc.relative_to(ROOT), line, href))
        for m in POST_URL.finditer(body):
            slug = m.group(1).strip().strip("'\"")
            if not (ROOT / "_posts" / (slug + ".md")).exists():
                line = body.count("\n", 0, m.start()) + 1
                failures.append((doc.relative_to(ROOT), line, "{% post_url " + slug + " %}"))
    for file, line, href in failures:
        print(f"{file}:{line}: missing local target: {href}")
    print(f"Checked {len(docs)} Markdown files; {len(failures)} unresolved references.")
    return 1 if failures else 0

if __name__ == "__main__":
    sys.exit(main())

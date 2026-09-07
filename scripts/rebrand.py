#!/usr/bin/env python3
"""Rebrand the upstream arr-stack-card bundle into episeerr-card.

Pure renaming, no behavior change - custom element name, editor element
name, and the window.customCards picker entry. Run this fresh against
arr-stack-card.js any time upstream is re-pulled (git fetch upstream) and
before layering our own Episeerr-specific edits on top, so the diff against
upstream stays as small and reviewable as possible.

Usage: python3 scripts/rebrand.py
"""
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "arr-stack-card.js"
DEST = ROOT / "episeerr-card.js"

content = SRC.read_text()

content = content.replace("ArrStackCardEditor", "EpiseerrCardEditor")
content = content.replace("ArrStackCard", "EpiseerrCard")
content = content.replace("arr-stack-card-editor", "episeerr-card-editor")
content = content.replace('"arr-stack-card"', '"episeerr-card"')
content = content.replace('name: "Arr Stack Card"', 'name: "Episeerr Card"')
content = content.replace(
    'description: "Media server dashboard — Radarr, Sonarr, Overseerr, SABnzbd, qBittorrent"',
    'description: "Episeerr-centric media dashboard - forked from arr-stack-card"',
)

assert "arr-stack-card" not in content and "ArrStackCard" not in content, (
    "rename incomplete - a reference to the old name survived"
)

DEST.write_text(content)
print(f"wrote {DEST} ({len(content)} bytes)")

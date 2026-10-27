#!/usr/bin/env python3
"""Run HelixMatch against a clinical note."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(Path(__file__).resolve().parent))

from helixmatch.matcher import rank_trials  # noqa: E402
from helixmatch.parser import parse_note  # noqa: E402


def load_trials():
    path = ROOT / "data" / "trials.json"
    return json.loads(path.read_text())


def main():
    parser = argparse.ArgumentParser(description="HelixMatch RAG trial matcher")
    parser.add_argument("--note", help="Path to a clinical note")
    parser.add_argument("--text", help="Raw note text")
    parser.add_argument("--top", type=int, default=5)
    args = parser.parse_args()

    if args.note:
        text = Path(args.note).read_text()
    elif args.text:
        text = args.text
    else:
        text = (ROOT / "engine" / "samples" / "nsclc.txt").read_text()

    phenotype = parse_note(text)
    matches = rank_trials(phenotype, load_trials())[: args.top]

    print("ICD-10:", ", ".join(f"{i['code']} ({i['confidence']})" for i in phenotype["icd10"]) or "—")
    print("Diagnoses:", ", ".join(phenotype["diagnoses"]) or "—")
    print("Age/sex/stage/ECOG:", phenotype["age"], phenotype["sex"], phenotype["stage"], phenotype["ecog"])
    print()
    for m in matches:
        t = m["trial"]
        flag = "ELIGIBLE" if m["eligible"] else "FLAGGED"
        print(f"{m['score']:5.1f}  {flag:8}  {t['nctId']}  {t['sponsor']}")
        print(f"       {t['title']}")


if __name__ == "__main__":
    main()

import math
import re
from collections import Counter

SYN = {
    "nsclc": ["lung", "adenocarcinoma", "carcinoma"],
    "dermatitis": ["eczema", "skin"],
    "igan": ["kidney", "proteinuria"],
    "sickle": ["hbss", "anemia", "voc"],
    "obesity": ["bmi", "metabolic"],
    "diabetes": ["t2d", "hba1c"],
    "failure": ["hfref", "lvef", "chf"],
}


def tokenize(text: str):
    return [t for t in re.sub(r"[^a-z0-9+\-%]+", " ", text.lower()).split() if len(t) > 2]


def embed(text: str) -> dict:
    tokens = tokenize(text)
    extra = []
    for t in tokens:
        for k, syns in SYN.items():
            if k in t:
                extra.extend(syns)
    tf = Counter(tokens + extra)
    n = math.sqrt(sum(v * v for v in tf.values())) or 1.0
    return {k: v / n for k, v in tf.items()}


def cosine(a: dict, b: dict) -> float:
    small, large = (a, b) if len(a) < len(b) else (b, a)
    return sum(v * large.get(k, 0.0) for k, v in small.items())


def phenotype_doc(p: dict) -> str:
    parts = [
        " ".join(p.get("diagnoses") or []),
        " ".join(f"{i['code']} {i['label']}" for i in p.get("icd10") or []),
        " ".join(f"{k} {v}" for k, v in (p.get("biomarkers") or {}).items()),
        " ".join(f"{k} {v}" for k, v in (p.get("labs") or {}).items()),
        p.get("stage") or "",
    ]
    return " ".join(parts)


def trial_doc(t: dict) -> str:
    inc = " ".join(c.get("text", "") for c in t.get("inclusion") or [])
    return " ".join([
        t.get("title", ""),
        " ".join(t.get("conditions") or []),
        t.get("summary", ""),
        inc,
        t.get("eligibilityRaw", ""),
    ])

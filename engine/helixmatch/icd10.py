import re

ICD10 = [
    ("C34.90", "Malignant neoplasm of bronchus or lung", ["nsclc", "non-small cell lung", "lung adenocarcinoma", "lung cancer"]),
    ("C50.919", "Malignant neoplasm of breast", ["breast cancer", "her2", "invasive ductal"]),
    ("C43.9", "Malignant melanoma of skin", ["melanoma", "braf v600"]),
    ("C61", "Malignant neoplasm of prostate", ["prostate cancer", "mcrpc"]),
    ("C90.00", "Multiple myeloma", ["multiple myeloma"]),
    ("C18.9", "Malignant neoplasm of colon", ["colorectal", "colon cancer", "crc"]),
    ("L20.9", "Atopic dermatitis", ["atopic dermatitis", "atopic eczema", "eczema"]),
    ("M34.0", "Progressive systemic sclerosis", ["systemic sclerosis", "scleroderma", "dcssc"]),
    ("N02.8", "IgA nephropathy", ["iga nephropathy", "igan"]),
    ("D57.1", "Sickle-cell disease", ["sickle cell", "hbss", "scd"]),
    ("E11.9", "Type 2 diabetes mellitus", ["type 2 diabetes", "t2d", "t2dm"]),
    ("E66.9", "Obesity", ["obesity", "obese"]),
    ("I50.22", "Chronic systolic heart failure", ["heart failure", "hfref", "chf"]),
    ("K50.90", "Crohn's disease", ["crohn"]),
    ("K75.81", "NASH", ["nash", "mash", "steatohepatitis"]),
    ("D89.811", "Chronic GVHD", ["cgvhd", "graft versus host", "graft-versus-host"]),
    ("E85.4", "Organ-limited amyloidosis", ["attr", "transthyretin amyloid"]),
    ("C91.10", "CLL", ["cll", "chronic lymphocytic"]),
    ("L40.0", "Psoriasis vulgaris", ["psoriasis"]),
]


def match_icd10(text: str):
    hay = text.lower()
    hits = []
    for code, label, terms in ICD10:
        n = 0
        for t in terms:
            if len(t) <= 4:
                if re.search(rf"(^|[^a-z0-9]){re.escape(t)}([^a-z0-9]|$)", hay):
                    n += 1
            elif t in hay:
                n += 1
        if n:
            hits.append({"code": code, "label": label, "confidence": round(min(0.97, 0.62 + 0.12 * n), 2), "n": n})
    hits.sort(key=lambda h: (-h["n"], -h["confidence"]))
    return [{"code": h["code"], "label": h["label"], "confidence": h["confidence"]} for h in hits[:6]]

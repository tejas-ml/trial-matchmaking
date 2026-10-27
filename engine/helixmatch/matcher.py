from .embeddings import cosine, embed, phenotype_doc, trial_doc

ALIASES = {
    "nsclc": ["nsclc", "non-small cell", "lung cancer", "lung adenocarcinoma"],
    "iga nephropathy": ["iga nephropathy", "igan", "nephropathy"],
    "atopic dermatitis": ["atopic dermatitis", "eczema"],
    "sickle cell": ["sickle cell", "hbss", "scd"],
    "obesity": ["obesity", "overweight"],
    "type 2 diabetes": ["type 2 diabetes", "t2d"],
    "heart failure": ["heart failure", "hfref", "chf"],
    "breast cancer": ["breast cancer", "her2"],
    "systemic sclerosis": ["systemic sclerosis", "scleroderma", "dcssc"],
}


def _list(v):
    if v is None:
        return []
    return v if isinstance(v, list) else [v]


def _hay(p: dict) -> str:
    return " ".join([
        " ".join(p.get("diagnoses") or []),
        " ".join(p.get("medications") or []),
        p.get("stage") or "",
        " ".join((p.get("biomarkers") or {}).values()),
        " ".join(i.get("label", "") for i in p.get("icd10") or []),
    ]).lower()


def _field(p: dict, field):
    if not field:
        return None
    if field in p:
        return p[field]
    if field in (p.get("labs") or {}):
        return p["labs"][field]
    if field in (p.get("biomarkers") or {}):
        return p["biomarkers"][field]
    if field in (p.get("flags") or {}):
        return p["flags"][field]
    return None


def eval_criterion(c: dict, p: dict, exclusion: bool) -> dict:
    kind = c.get("kind")
    field = c.get("field")
    op = c.get("op")
    val = c.get("value")
    fv = _field(p, field)
    hay = _hay(p)

    def pack(status, evidence=""):
        return {"id": c.get("id"), "text": c.get("text"), "status": status, "evidence": evidence}

    if kind == "age":
        if p.get("age") is None:
            return pack("unknown", "Not stated")
        age = p["age"]
        vals = [float(x) for x in _list(val)]
        ok = True
        if op == "gte":
            ok = age >= vals[0]
        elif op == "lte":
            ok = age <= vals[0]
        elif op == "between":
            ok = vals[0] <= age <= vals[1]
        return pack("matched" if ok else "failed", f"Age {age}")

    if kind in ("ecog", "bmi", "lab"):
        n = fv if isinstance(fv, (int, float)) else (p.get("bmi") if kind == "bmi" else p.get("ecog") if kind == "ecog" else None)
        if n is None:
            return pack("unknown")
        vals = [float(x) for x in _list(val)]
        ok = True
        if op == "gte":
            ok = n >= vals[0]
        elif op == "lte":
            ok = n <= vals[0]
        elif op == "between":
            ok = vals[0] <= n <= vals[1]
        return pack("matched" if ok else "failed", f"{field}={n}")

    if kind == "stage":
        if not p.get("stage"):
            return pack("unknown")
        ok = p["stage"] in [str(x) for x in _list(val)]
        return pack("matched" if ok else "failed", f"Stage {p['stage']}")

    if kind in ("diagnosis", "medication"):
        values = [str(x).lower() for x in _list(val)]
        blob = hay if kind == "diagnosis" else (hay + " " + " ".join(p.get("medications") or []))
        ok = any(v in blob for v in values)
        if exclusion:
            return pack("failed" if ok else "matched")
        if ok:
            return pack("matched")
        return pack("failed" if kind == "diagnosis" else "unknown")

    if kind == "biomarker":
        raw = "" if fv is None else str(fv)
        if not raw:
            return pack("unknown")
        ok = any(str(v).lower() in raw.lower() for v in _list(val))
        if exclusion:
            return pack("failed" if ok else "matched", raw)
        return pack("matched" if ok else "failed", raw)

    if kind == "flag":
        present = bool(fv)
        if exclusion:
            return pack("failed" if present else "matched")
        return pack("matched" if present == bool(val) else "failed")

    return pack("unknown")


def score_trial(p: dict, trial: dict, qvec: dict) -> dict:
    inclusion = [eval_criterion(c, p, False) for c in trial.get("inclusion") or []]
    exclusion = [eval_criterion(c, p, True) for c in trial.get("exclusion") or []]
    known = [c for c in inclusion if c["status"] != "unknown"]
    hit = sum(1 for c in inclusion if c["status"] == "matched")
    inc_fail = sum(1 for c in inclusion if c["status"] == "failed")
    exc_fail = sum(1 for c in exclusion if c["status"] == "failed")
    rate = hit / len(known) if known else 0.4
    semantic = cosine(qvec, embed(trial_doc(trial)))
    hay = f"{trial.get('title','')} {' '.join(trial.get('conditions') or [])} {trial.get('summary','')}".lower()
    dxn = 0.0
    if p.get("diagnoses"):
        hits = 0
        for d in p["diagnoses"]:
            if any(a in hay for a in ALIASES.get(d, [d])):
                hits += 1
        dxn = hits / len(p["diagnoses"])
    spec = min(1.0, len(trial.get("inclusion") or []) / 4)
    score = 34 * rate + 26 * dxn + 18 * spec * rate + 12 * semantic + 3 * hit
    if exc_fail == 0 and inc_fail == 0 and rate >= 0.5:
        score += 16
    if inc_fail:
        score *= 0.58
    if exc_fail:
        score *= 0.22
    score = max(4.0, min(96.8, score))
    eligible = exc_fail == 0 and inc_fail == 0 and rate >= 0.5
    return {
        "trial": trial,
        "score": round(score, 1),
        "eligible": eligible,
        "inclusion": inclusion,
        "exclusion": exclusion,
        "semantic": round(semantic, 3),
    }


def rank_trials(phenotype: dict, trials: list) -> list:
    qvec = embed(phenotype_doc(phenotype))
    ranked = [score_trial(phenotype, t, qvec) for t in trials]
    ranked.sort(key=lambda m: (-m["score"], -int(m["eligible"])))
    return ranked

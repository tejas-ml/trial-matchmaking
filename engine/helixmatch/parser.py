import re
from .icd10 import match_icd10

MEDS = [
    "metformin", "lisinopril", "atorvastatin", "hydroxyurea", "pembrolizumab",
    "trastuzumab", "prednisone", "triamcinolone", "mometasone", "carvedilol",
    "furosemide", "spironolactone", "ramipril",
]


def _num(pattern: str, text: str):
    m = re.search(pattern, text, re.I)
    if not m:
        return None
    try:
        return float(m.group(1).replace(",", ""))
    except (ValueError, IndexError):
        return None


def parse_note(note: str) -> dict:
    text = note
    lower = text.lower()
    age = _num(r"(\d{1,3})[-\s]*year[-\s]*old", text) or _num(r"\bage[:\s]+(\d{1,3})\b", text)
    sex = "unknown"
    if re.search(r"\d{1,3}[-\s]*year[-\s]*old\s+(woman|female)", text, re.I) or re.search(r"\b(female|woman)\b", text, re.I):
        sex = "female"
    if re.search(r"\d{1,3}[-\s]*year[-\s]*old\s+(man|male)", text, re.I):
        sex = "male"

    dx_map = [

        ("breast cancer", r"breast cancer|invasive ductal"),
        ("melanoma", r"melanoma"),
        ("multiple myeloma", r"multiple myeloma"),
        ("colorectal cancer", r"colorectal|colon cancer"),
        ("atopic dermatitis", r"atopic dermatitis|atopic eczema"),
        ("systemic sclerosis", r"systemic sclerosis|scleroderma|dcssc"),
        ("iga nephropathy", r"iga nephropathy|\bigan\b"),
        ("sickle cell", r"sickle cell|\bhbss\b"),
        ("type 2 diabetes", r"type 2 diabetes|\bt2d\b"),
        ("obesity", r"\bobesity\b|\bobese\b"),
        ("heart failure", r"heart failure|\bhfref\b"),
        ("crohn", r"crohn"),
        ("nash", r"\bnash\b|steatohepatitis"),
        ("chronic gvhd", r"chronic gvhd|graft[-\s]?versus[-\s]?host"),
        ("hypertension", r"hypertension|\bhtn\b"),
        ("dyslipidemia", r"dyslipidemia|hyperlipidemia"),
    ]
    diagnoses = [name for name, pat in dx_map if re.search(pat, text, re.I)]
    if re.search(r"non[-\s]?small cell lung|\bnsclc\b|lung adenocarcinoma", text, re.I):
        diagnoses.insert(0, "nsclc")
    elif re.search(r"\bsmall cell lung|\bsclc\b", text, re.I):
        diagnoses.insert(0, "small cell lung cancer")

    labs = {}
    for key, pat in [
        ("bmi", r"bmi[:\s]*(\d+(?:\.\d+)?)"),
        ("egfr", r"egfr[:\s]*(\d+(?:\.\d+)?)"),
        ("hb", r"\bhb(?:g)?[:\s]*(\d+(?:\.\d+)?)\s*g"),
        ("upcr", r"upcr[:\s]*(\d+(?:\.\d+)?)"),
        ("lvef", r"(?:lvef|ejection fraction)[:\s]*(\d+(?:\.\d+)?)"),
        ("ntprobnp", r"nt[-\s]?probnp[:\s]*(\d[\d,]*)"),
        ("mrss", r"mrss[:\s]*(\d+(?:\.\d+)?)"),
        ("voc", r"(\d+)\s*(?:vocs?|vaso[-\s]?occlusive)"),
        ("hba1c", r"hba1c[:\s]*(\d+(?:\.\d+)?)"),
        ("pdl1", r"pd[-\s]?l1[:\s]*(\d+)"),
        ("priorLines", r"(\d+)\s*(?:prior|previous)\s+lines?"),
    ]:
        v = _num(pat, text)
        if v is not None:
            labs[key] = v

    stage_m = re.search(r"stage\s*(iv|iii[abcd]?|ii[abc]?|[1-4])", text, re.I)
    stage = stage_m.group(1).upper() if stage_m else None
    if stage == "4":
        stage = "IV"

    biomarkers = {}
    if re.search(r"egfr[^.\n]{0,40}(wild[-\s]?type|wt|negative)", text, re.I):
        biomarkers["EGFR"] = "wild-type"
    elif re.search(r"egfr[^.\n]{0,30}(exon\s*19|l858r|mutant|positive)", text, re.I):
        biomarkers["EGFR"] = "mutant"
    if re.search(r"her2[^.\n]{0,24}(3\+|positive|amplified)", text, re.I):
        biomarkers["HER2"] = "positive"
    if re.search(r"braf[^.\n]{0,24}v600", text, re.I):
        biomarkers["BRAF"] = "V600E"
    if re.search(r"anti[-\s]?scl[-\s]?70|ata\+|anti[-\s]?topoisomerase", text, re.I):
        biomarkers["SScAb"] = "ATA"

    def affirmed(pattern: str) -> bool:
        m = re.search(pattern, text, re.I)
        if not m:
            return False
        window = text[max(0, m.start() - 18) : m.end()].lower()
        if re.search(r"\b(no|not|without|denies|negative for)\b", window):
            return False
        return True

    flags = {}
    if affirmed(r"pregnan") and not re.search(r"\bnot pregnant\b", text, re.I):
        flags["pregnant"] = True
    if affirmed(r"brain met|cns met"):
        flags["brainMets"] = True
    if affirmed(r"active infection"):
        flags["activeInfection"] = True
    if re.search(r"interstitial lung|pneumonitis", text, re.I):
        flags["ild"] = True

    meds = [m for m in MEDS if m in lower]
    if re.search(r"topical (corticosteroid|steroid)|tcs", text, re.I):
        meds.append("topical corticosteroid")

    ecog = _num(r"ecog(?:\s*ps)?[:\s]*([0-4])", text)
    return {
        "age": int(age) if age is not None else None,
        "sex": sex,
        "diagnoses": diagnoses,
        "icd10": match_icd10(text),
        "medications": meds,
        "labs": labs,
        "biomarkers": biomarkers,
        "stage": stage,
        "ecog": int(ecog) if ecog is not None else None,
        "bmi": labs.get("bmi"),
        "flags": flags,
    }

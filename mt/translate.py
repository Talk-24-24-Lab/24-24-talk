# 24/24 ONE WORLD — traduction automatique des menus, faite une seule fois ici (GitHub Actions), pas sur les téléphones.
# Modèle : MADLAD-400 3B (Google, licence Apache 2.0) converti pour CTranslate2. Usage : python mt/translate.py nl,sq+,am+
# « + » après le code = traduire aussi les textes de l'appli (sinon seulement le portail et les notifications d'appel).
import json, os, re, sys, time, unicodedata
import ctranslate2, transformers

MODEL = os.environ.get("MT_MODEL", "madlad-ct2")
TOK = os.environ.get("MT_TOK", "google/madlad400-3b-mt")
ALIASES = {"he": ["he", "iw"], "nb": ["no", "nb"], "tl": ["fil", "tl"], "zh-TW": ["zh_Hant", "zh-Hant", "zh_TW", "zh"],
           "ku": ["ku", "kmr"], "jv": ["jv", "jw"], "mos": ["mos"], "haw": ["haw"], "ceb": ["ceb"]}
# Ce qui ne se traduit jamais : remplacé par un nombre unique, puis remis à sa place.
KEEP = ["24/24 ONE WORLD", "sebastienchevrier.github.io/24-24-talk", "sebastienchevrier.github.io", "schevrier.1975@gmail.com",
        "Sébastien Chevrier", "AI LAB", "ONE WORLD"]
LEAD = re.compile(r"^([^\w{<(«“\"']+)", re.U)
TRAIL = re.compile(r"([\s]*[✓🙂…→]+)$", re.U)

tok = transformers.AutoTokenizer.from_pretrained(TOK)
VOCAB = tok.get_vocab()
tr = ctranslate2.Translator(MODEL, device="cpu", compute_type="int8", inter_threads=1, intra_threads=os.cpu_count() or 4)

def target_token(code):
    for c in ALIASES.get(code, [code]):
        t = "<2%s>" % c
        if t in VOCAB:
            return t
    return None

def ascii_digits(s):
    return "".join(str(unicodedata.digit(ch)) if ch.isdigit() and not ch.isascii() and unicodedata.digit(ch, None) is not None else ch for ch in s)

def protect(text):
    m = {}
    n = [0]
    def put(orig):
        n[0] += 1
        key = str(8800 + n[0])
        m[key] = orig
        return key
    for w in KEEP:
        text = re.sub(re.escape(w), lambda x: put(x.group(0)), text)
    text = re.sub(r"\{[a-z_]+\}", lambda x: put(x.group(0)), text)
    return text, m

def restore(out, m):
    if not all(k in out for k in m):
        out = ascii_digits(out)
    for k, v in m.items():
        if out.count(k) != 1:
            return None
        out = out.replace(k, v)
    return out

def batch_translate(texts, ttok):
    res = []
    B = 16
    for i in range(0, len(texts), B):
        chunk = texts[i:i + B]
        toks = [tok.convert_ids_to_tokens(tok.encode(ttok + " " + t)) for t in chunk]
        outs = tr.translate_batch(toks, beam_size=2, max_decoding_length=400, repetition_penalty=1.1)
        for o in outs:
            res.append(tok.decode(tok.convert_tokens_to_ids(o.hypotheses[0]), skip_special_tokens=True).strip())
    return res

def pieces(text):
    """Découpe un texte en segments à traduire : listes « a|b|c », balises HTML, symboles de début et de fin."""
    parts = []
    for seg in text.split("|"):
        for bit in re.split(r"(<[^>]+>)", seg):
            if bit.startswith("<") and bit.endswith(">"):
                parts.append(("raw", bit))
                continue
            lead = LEAD.match(bit)
            pre = lead.group(1) if lead else ""
            rest = bit[len(pre):]
            trail = TRAIL.search(rest)
            post = trail.group(1) if trail else ""
            core = rest[:len(rest) - len(post)] if post else rest
            if pre: parts.append(("raw", pre))
            if re.search(r"[A-Za-z]", core): parts.append(("tr", core))
            elif core: parts.append(("raw", core))
            if post: parts.append(("raw", post))
        parts.append(("raw", "|"))
    parts.pop()
    return parts

def run(code, with_app, src):
    ttok = target_token(code)
    if not ttok:
        print("PAS DE JETON", code, flush=True)
        return {"code": code, "missing_lang": True, "s": {}}
    items = [(k, v) for k, v in src if with_app or not k.startswith("a.")]
    plan, jobs = [], []
    for k, v in items:
        ps = pieces(v)
        plan.append((k, ps))
        for kind, txt in ps:
            if kind == "tr":
                p, m = protect(txt)
                jobs.append((p, m))
    t0 = time.time()
    outs = batch_translate([j[0] for j in jobs], ttok)
    res, bad, it = {}, [], iter(zip(jobs, outs))
    for k, ps in plan:
        acc, ok = [], True
        for kind, txt in ps:
            if kind == "raw":
                acc.append(txt)
                continue
            (p, m), o = next(it)
            r = restore(o, m)
            if r is None or not r.strip():
                ok = False
                r = txt
            # garder l'espace autour du morceau traduit
            if txt[:1] == " " and r[:1] != " ": r = " " + r
            if txt[-1:] == " " and r[-1:] != " ": r = r + " "
            acc.append(r)
        if ok:
            res[k] = "".join(acc)
        else:
            bad.append(k)
    print(code, ttok, "%d textes, %d refusés, %.0f s" % (len(res), len(bad), time.time() - t0), flush=True)
    return {"code": code, "token": ttok, "s": res, "bad": bad}

if __name__ == "__main__":
    src = json.load(open(os.path.join(os.path.dirname(__file__), "src.json"), encoding="utf-8"))
    os.makedirs("mt-out", exist_ok=True)
    for spec in sys.argv[1].split(","):
        code, with_app = spec.rstrip("+"), spec.endswith("+")
        out = run(code, with_app, src)
        json.dump(out, open("mt-out/%s.json" % code, "w", encoding="utf-8"), ensure_ascii=False)

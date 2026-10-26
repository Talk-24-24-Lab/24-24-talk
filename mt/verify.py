# 24/24 ONE WORLD — contrôle qualité des traductions automatiques (mt/out), fait sur GitHub Actions.
# Pour chaque texte traduit : 1) on le retraduit en anglais avec le même modèle et on compare à l'original (score chrF, 0-100) ;
# 2) on vérifie la langue écrite avec GlotLID (détecteur de langue, licence Apache 2.0).
# Résultat : mt/qa/<langue>.json {code, s:{id:[chrF, langue détectée, confiance]}}. Le tri (garder ou repasser en anglais) se fait ensuite.
import json, os, sys, time
import ctranslate2, transformers, fasttext
from huggingface_hub import hf_hub_download
from sacrebleu.metrics import CHRF

MODEL = os.environ.get("MT_MODEL", "madlad-ct2")
tok = transformers.AutoTokenizer.from_pretrained("google/madlad400-3b-mt")
tr = ctranslate2.Translator(MODEL, device="cpu", compute_type="int8", inter_threads=1, intra_threads=os.cpu_count() or 4)
lid = fasttext.load_model(hf_hub_download("cis-lmu/glotlid", "model.bin"))
chrf = CHRF()
src = dict((k, v) for k, v in json.load(open(os.path.join(os.path.dirname(__file__), "src.json"), encoding="utf-8")))

def back(texts):
    res = []
    for i in range(0, len(texts), 16):
        toks = [tok.convert_ids_to_tokens(tok.encode("<2en> " + t)) for t in texts[i:i + 16]]
        for o in tr.translate_batch(toks, beam_size=1, max_decoding_length=400):
            res.append(tok.decode(tok.convert_tokens_to_ids(o.hypotheses[0]), skip_special_tokens=True).strip())
    return res

def run(code):
    p = os.path.join("mt", "out", code + ".json")
    if not os.path.exists(p):
        return
    d = json.load(open(p, encoding="utf-8"))
    keys = list(d.get("s", {}))
    if not keys:
        return
    t0 = time.time()
    outs = back([d["s"][k] for k in keys])
    qa = {}
    for k, en in zip(keys, outs):
        txt = d["s"][k].replace("\n", " ")
        (lab,), (conf,) = lid.predict(txt, k=1)
        qa[k] = [round(chrf.sentence_score(en, [src[k]]).score, 1), lab.replace("__label__", ""), round(float(conf), 3), en[:200]]
    os.makedirs("mt-qa", exist_ok=True)
    json.dump({"code": code, "s": qa}, open(os.path.join("mt-qa", code + ".json"), "w", encoding="utf-8"), ensure_ascii=False)
    print(code, len(qa), "textes contrôlés, %.0f s" % (time.time() - t0), flush=True)

if __name__ == "__main__":
    for spec in sys.argv[1].split(","):
        run(spec.rstrip("+"))

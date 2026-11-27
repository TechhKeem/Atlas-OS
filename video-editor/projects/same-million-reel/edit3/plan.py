"""v3 edit plan: every library clip used once, cut on Hakeem's words. Times resolved from words_out.json."""
import json, os, re
E = os.path.dirname(os.path.abspath(__file__))
D = json.load(open(os.path.join(E, "words_out.json"))); W = D["words"]
def seg(lab): return [w for w in W if w["label"] == lab]
def st(lab): return seg(lab)[0]["start"]
def en(lab): return seg(lab)[-1]["end"]
def wt(lab, text, nth=0):
    return [w["start"] for w in W if w["label"] == lab and re.sub(r"[^\w$]", "", w["text"]).lower() == text.lower()][nth]
END0 = round(en("closer") + 0.25, 2)
TOTAL = round(D["cta_start"] + 6.3 + 2.4, 2)
# picture track: (kind, key, out_start, out_end, media_start, natural_audio_volume)
#   kind: face = A-roll, clip = library clip, anim = own animation, end = end card
PIC = [
    ("face", "aroll", 0.0, wt("james", "he"), None, 0),
    ("clip", "IMG_2942", wt("james", "he"), st("crash"), 4.0, 0),           # at his laptop: "puts all of it into VOO"
    ("anim", "crash", st("crash"), st("selling"), None, 0),                  # own chart: -15 / -10 / -5
    ("clip", "8A2EAFA9", st("selling"), wt("selling", "in"), 15.0, 0),        # laptop/emails: "bills don't stop"
    ("anim", "counter", wt("selling", "in"), st("carol"), None, 0),          # $1,000,000 -> $575,000
    ("clip", "807b8277", st("carol"), st("income"), 3.0, 0),               # family on the walk: "meet Carol"
    ("face", "aroll", st("income"), st("pension"), None, 0),                 # "she buys income first"
    ("anim", "split", st("pension"), wt("life", "every"), None, 0),                   # $1M -> $500K pension + $500K VOO
    ("clip", "IMG_2962", wt("life", "every"), st("less"), 9.0, 0.12),                 # Topgolf: "every year for the rest of her life"
    ("anim", "race", st("less"), wt("year26", "carol"), None, 0),            # James $0 at year 26
    ("clip", "3E093F54", wt("year26", "carol"), st("lesson"), 4.5, 0.12),    # trampoline park with his son
    ("clip", "IMG_6408", st("lesson"), wt("lesson", "when"), 54.0, 0),        # on the Creating Financial Wellness panel
    ("face", "aroll", wt("lesson", "when"), END0, None, 0),                  # lesson + closer to camera
    ("end", "7983", END0, TOTAL, 0.3, 0),                                    # Wealth Summit booth, slow-mo of the wide opening: end card + spoken CTA
]
# face punch-ins (time, scale): cut on phrases, bigger on emphasis words
PUNCH = [(0.0, 1.0), (wt("hook", "the"), 1.08), (wt("hook", "one"), 1.0), (wt("hook", "never"), 1.12), (wt("hook", "heres"), 1.04),
         (wt("james", "meet"), 1.14), (st("income"), 1.08), (wt("income", "income"), 1.2), (wt("lesson", "when"), 1.0),
         (wt("lesson", "a", 0), 1.12), (wt("lesson", "even"), 1.2), (st("closer"), 1.02), (wt("closer", "carol"), 1.18)]

# caption lift per insert (px, negative = higher) where the default band would cover a person
CAP_LIFT = {"807b8277": -240}

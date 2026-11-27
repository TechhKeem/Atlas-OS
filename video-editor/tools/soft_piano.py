"""Synthesize an original, royalty-free soft piano bed (numpy only).

Usage: python soft_piano.py <out.wav> <duration_s> [bpm]
Produces a dry mono-ish stereo WAV; add reverb/lowpass with ffmpeg afterwards.
"""
import sys, wave
import numpy as np

SR = 44100
out, dur = sys.argv[1], float(sys.argv[2])
bpm = float(sys.argv[3]) if len(sys.argv) > 3 else 76.0
beat = 60.0 / bpm
N = int(SR * (dur + 4))
L = np.zeros(N); R = np.zeros(N)
rng = np.random.default_rng(7)  # seeded: identical output every run


def hz(midi):
    return 440.0 * 2 ** ((midi - 69) / 12)


def piano(midi, t0, vel=0.5, length=3.5, pan=0.0):
    f = hz(midi)
    n = int(length * SR)
    t = np.arange(n) / SR
    tone = np.zeros(n)
    B = 0.0004  # slight inharmonicity, like real strings
    for k in range(1, 9):
        fk = f * k * np.sqrt(1 + B * k * k)
        if fk > 9000:
            break
        amp = (1.0 / k ** 1.6) * (1.0 if k == 1 else 0.8)
        decay = 1.2 + 0.9 * k  # upper partials die faster -> soft felt tone
        tone += amp * np.sin(2 * np.pi * fk * t + rng.uniform(0, 6.28)) * np.exp(-decay * t / (length / 3))
    att = np.minimum(1, t / 0.006)
    rel = np.clip((length - t) / 0.4, 0, 1)
    tone *= att * rel * vel * (220 / max(f, 110)) ** 0.25
    i0 = int(t0 * SR)
    seg = slice(i0, min(N, i0 + n))
    m = seg.stop - seg.start
    L[seg] += tone[:m] * (1 - pan) * 0.5
    R[seg] += tone[:m] * (1 + pan) * 0.5


def pad(midis, t0, length, vel=0.05):
    n = int(length * SR)
    t = np.arange(n) / SR
    env = np.minimum(1, t / 1.5) * np.clip((length - t) / 1.5, 0, 1)
    s = sum(np.sin(2 * np.pi * hz(m) * t) + 0.3 * np.sin(2 * np.pi * hz(m) * 2.003 * t) for m in midis)
    s *= env * vel / len(midis)
    i0 = int(t0 * SR)
    seg = slice(i0, min(N, i0 + n)); m = seg.stop - seg.start
    L[seg] += s[:m]; R[seg] += s[:m]


# Cmaj9 - Am7 - Fmaj7 - Gsus(add9): bass, chord tones for arpeggio, melody note
prog = [
    (36, [60, 64, 67, 71, 74], 76),
    (45, [57, 60, 64, 67, 72], 72),
    (41, [57, 60, 64, 65, 69], 69),
    (43, [55, 60, 62, 67, 74], 74),
]
bar = 4 * beat
arp = [0, 2, 1, 3, 4, 3, 2, 1]  # gentle up/down figure in eighths
t = 0.0; b = 0
while t < dur:
    bass, tones, mel = prog[b % 4]
    piano(bass, t, 0.42, 4.5, -0.2)
    piano(bass + 12, t + 0.02, 0.18, 4.0, -0.1)
    pad([m - 12 for m in tones[:3]], t, bar + 1.0)
    for i, idx in enumerate(arp):
        if b == 0 and i < 2:
            continue  # breathe in at the very start
        v = 0.17 + 0.05 * (i % 2 == 0) + rng.uniform(-0.02, 0.02)
        piano(tones[idx], t + i * beat / 2 + rng.uniform(0, 0.012), v, 3.0, 0.15 if idx % 2 else -0.05)
    if b >= 2 and b % 2 == 0:  # sparse top melody every other bar
        piano(mel + 12, t + beat * 0.0, 0.16, 4.0, 0.25)
        piano(mel + 12 - (2 if b % 4 == 0 else 3), t + beat * 2.5, 0.12, 3.5, 0.25)
    t += bar; b += 1

# Final resolving chord
for m in (36, 48, 60, 64, 67, 71, 76):
    piano(m, dur - 0.05, 0.25, 4.0, 0.0)

st = np.stack([L, R], 1)[: int(SR * (dur + 3.5))]
st /= np.max(np.abs(st)) + 1e-9
st *= 0.7
with wave.open(out, "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((st * 32767).astype(np.int16).tobytes())
print("wrote", out, round(len(st) / SR, 2), "s")

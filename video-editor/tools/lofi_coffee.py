"""Synthesize an original, royalty-free soft 'black coffee' lo-fi jazz bed (numpy only).

Rhodes-style electric piano on a ii-V-I-VI progression, brushed swung drums,
soft upright bass, vinyl crackle. Seeded: identical output every run.

Usage: python lofi_coffee.py <out.wav> <duration_s> [bpm]
"""
import sys, wave
import numpy as np

SR = 44100
out, dur = sys.argv[1], float(sys.argv[2])
bpm = float(sys.argv[3]) if len(sys.argv) > 3 else 78.0
beat = 60.0 / bpm
N = int(SR * (dur + 4))
L = np.zeros(N); R = np.zeros(N)
rng = np.random.default_rng(11)


def hz(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def add(sig, t0, pan=0.0):
    i0 = int(t0 * SR)
    if i0 >= N:
        return
    m = min(len(sig), N - i0)
    L[i0:i0 + m] += sig[:m] * (1 - pan) * 0.5
    R[i0:i0 + m] += sig[:m] * (1 + pan) * 0.5


def rhodes(midi, t0, vel, length, pan=0.0):
    f = hz(midi); n = int(length * SR); t = np.arange(n) / SR
    env = np.exp(-t * 1.3) * np.minimum(1, t / 0.004)
    bell = np.exp(-t * 9.0)
    mod = np.sin(2 * np.pi * f * 14 * t) * 0.35 * bell        # FM tine "bark"
    tone = np.sin(2 * np.pi * f * t + mod) + 0.25 * np.sin(2 * np.pi * f * 2 * t) * np.exp(-t * 3)
    trem = 1 + 0.12 * np.sin(2 * np.pi * 4.2 * t)               # soft tremolo
    rel = np.clip((length - t) / 0.25, 0, 1)
    add(tone * env * trem * rel * vel, t0, pan)


def bass(midi, t0, length, vel=0.26):
    f = hz(midi); n = int(length * SR); t = np.arange(n) / SR
    env = np.minimum(1, t / 0.012) * np.exp(-t * 2.2) * np.clip((length - t) / 0.08, 0, 1)
    tone = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * 2 * f * t) + 0.1 * np.sin(2 * np.pi * 3 * f * t)
    add(tone * env * vel, t0, -0.05)


def lp_noise(n, k):
    x = rng.standard_normal(n)
    y = np.convolve(x, np.ones(k) / k, mode="same")
    return y / (np.max(np.abs(y)) + 1e-9)


def kick(t0, vel=0.55):
    n = int(0.35 * SR); t = np.arange(n) / SR
    f = 50 + 70 * np.exp(-t * 30)
    add(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9) * vel, t0)


def brush(t0, vel=0.18, length=0.32):
    n = int(length * SR); t = np.arange(n) / SR
    s = lp_noise(n, 5) * np.exp(-t * 11) * np.minimum(1, t / 0.01)
    add(s * vel, t0, 0.1)


def hat(t0, vel=0.05):
    n = int(0.06 * SR); t = np.arange(n) / SR
    s = lp_noise(n, 2) * np.exp(-t * 60)
    add(s * vel, t0, 0.3)


# Dm9 - G13 - Cmaj9 - A7b13  (voicings in the warm middle register)
prog = [
    (38, [53, 57, 60, 64]),
    (43, [53, 57, 59, 64]),
    (36, [52, 55, 59, 62]),
    (33, [55, 58, 61, 65]),
]
walk = [0, 7, 12, 10]  # bass walk offsets per beat
swing = beat * 0.62    # swung 8th offset
bar = 4 * beat
t = 0.0; b = 0
while t < dur:
    root, chord = prog[b % 4]
    # comping: chord on 1, a softer stab on the "and" of 2
    for j, m in enumerate(chord):
        rhodes(m, t + j * 0.012, 0.30, bar * 0.9, (-0.25 + 0.17 * j))
    for j, m in enumerate(chord[1:]):
        rhodes(m + 12, t + beat + swing + j * 0.01, 0.12, beat * 1.2, 0.2)
    if b % 2 == 1:  # a little melodic answer every other bar
        rhodes(chord[-1] + 12, t + beat * 3, 0.16, beat * 1.5, 0.3)
        rhodes(chord[-2] + 12, t + beat * 3 + swing, 0.12, beat * 1.2, 0.3)
    if b >= 1:  # drums come in after the first bar
        for k in range(4):
            bt = t + k * beat
            bass(root + walk[k], bt, beat * 0.95)
            hat(bt, 0.035); hat(bt + swing, 0.022)
            if k in (1, 3):
                brush(bt, 0.07)
        kick(t, 0.22); kick(t + 2 * beat + swing, 0.16)
    else:
        bass(root, t, bar * 0.9, 0.24)
    t += bar; b += 1

# final chord
for j, m in enumerate([38, 53, 57, 60, 64, 69]):
    rhodes(m if m > 40 else m + 12, dur + j * 0.02, 0.15, 3.5, -0.2 + 0.08 * j)

# vinyl: soft hiss + sparse crackle
hiss = lp_noise(N, 8) * 0.003
crk = np.zeros(N); idx = rng.integers(0, N, int(N / SR * 9))
crk[idx] = rng.uniform(0.02, 0.06, len(idx)) * rng.choice([-1, 1], len(idx))
L += hiss + crk; R += hiss + np.roll(crk, 7)

st = np.stack([L, R], 1)[: int(SR * (dur + 3.5))]
st /= np.max(np.abs(st)) + 1e-9
st *= 0.7
with wave.open(out, "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((st * 32767).astype(np.int16).tobytes())
print("wrote", out, round(len(st) / SR, 2), "s")

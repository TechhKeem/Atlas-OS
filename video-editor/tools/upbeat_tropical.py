"""Synthesize an original, royalty-free upbeat tropical-house bed (numpy only).

Marimba-style plucks on I-V-vi-IV, four-on-the-floor soft kick, claps on 2 & 4,
offbeat hats, pumping sub bass. Seeded: identical output every run.

Usage: python upbeat_tropical.py <out.wav> <duration_s> [bpm]
"""
import sys, wave
import numpy as np

SR = 44100
out, dur = sys.argv[1], float(sys.argv[2])
bpm = float(sys.argv[3]) if len(sys.argv) > 3 else 112.0
beat = 60.0 / bpm
N = int(SR * (dur + 3))
L = np.zeros(N); R = np.zeros(N)
rng = np.random.default_rng(23)


def hz(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def add(sig, t0, pan=0.0, gain=1.0):
    i0 = int(t0 * SR)
    if i0 >= N or i0 < 0:
        return
    m = min(len(sig), N - i0)
    L[i0:i0 + m] += sig[:m] * (1 - pan) * 0.5 * gain
    R[i0:i0 + m] += sig[:m] * (1 + pan) * 0.5 * gain


def marimba(m, t0, vel, pan=0.0):
    f = hz(m); n = int(0.9 * SR); t = np.arange(n) / SR
    s = (np.sin(2 * np.pi * f * t) * np.exp(-t * 7)
         + 0.45 * np.sin(2 * np.pi * f * 4.0 * t) * np.exp(-t * 22)
         + 0.2 * np.sin(2 * np.pi * f * 9.2 * t) * np.exp(-t * 40))
    add(s * np.minimum(1, t / 0.002) * vel, t0, pan)


def pad(ms, t0, length, vel):
    n = int(length * SR); t = np.arange(n) / SR
    env = np.minimum(1, t / 0.08) * np.clip((length - t) / 0.2, 0, 1)
    s = sum(np.sin(2 * np.pi * hz(m) * t + 0.3 * np.sin(2 * np.pi * 5 * t)) for m in ms) / len(ms)
    add(s * env * vel, t0)


def kick(t0, vel=0.7):
    n = int(0.3 * SR); t = np.arange(n) / SR
    f = 48 + 90 * np.exp(-t * 35)
    add(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 10) * vel, t0)


def noise_hit(t0, length, decay, vel, k, pan=0.0):
    n = int(length * SR); t = np.arange(n) / SR
    x = rng.standard_normal(n)
    if k > 1:
        x = x - np.convolve(x, np.ones(k) / k, mode="same")  # high-pass-ish
    add(x * np.exp(-t * decay) * vel, t0, pan)


def clap(t0, vel=0.12):
    for d in (0.0, 0.011, 0.023):
        noise_hit(t0 + d, 0.18, 26, vel, 3, 0.05)


def bass(m, t0, length, vel=0.24):
    f = hz(m); n = int(length * SR); t = np.arange(n) / SR
    env = np.minimum(1, t / 0.01) * np.clip((length - t) / 0.03, 0, 1) * (0.6 + 0.4 * np.exp(-t * 6))
    add((np.sin(2 * np.pi * f * t) + 0.25 * np.sin(2 * np.pi * 2 * f * t)) * env * vel, t0)


# F - C - Dm - Bb (I-V-vi-IV), bright voicings
prog = [(41, [65, 69, 72, 77]), (36, [64, 67, 72, 76]), (38, [65, 69, 74, 77]), (34, [65, 70, 74, 77])]
pattern = [0, 2, 1, 3, 2, 1, 3, 2]  # eighth-note marimba figure
bar = 4 * beat
t = 0.0; b = 0
while t < dur:
    root, ch = prog[b % 4]
    intro = b == 0
    pad(ch, t, bar, 0.08)
    for i, idx in enumerate(pattern):
        swing = 0.0 if i % 2 == 0 else beat * 0.04
        marimba(ch[idx] + (12 if i in (3, 6) else 0), t + i * beat / 2 + swing, 0.36 if i % 2 == 0 else 0.26, -0.3 + 0.2 * (i % 4))
    if not intro:
        for k in range(4):
            bt = t + k * beat
            kick(bt, 0.42)
            noise_hit(bt + beat / 2, 0.09, 45, 0.07, 2, 0.35)       # offbeat hat
            bass(root + 12, bt + beat / 2, beat * 0.45)               # pumping offbeat bass
            if k in (1, 3):
                clap(bt)
        if b % 4 == 3:  # little fill
            for j in range(4):
                noise_hit(t + 3 * beat + j * beat / 4, 0.06, 60, 0.05, 2, -0.3)
    t += bar; b += 1

for m in (41, 53, 65, 69, 72, 77):  # final hit
    marimba(m, dur, 0.22)
kick(dur, 0.6)

st = np.stack([L, R], 1)[: int(SR * (dur + 2.5))]
st /= np.max(np.abs(st)) + 1e-9
st *= 0.7
with wave.open(out, "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((st * 32767).astype(np.int16).tobytes())
print("wrote", out, round(len(st) / SR, 2), "s")

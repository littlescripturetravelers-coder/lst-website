#!/usr/bin/env python3
"""A LONG LULLABY, SUNG IN TWO HALVES AND JOINED SO NO ONE CAN HEAR THE JOIN.

Levi, 2 Oct 2026: "I want the music to flow and sound just like the first one I
had uploaded with the finetune of Lullaby LST ... lines up perfectly to put a
child to sleep."

The first recording (audio/hush-little-traveler-short.mp3) sings a line about
every five and a half seconds and breathes for three or four seconds between
verses. A Little Travelers' Lullaby has 132 lines; at that pace it is about
fourteen minutes, and ElevenLabs sings at most ten minutes at a time. Squeezed
into ten minutes, every line came a second and a half early and there was no
breath between verses: it was rushed. So the song is sung in two halves, each
at the first recording's pace, and joined here:

  * every pair of takes (first half x second half) is measured where they will
    meet - the key (the twelve notes' share of the sound), the brightness and
    the loudness - and the pair that matches best is kept;
  * the first half is cut a few seconds after its last sung word, the second
    half begins a few seconds before its first, and the two overlap in that
    instrumental breath with an equal-power crossfade, so the join falls where
    a verse would rest anyway, never on a word;
  * the second half is brought to the first half's loudness.

Nothing here spends credit: it uses ffmpeg (FFMPEG, else `ffmpeg` on the path)
and numpy only.
"""
import os
import shutil
import subprocess

import numpy as np

SR = 22050
NOTES = "C C# D D# E F F# G G# A A# B".split()


def ffmpeg():
    exe = os.environ.get("FFMPEG") or shutil.which("ffmpeg")
    if not exe:
        try:
            import imageio_ffmpeg
            exe = imageio_ffmpeg.get_ffmpeg_exe()
        except Exception:
            exe = "ffmpeg"
    return exe


def decode(path, start=None, dur=None):
    cmd = [ffmpeg(), "-v", "error"]
    if start is not None:
        cmd += ["-ss", "%.3f" % max(0.0, start)]
    if dur is not None:
        cmd += ["-t", "%.3f" % dur]
    cmd += ["-i", path, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"]
    raw = subprocess.run(cmd, capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32)


def length(path):
    return len(decode(path)) / float(SR)


def features(y):
    """Brightness (spectral centroid, Hz), loudness (RMS dB) and the share of each
    of the twelve notes in the sound (a chroma vector), over a stretch of audio."""
    if len(y) < SR:
        return {"centroid": 0.0, "db": -90.0, "chroma": np.zeros(12)}
    n = 4096
    hop = 2048
    win = np.hanning(n)
    freqs = np.fft.rfftfreq(n, 1.0 / SR)
    # the note each frequency bin belongs to (55 Hz - 5 kHz carries the tune)
    use = (freqs > 55) & (freqs < 5000)
    pc = np.zeros(len(freqs), dtype=int)
    pc[use] = (np.round(12 * np.log2(freqs[use] / 440.0)) + 9).astype(int) % 12
    chroma = np.zeros(12)
    cen_num = 0.0
    cen_den = 0.0
    for i in range(0, len(y) - n, hop):
        mag = np.abs(np.fft.rfft(y[i:i + n] * win))
        cen_num += float((mag * freqs).sum())
        cen_den += float(mag.sum())
        p = mag[use] ** 2
        chroma += np.bincount(pc[use], weights=p, minlength=12)
    rms = float(np.sqrt(np.mean(y.astype(np.float64) ** 2)))
    s = chroma.sum()
    return {"centroid": cen_num / cen_den if cen_den else 0.0,
            "db": 20 * np.log10(rms + 1e-9),
            "chroma": chroma / s if s else chroma}


KRUMHANSL_MAJ = np.array([6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88])
KRUMHANSL_MIN = np.array([6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17])


def key_of(chroma):
    best = (-2.0, "")
    for k in range(12):
        for prof, name in ((KRUMHANSL_MAJ, "major"), (KRUMHANSL_MIN, "minor")):
            r = float(np.corrcoef(np.roll(prof, k), chroma)[0, 1])
            if r > best[0]:
                best = (r, NOTES[k] + " " + name)
    return best[1]


def seam(a_path, a_last, b_path, b_first, span=40.0):
    """How well the end of the first half meets the start of the second.
    a_last: the second the first half's last word ends; b_first: the second the
    second half's first word begins. Returns the measurements and a penalty
    (0 = a perfect match; a different key costs the most)."""
    fa = features(decode(a_path, max(0.0, a_last - span), span))
    fb = features(decode(b_path, max(0.0, b_first), span))
    corr = float(np.corrcoef(fa["chroma"], fb["chroma"])[0, 1]) if fa["chroma"].any() and fb["chroma"].any() else 0.0
    ratio = (fb["centroid"] / fa["centroid"]) if fa["centroid"] and fb["centroid"] else 1.0
    level = fb["db"] - fa["db"]
    ka, kb = key_of(fa["chroma"]), key_of(fb["chroma"])
    penalty = (1.0 - corr) * 40.0 + abs(np.log2(ratio)) * 30.0 + abs(level) * 0.5 + (8.0 if ka != kb else 0.0)
    return {"chroma_match": round(corr, 3), "brightness_ratio": round(ratio, 3), "level_step_db": round(float(level), 2),
            "key_a": ka, "key_b": kb, "penalty": round(float(penalty), 2)}


def fade_start(path, after, floor_db=9.0, win=0.25):
    """Where a take begins to fade away after its last word (ElevenLabs ends a song
    with a fade even when asked not to). The point where the sound first drops more
    than floor_db below the singing before it; the end of the file if it never does."""
    y = decode(path)
    n = int(win * SR)
    ref = y[max(0, int((after - 20) * SR)):int(after * SR)]
    if len(ref) < n:
        return len(y) / float(SR)
    ref_db = 20 * np.log10(np.sqrt(np.mean(ref.astype(np.float64) ** 2)) + 1e-9)
    i = int(after * SR)
    while i + n <= len(y):
        db = 20 * np.log10(np.sqrt(np.mean(y[i:i + n].astype(np.float64) ** 2)) + 1e-9)
        if db < ref_db - floor_db:
            return i / float(SR)
        i += n
    return len(y) / float(SR)


def join(a_path, a_last, b_path, b_first, out_path, tail=3.0, lead=3.0, fade=2.0, bitrate="192k"):
    """Join the halves in the breath between them. Returns where the second half
    begins in the joined song (seconds), so its words' times can be shifted."""
    a_len = min(length(a_path), fade_start(a_path, a_last))
    ta = min(a_len, a_last + tail)                  # the first half ends here, before any fade
    tb = max(0.0, b_first - lead)                   # the second half starts here
    f = max(0.3, min(fade, ta - a_last - 0.3, b_first - tb - 0.3, 6.0))
    # the second half at the first half's loudness (measured on the singing near the join)
    fa = features(decode(a_path, max(0.0, a_last - 60), 60))
    fb = features(decode(b_path, b_first, 60))
    gain = max(-6.0, min(6.0, fa["db"] - fb["db"]))
    fc = ("[0:a]atrim=0:%.3f,asetpts=PTS-STARTPTS[a];"
          "[1:a]atrim=%.3f,asetpts=PTS-STARTPTS,volume=%.2fdB[b];"
          "[a][b]acrossfade=d=%.3f:c1=qsin:c2=qsin[out]") % (ta, tb, gain, f)
    subprocess.run([ffmpeg(), "-y", "-v", "error", "-i", a_path, "-i", b_path, "-filter_complex", fc,
                    "-map", "[out]", "-ar", "44100", "-b:a", bitrate, out_path], check=True)
    return {"b_offset": round(ta - f - tb, 3), "cut_a": round(ta, 3), "start_b": round(tb, 3),
            "fade": round(float(f), 3), "gain_b_db": round(float(gain), 2), "gap_s": round(float(ta - a_last + b_first - tb - f), 2)}


def words_span(segments):
    """The first sung word's start and the last one's end, from a transcription."""
    segs = [s for s in segments if s.get("end", 0) > s.get("start", 0) and str(s.get("text", "")).strip()]
    if not segs:
        return None, None
    return segs[0]["start"], segs[-1]["end"]


def bands():
    """Third-octave bands from 40 Hz to 10 kHz."""
    out, f = [], 40.0
    while f < 10000:
        out.append(f)
        f *= 2 ** (1 / 3.0)
    return out


def ltas(y, n=8192):
    """The long-term average spectrum in third-octave bands (dB), over the sound
    louder than the quiet between phrases."""
    hop = n // 2
    win = np.hanning(n)
    freqs = np.fft.rfftfreq(n, 1.0 / SR)
    acc = np.zeros(len(freqs))
    frames = []
    for i in range(0, len(y) - n, hop):
        seg = y[i:i + n]
        frames.append((float(np.mean(seg.astype(np.float64) ** 2)), i))
    if not frames:
        return None
    cut = np.percentile([f[0] for f in frames], 30)
    k = 0
    for e, i in frames:
        if e >= cut:
            acc += np.abs(np.fft.rfft(y[i:i + n] * win)) ** 2
            k += 1
    acc /= max(1, k)
    out = []
    for c in bands():
        lo, hi = c / 2 ** (1 / 6.0), c * 2 ** (1 / 6.0)
        m = (freqs >= lo) & (freqs < hi)
        out.append(10 * np.log10(acc[m].mean() + 1e-12) if m.any() else -120.0)
    return np.array(out)


def tone_distance(path, ref_path):
    """How far a take's tone is from the reference recording's: the average gap
    between their spectra (dB, third-octave bands 60 Hz - 8 kHz, level-matched at
    1 kHz). 0 is the same tone; 3 is close; 6 or more sounds plainly different."""
    a = ltas(decode(path))
    r = ltas(decode(ref_path))
    if a is None or r is None:
        return 99.0
    d = r - a
    d -= d[np.argmin([abs(c - 1000) for c in bands()])]
    use = [i for i, c in enumerate(bands()) if 60 <= c <= 8000]
    return round(float(np.mean(np.abs(d[use]))), 2)


def match_tone(path, ref_path, out_path, max_db=4.0, bitrate="192k"):
    """Give a take the warm, soft tone of the reference recording: the difference
    between their average spectra, smoothed and held within max_db either way, is
    applied as one gentle equaliser curve, and the level is brought to the
    reference's. The tune, the words and their timing are untouched."""
    a = ltas(decode(path))
    r = ltas(decode(ref_path))
    if a is None or r is None:
        shutil.copy(path, out_path)
        return {"applied": False}
    d = r - a
    d -= d[np.argmin([abs(c - 1000) for c in bands()])]     # 1 kHz is the anchor: the voice stays as loud
    d = np.convolve(np.pad(d, 1, mode="edge"), np.ones(3) / 3.0, mode="valid")
    d = np.clip(d, -max_db, max_db)
    entries = ";".join("entry(%.1f,%.2f)" % (c, g) for c, g in zip(bands(), d))
    ya = decode(path)
    yr = decode(ref_path)
    lev = lambda y: 20 * np.log10(np.sqrt(np.mean(y.astype(np.float64) ** 2)) + 1e-9)
    tmp = out_path + ".eq.wav"
    subprocess.run([ffmpeg(), "-y", "-v", "error", "-i", path, "-af", "firequalizer=gain_entry='%s'" % entries,
                    "-ar", "44100", tmp], check=True)
    gain = max(-8.0, min(8.0, lev(yr) - lev(decode(tmp))))
    subprocess.run([ffmpeg(), "-y", "-v", "error", "-i", tmp, "-af", "volume=%.2fdB,alimiter=limit=0.95:level=disabled" % gain,
                    "-ar", "44100", "-b:a", bitrate, out_path], check=True)
    os.remove(tmp)
    return {"applied": True, "curve_db": [round(float(x), 1) for x in d], "gain_db": round(float(gain), 2),
            "brightness_before": round(features(ya)["centroid"]), "brightness_after": round(features(decode(out_path))["centroid"]),
            "brightness_reference": round(features(yr)["centroid"])}


if __name__ == "__main__":
    import sys
    for p in sys.argv[1:]:
        y = decode(p)
        f = features(y)
        print(p, "%.0f s" % (len(y) / SR), "key", key_of(f["chroma"]), "brightness %.0f Hz" % f["centroid"], "level %.1f dB" % f["db"])

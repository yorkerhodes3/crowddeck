<!-- SPDX-License-Identifier: Apache-2.0 -->

# SPIKE-2 findings — audio backend measurement

**Date:** 2026-08-27 · **Status:** WASAPI measured, ASIO/CoreAudio/ALSA outstanding

## Verdict

**The §8.1 audio-callback budget is achievable on commodity hardware.** WASAPI shared
mode at 128 frames delivered a **p99 callback interval of 3.667 ms** against a 10 ms
budget, on an ordinary laptop, with 0.14% late callbacks.

That matters because §8.1 was previously an unvalidated assumption and the largest
open technical risk in the plan. It is now a measured number on at least one
platform.

**Recommended for Windows: miniaudio + WASAPI shared, 128 frames.**

## Measured results

Intel i7-1065G7, 4 cores, 31.6 GB, Windows 11. Realtek HD Audio (device 0).
60-second runs at 48 kHz, 2 periods.

| Configuration | p50 | p95 | **p99** | max | Late callbacks | Verdict |
|---|---|---|---|---|---|---|
| **WASAPI shared, 128** | 2.861 | 3.431 | **3.667** | 7.194 | 32 (0.14%) | ✅ **PASS** |
| WASAPI exclusive, 128 | 1.088 | 6.943 | 7.166 | 21.831 | 3843 (17.1%) | ❌ FAIL |
| WASAPI exclusive, 64 | 0.471 | 3.972 | 4.211 | 7.462 | 7524 (16.7%) | ❌ FAIL |

*Callback interval in milliseconds. Nominal period at 128 frames / 48 kHz is 2.667 ms.*

## Three findings worth carrying forward

### 1. Exclusive mode was *worse* than shared, which inverts the usual advice

Every piece of received wisdom says WASAPI exclusive is the low-latency path. Here it
was decisively worse: 17% late callbacks against 0.14%, and a worst case of 21.8 ms
against 7.2 ms.

The likely cause is that this is a laptop codec with aggressive power management,
where exclusive mode loses the OS mixer's smoothing without gaining a genuinely
low-latency hardware path. **This is one machine and should not be generalised** — but
it is a concrete warning against hard-coding exclusive mode on the assumption that it
is always better. The engine should make share mode configurable and default to
shared until a given deployment is measured.

### 2. The default output device was the wrong thing to measure

The first run measured a **Jabra USB speakerphone**, because that was the Windows
default. A conference speakerphone carries a large hardware buffer by design, so those
numbers described that device rather than the audio backend — p99 of 10.9 ms and
~6000 late callbacks, in every configuration, near-identically.

The tell was in the data: `p50 interval 0.000 ms`. Half the callbacks arriving in the
same instant as the previous one is burst delivery, not a stream. Had that been read
as a backend result, the honest conclusion "sub-10 ms is achievable" would have been
recorded as "no configuration met the budget" — and the §8.1 budgets might have been
loosened to accommodate a speakerphone.

The probe now has `--list` and `--device` and the README says plainly that the default
device is usually not the one you want.

### 3. The xrun proxy was wrong, and measurement is what corrected it

miniaudio does not expose true underrun counts portably, so the probe flags any gap
over twice the nominal period. The analysis originally failed a run on **any** such
event, on the reasoning that every xrun is audible.

Real data showed that is too strict. With two periods of buffering there is about one
period of slack, so a single late callback is not automatically a glitch. The healthy
configuration produced 32 late callbacks in 22,479 while sounding continuous; the
unhealthy ones produced thousands. The verdict now judges the **rate**, with the 1%
threshold chosen because the measured populations (0.14% and 17%) sit far apart on
either side of it — not because 1% is a pleasing number.

The proxy is still a proxy. It measures "the callback was late", not "the audio
glitched". `ENG-7` should surface real xruns from the engine as CDEP events per
REQ-NFR-2, and this heuristic should be retired then.

## What was not measured

| Path | Blocker |
|---|---|
| **ASIO** | No ASIO interface on this machine. miniaudio ships no ASIO backend (SDK redistribution terms), so this needs PortAudio built with `PA_USE_ASIO` plus the Steinberg SDK, or measuring inside the Mixxx build during `ENG-1`. ASIO4ALL is not a substitute — it wraps the ordinary driver stack, so its numbers describe the wrapper. |
| **CoreAudio** | Needs a Mac. |
| **ALSA / JACK** | Needs real Linux. CI runners are unsuitable: no audio device, virtualised clocks. |
| **PortAudio comparison** | Buildable here but not yet run; miniaudio alone answered the load-bearing question, which was whether the budget is reachable at all. |

## How this was built

MSVC and the Windows SDK both need administrator rights, which were not available.
The probe was instead compiled with **GCC 16.2 from w64devkit**, a portable toolchain
that ships mingw-w64's Windows headers — including `audioclient.h` and `mmdeviceapi.h`
— and needs no installer.

**Does the compiler change the result?** For this question, very little. Callback
timing is dominated by the OS audio stack, the driver and the scheduler; the probe's
own code is a clock read and an array write. A differently-optimised build would not
move a 10 ms budget. It is worth re-checking under MSVC before `ENG-1` finalises the
backend choice, but the finding — that the budget is reachable, and that shared mode
beat exclusive here — does not hinge on the compiler.

## Reproducing

```powershell
cd spike/spike-2
$gcc = "$env:LOCALAPPDATA\Programs\w64devkit\bin"
& "$gcc\gcc.exe" -O2 -DMA_NO_DECODING -DMA_NO_ENCODING -Ivendor src/probe.c `
    -o runs/probe_miniaudio.exe -lole32 -luuid -lwinmm -lksuser -lm

./runs/probe_miniaudio.exe --list
./runs/probe_miniaudio.exe --api wasapi_shared --device 0 --frames 128 --seconds 60 --out runs/shared-128.csv
node report.mjs runs/*.csv
```

Raw CSVs from these runs are in `runs/` so the numbers above can be re-derived rather
than taken on trust.

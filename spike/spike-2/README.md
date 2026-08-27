<!-- SPDX-License-Identifier: Apache-2.0 -->

# SPIKE-2 — audio backend selection

Measures **miniaudio vs PortAudio** for callback stability at 64–128 frame buffers,
so the backend is chosen on evidence before `ENG-*` work starts. Satisfies the
measurement half of `REQ-NFR-1` and `REQ-NFR-2`, and produces the first real numbers
for [`SPECIFICATION.md`](../../SPECIFICATION.md) §8.1.

## Status

| Half | State |
|---|---|
| **Analysis** (`analyse.mjs`, `report.mjs`) | ✅ Written and tested — 18 tests, runs today with no toolchain |
| **Measurement** (`src/probe.c`, `CMakeLists.txt`) | ⏳ Written, needs MSVC + CMake to compile |

The analysis half is deliberately finished first. The statistics are where a spike
quietly goes wrong — a p99 computed with an off-by-one rank produces a number that
looks entirely reasonable and picks the wrong backend — and synthetic data with a
known answer catches that in a way real hardware never could, because with real data
there is nothing to check the answer against.

## What you need

| | Why | Cost |
|---|---|---|
| **CMake** ≥ 3.16 | Mixxx and this probe both use it | Free, ~100 MB |
| **MSVC Build Tools** | The compiler everything on Windows assumes | Free, ~3 GB |
| An **ASIO interface** | The ASIO path only | ~£100–200 |

WASAPI shared *and* exclusive need no extra hardware — any machine with a sound
device can run those today. macOS/CoreAudio and Linux/ALSA need those platforms;
CI runners are unsuitable because they have no audio device and virtualised clocks.

```powershell
winget install Kitware.CMake
winget install Microsoft.VisualStudio.2022.BuildTools --override `
  "--quiet --add Microsoft.VisualStudio.Workload.VCTools --includeRecommended"
```

## Running it

```powershell
cd spike/spike-2
cmake -B build -S .
cmake --build build --config Release

# The matrix SPIKE-2 asks for
$env:P = "build/Release/probe_miniaudio.exe"
& $env:P --api wasapi        --frames 64  --seconds 120 --out runs/excl-64.csv
& $env:P --api wasapi        --frames 128 --seconds 120 --out runs/excl-128.csv
& $env:P --api wasapi_shared --frames 128 --seconds 120 --out runs/shared-128.csv

node report.mjs runs/*.csv
```

Add `-DSPIKE2_WITH_PORTAUDIO=ON` to build the PortAudio probe as well. It's off by
default because it's a much heavier configure step and miniaudio alone answers most
of the question.

## How the measurement is kept honest

**The callback does no work.** `REQ-NFR-1` forbids allocation, locks, logging and I/O
on the audio thread, and here that isn't only a rule to obey — it's what makes the
measurement valid. A probe that calls `printf()` inside the callback measures
`printf()`: the stdio lock and write syscall swamp everything else and every backend
looks identically terrible. The callback reads a clock and writes to a preallocated
array. Nothing else. All output happens after the stream stops.

**The array never grows.** It's sized for the whole run upfront; if it fills, the
callback stops recording rather than reallocating — because a `realloc` on the audio
thread is exactly the pathology being measured for.

**Silence is written deliberately.** We're measuring the transport, not a
synthesiser. Generating audio would add per-callback work that varies between runs.

**Tails, not averages.** A backend that averages 5 ms and stalls for 40 ms once a
second glitches audibly every second, and the mean hides that completely. Ranking is
on p99 and maximum; any xrun disqualifies a configuration outright regardless of how
good its percentiles look.

**Warm-up is discarded, visibly.** The first callbacks after stream start are
routinely late while buffers prime. They're excluded from steady-state figures — but
the discarded count is printed, because a discard nobody can see is a thumb on the
scale.

**"Too close to call" is a permitted answer.** When two backends differ by less than
run-to-run noise, `compare()` says so instead of naming a winner. Picking a
multi-year architectural dependency on a coin flip dressed up as a number would be
worse than admitting the measurement didn't separate them.

## A note on ASIO

miniaudio doesn't ship an ASIO backend — the ASIO SDK's licence prevents
redistribution, which is why `--api asio` maps to `ma_backend_custom`. Testing that
path means either PortAudio built with `PA_USE_ASIO` and the SDK obtained separately
from Steinberg, or measuring ASIO in the Mixxx build during `ENG-1` instead.

**ASIO4ALL is not a substitute.** It's a wrapper over the ordinary Windows driver
stack, so any latency figure it produces describes the wrapper rather than a real
ASIO path, and would be misleading rather than merely imprecise.

## Interpreting a failure

If nothing passes, suspect the machine before the backends. Power management alone
will produce this result on an otherwise capable laptop. Check that it's on mains
power, that the power plan isn't throttling, and that nothing else is holding an
audio device open — then re-run.

---
description: How to verify work in this repository — what counts as evidence, and the failure modes that have repeatedly slipped past tests here.
applyTo: '**'
---

# Verifying work in CrowdDeck

This repository has zero runtime dependencies and a strong bias toward *measuring*
rather than asserting. That is not a style preference: almost every serious bug
found here was invisible to reading and to unit tests, and would otherwise have
been found on stage. These are the patterns that keep catching them.

## The recurring lesson: deleting the guard is the only way to know the test tests it

Found this way at least ten times now — back-pressure, licence-lint import forms,
a stale CI subset, a content-guard matching `//` inside `https://`, lookalike
hosts, chunk reassembly order, a `REQ-MIDI-9` override, platter rotation, and the
stereo splice test below.

**Before trusting a new test, break the thing it guards and watch it fail.**

Worked example. A test checked that stereo channels are spliced at the same point
by comparing the inter-channel delay against its original value with a 6-sample
tolerance. Running two independent mono shifters — exactly what a per-channel
decision amounts to — drifted the delay by 4 samples, and the test **passed on the
broken implementation**. The property that actually separates correct from broken
is *stability*: the shared decision holds the delay perfectly constant while the
per-channel one wanders. A tolerance is not a guard until you have seen it reject
something.

## Measure the signal, not the state

A DSP or audio bug does not throw. It returns audio that is subtly wrong.

- Assert on the **output**: the fundamental that actually comes out, the amplitude
  ripple that actually appears, the delay that actually lands.
- **Verify the measuring instrument first.** Autocorrelation of a pure sine peaks
  equally at every multiple of the period, so taking the tallest peak reports the
  octave below: a 475 Hz tone measured as 237.6 Hz and a 60 Hz tone as 31.8 Hz.
  The signal was fine; the ruler was wrong. Take the *earliest* strong peak.
- **Include a sanity assertion that the uncorrected case really is different**, so
  a test cannot pass by the code under test doing nothing at all.

## Sweep parameters, do not guess them

When a constant governs quality — a window length, a search range, a threshold —
measure across a grid and pick from the table. Key lock's frame and search sizes
were chosen from a sweep across 40–440 Hz that showed ±128 samples leaving bass a
full semitone sharp while ±1536 held within 8 cents. Then **pin the choice with a
test that fails if someone shrinks it**, and say why in the failure message.

## Fetching a page is not verifying it — drive it

`curl` returning 200 for a page and every module it imports says nothing about
whether the thing works. Drive the real URL in a real browser and exercise the
actual path: search, load, play. That is what caught a defect no HTTP check could
see.

When the **console and the network trace disagree, believe the console.**
Playwright does not surface the browser's implicit `favicon.ico` request, so its
trace showed zero failing requests while the page logged two 404s.

## Browser constraints that have already cost time here

- **AudioWorklet modules cannot use `import`.** Verified, not assumed: the module
  silently fails to register and the only symptom is a deck that produces silence.
  Assemble the worklet at runtime from the same source file the tests run against
  (`fetch` → `Blob` → `addModule`) rather than duplicating the algorithm. `export`
  statements inside the assembled module are harmless.
- **`requestAnimationFrame` does not fire** in a headless/non-composited page. This
  is why the deck has a watchdog, and why Playwright actionability checks fail —
  drive handlers with `page.evaluate(() => el.click())`.
- **`getBoundingClientRect()` on an SVG `<image>`** does not report the layout box;
  use `getBBox()`.
- **Caches serve stale assets after a Pages deploy.** Check the deployed asset
  directly, not just the green tick.
- **An `<img>` needs CORS only if the pixels are read back.** This is the only
  reason album art from archive.org works at all.

## Environment quirks (Windows, no admin)

- **A rate limit is not the only thing that returns 401.** Openverse caps
  *anonymous* requests at `page_size=20` and answers **401** — not 400, not 429 —
  for anything larger. Asking for 25 made every search fail while every
  hand-written probe (which used smaller numbers) worked, and it presented as
  intermittent rate limiting. When a status code disagrees with its usual
  meaning, bisect the request rather than trusting the code.
- **There is a known intermittent test failure** (seen twice: 787/1 and 839/1 out
  of ~840). It does not reproduce in isolation, under 4-way CPU load, or across
  6 repeat runs of the timing-sensitive suites — only under full-suite parallel
  load. Several suites use wall-clock sleeps, which is the likely cause. If you
  see a single failure in an otherwise-green run, re-run before believing it, and
  capture the test name if you can — that is the missing piece.
- PowerShell `-ArgumentList` **splits on spaces**, and this repository's path
  contains them. Quote it: ``@("script.mjs", "`"$path`"")``.
- `node -e` breaks on escaped quotes and `$`. Write a temp `.mjs` file instead —
  and put it **outside the repository**, because `licence-lint` fails closed on any
  un-SPDX'd file under `tools/`.
- ES module imports in a temp script resolve relative to the *script*, not the cwd.
  Use an absolute `file:///` URL, percent-encoding the spaces in the repo path.
- Port 8080 is often taken by an unrelated service in this shared environment.
  Check what actually answers before concluding the server failed.
- MSI/MSVC installs fail with exit 1602 (no admin). Portable ZIP tools work.

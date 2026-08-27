# Research evidence

Raw output from the Phase 1 research, preserved so every claim in
[`../CONCEPT-IDEA.md`](../CONCEPT-IDEA.md) can be traced back to a source.

| File | Contents |
|---|---|
| `ANSWERS.md` | Synthesised answers for all 46 primary Tavily queries |
| `ANSWERS2.md` | Synthesised answers for the 10 verification queries |
| `queries.txt` | The primary query set (slug + query text) |
| `queries2.txt` | The verification query set |
| `repos.tsv` | Raw GitHub REST API output for all 80 repositories queried |
| `raw/` | Per-query results with full source URLs and extracted content |

## Method

**Competitive and technical research** — Tavily search API, 56 queries at `advanced` search depth with
synthesised answers enabled, across five domains: DJ software feature sets, jukebox platforms and their
business model, content-source licensing, MIDI and interconnection standards, and the open-source
landscape.

**Open-source triage** — 80 candidate repositories queried directly against the GitHub REST API
(`GET /repos/{owner}/{repo}`) for stars, primary language, licence SPDX ID, last-push date and archive
status, on 2026-08-26.

**Licence verification** — for every repository where GitHub returned `NOASSERTION`, the actual `LICENSE`
file was fetched via `GET /repos/{owner}/{repo}/license` and read.

## Why the verification step mattered

Automated licence detection was wrong or unhelpful for twelve projects, several of them load-bearing:

| Project | GitHub said | Actually |
|---|---|---|
| JUCE | `NOASSERTION` | **AGPL-3.0 or commercial** (JUCE 9) |
| miniaudio | `NOASSERTION` | Choice of **public domain or MIT-0** |
| Mixxx | `NOASSERTION` | **GPL-2.0-or-later** |
| Ableton Link | `NOASSERTION` | **GPL-2.0-or-later**, commercial option available |
| OLA | `NOASSERTION` | **Split** — LGPL-2.1 for `libola`, GPL-2.0 for `olad` |
| RtMidi | `NOASSERTION` | MIT-style |
| Chromaprint | `NOASSERTION` | MIT own code, with LGPL-2.1 FFmpeg parts |
| Performous | `NOASSERTION` | GPL-2.0-or-later |
| PortAudio | `NOASSERTION` | MIT |
| Opus | `NOASSERTION` | BSD-3-Clause |
| Ardour | `NOASSERTION` | GPL-2.0 |
| libremidi | `NOASSERTION` | Permissive, derived from RtMidi (MIT) + ModernMIDI |

Since the whole fork-vs-build analysis turns on licence compatibility, taking `NOASSERTION` at face value
would have produced materially wrong recommendations.

## Known limitations

Search-engine answer synthesis produced several plausible-sounding open-source projects that do not
exist, and described at least one proprietary product as open source. **Every project named in
`CONCEPT-IDEA.md` §5 was confirmed to exist via the GitHub API** before being included. Findings in
`ANSWERS.md` that were not independently verified should be treated as leads, not facts.

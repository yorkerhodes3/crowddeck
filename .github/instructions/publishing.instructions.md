---
description: How every working session must end — verify, commit, publish, then hand back links. Applies to all work in this repository.
---

# Always finish by publishing, and hand back links

The owner runs **ten projects at once**. The scarce resource is not code, it is
the cost of re-entering context on a project they last touched days ago. A
session that ends with work sitting on a local disk, or with a summary that
describes changes without showing them, spends that resource instead of saving
it.

So **every session ends the same way**, without being asked.

## The rule

1. **Verify before publishing.** Run the repository's own gate — `npm run check`
   — plus any story-specific probe. **Never publish a red tree.** "Always commit"
   does not mean "commit anything": a broken `main` is worse for someone
   context-switching than an unfinished one, because they will trust it.
2. **Commit with sign-off** (`git commit -s`) and a message that explains *why*,
   not just what. Include the `Co-authored-by` trailer.
3. **Push, then confirm it landed** — `git status` clean, local and `origin/main`
   at the same SHA, and CI actually green. A push that failed silently looks
   exactly like a push that worked.
4. **Verify the published artefacts are live**, not merely deployed. Fetch the
   dashboard and the demo and check the new content is really being served.
   Deployments succeed while caches serve the old page.
5. **Hand back the links, every time**, in this order:
   - **Demo** — the thing they can click and use
   - **Dashboard** — the explainer and the evidence
   - **Repo** — the code and this session's commits
6. **State what is NOT done**, briefly. A list of links with no caveats reads as
   "finished", and that is almost never true.

## The links for this repository

| What | Where |
|---|---|
| **Live deck (playable)** | <https://yorkerhodes3.github.io/crowddeck/demo/> |
| **Dashboard / explainer** | <https://yorkerhodes3.github.io/crowddeck/> |
| **Repository** | <https://github.com/yorkerhodes3/crowddeck> |
| **Local demo** | `npm start` → <http://127.0.0.1:8080/deck/index.html> |

## Why the demo is a hosted link, not an instruction

It used to be "run `npm start`". For someone switching between ten projects that
is a barrier: a clone, an install and a terminal before they can see anything.
The deck is entirely client-side — Web Audio decodes locally and the library
fetches the Internet Archive directly — so `tools/build-demo.mjs` mirrors it into
`docs/` and GitHub Pages serves it. **If a demo can be a URL, make it a URL.**

That build step **fails if any module the demo imports is missing**, because a
silently broken demo is worse than none: the link resolves, the page renders, and
the first symptom is a blank deck for whoever opened it.

## Learnings

- **A deployment succeeding is not the same as the content being live.** After a
  Pages deploy the browser served a cached `app.js`, so a new feature appeared to
  be missing entirely; fetching the deployed asset directly showed it was
  byte-correct. Check the *asset*, not just the workflow's green tick.
- **Generated files must be built by a script, never hand-copied.**
  `docs/demo/` and `docs/engine-web/` mirror real source. A hand-copied duplicate
  drifts, and the published demo slowly stops matching the tested code.
- **Fetching a page is not verifying it. Drive it.** `curl` returning 200 for the
  demo and every module told us nothing about whether the deck *worked*. Driving
  the live URL in a real browser — search, load, play — is what confirms it, and
  is what caught a defect no HTTP check could see.
- **Playwright does not report the implicit favicon request**, so its network
  trace showed zero failing requests while the page console showed two 404s. When
  the console and the network trace disagree, believe the console and check by
  hand; the answer was a missing `<link rel="icon">`. Prefer an inline data-URI
  icon: it costs no request and cannot 404 wherever the page is mounted.
- **Update the counts in `README.md` and `docs/index.html` whenever stories or
  tests change.** They are written by hand and go stale silently — the dashboard
  once claimed "nothing is audible yet" for a build that made sound.

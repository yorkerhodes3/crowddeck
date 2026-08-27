# SPIKE-1 — headless Mixxx extraction: findings

**Status:** Analysis complete · build-and-measure **not** done (see §6)
**Date:** 2026-08-27
**Backlog item:** `SPIKE-1` · **Decision under test:** [ADR-002](../DECISIONS.md#adr-002--engine-fork-mixxx-or-build-new)

---

## 1. What this spike was for

ADR-002 committed the project to forking Mixxx, on the strength of one claim:

> Mixxx's `src/control` already exposes an enumerable, named, change-notifying parameter bus that its
> JavaScript controller layer drives the entire engine through. CDEP adopts that vocabulary, so the work is
> largely adding a transport over a proven abstraction rather than inventing one.

That claim was made from directory listings and file names. **The whole plan rests on it**, so it needed
verifying against real source before anyone spends months on fork surgery.

Everything below was read from `mixxxdj/mixxx` at the commit current on 2026-08-27. Fetched extracts are
in [`mixxx-src/`](mixxx-src) so the findings can be checked rather than taken on trust.

---

## 2. The core assumption: **verified**

| Claim | Evidence | Verdict |
|---|---|---|
| Controls are enumerable at runtime | `control.h:63` — `static QList<QSharedPointer<ControlDoublePrivate>> getAllInstances();` with the comment *"Returns a list of all existing instances."* | ✅ |
| Controls are named and addressable | Every control is keyed by `ConfigKey` (group, item) — exactly CDEP's addressing | ✅ |
| Controls carry human-readable labels | `control.h:69–83` — `name()` and `description()`, the latter commented *"User-visible, i18n description for what the control does."* | ✅ |
| Controls have defaults | `control.h:129` — `defaultValue()` | ✅ |
| Change notification exists | `ControlObjectScript` extends `ControlProxy` and emits `trigger(double, QObject*)`; `ScriptConnection` binds JS callbacks | ✅ |
| The scripting layer drives the engine through it | `controlobjectscript.h:10` — *"this is used for communicate with controller scripts"* | ✅ |

**ADR-002 stands.** The abstraction CDEP was designed against is real, and CDEP's `(group, item)`
addressing maps 1:1 onto `ConfigKey`.

### 2.1 Two findings that make the fork *easier* than assumed

**The engine is not coupled to the GUI.** `enginemixer.h` includes only `<QObject>` and
`<QVarLengthArray>` from Qt — QtCore only, no QtWidgets, no QtGui. The headless build does not have to cut
through a GUI dependency in the audio path, which was the main risk in "strip Mixxx to a headless binary."

**Coalescing already exists.** `ControlObjectScript` holds a `CompressingProxy m_proxy` and a
`m_skipSuperseded` flag. That is precisely the behaviour `REQ-CDEP-14` specifies — one update per control
per interval, latest value wins. It can be inherited rather than built.

---

## 3. A correction to my own claim

ADR-002, `SPECIFICATION.md` §2.1 and `engine/README.md` all said `ControlModel` "makes the control set
enumerable at runtime." **That is wrong and has been corrected in all three.**

`controlmodel.h` shows `ControlModel` is a `QAbstractTableModel` — a table model backing Mixxx's
*Developer → Controls* window. Controls are added to it **manually** via
`addControl(key, title, description)`; it does not discover them.

The real enumeration is `ControlDoublePrivate::getAllInstances()`.

The conclusion is unchanged — enumeration exists — but the mechanism named was wrong, and a plan should
name the right one. `ControlModel` remains useful as a *reference*: its columns are `GROUP, ITEM, VALUE,
PARAMETER, TITLE, DESCRIPTION`, which is close to the CDEP descriptor, and it confirms the Mixxx
developers reached for the same shape.

---

## 4. The contract needs amending — the spike's main output

CDEP was specified before any engine existed, which was deliberate (ADR-002: the contract should be shaped
by its consumer). Checking it against the real engine surfaces three mismatches. **All three are in
`REQ-CDEP-12`, the descriptor requirement.**

### 4.1 `min` and `max` are not uniformly available

`REQ-CDEP-12` requires every descriptor to carry `min` and `max`. Mixxx cannot supply them:

- Ranges live in the *behavior* object — `ControlPotmeterBehavior` holds `m_dMinValue` / `m_dMaxValue` as
  **protected** members (`controlbehavior.h:54–55`).
- The behavior is held privately: `control.h:189` — `QSharedPointer<ControlNumericBehavior> m_pBehavior;`
  with no accessor.
- `ControlPotmeter::setRange()` exists (`controlpotmeter.h:84`) — a **setter with no getter**.
- Not every control has a range at all. `ControlEncoderBehavior` is unbounded by design.

Satisfying the requirement as written would mean patching upstream Mixxx to add accessors, on every
behavior class, and inventing ranges for controls that have none.

### 4.2 `type` is not modelled

CDEP descriptors declare `bool | int | float | enum`. In Mixxx **every control is a `double`**. Button-ness
is a *behavior* (`ControlPushButtonBehavior`), not a type. There is no enum concept.

### 4.3 But Mixxx has something better: parameter space

Every control — universally, on the base class — exposes a **normalised 0..1 representation**:

```cpp
// control.h:113-116
void   setParameter(double dParam, QObject* pSender);
double getParameter() const;
double getParameterForValue(double value) const;
double getParameterForMidi(double midiValue) const;
```

```cpp
// controlbehavior.h:20-27
virtual double valueToParameter(double dValue);   // returns the normalized parameter range 0..1
virtual double midiToParameter(double midiValue); // returns the normalized parameter range 0..1
virtual double parameterToValue(double dParam);   // returns the scaled user visible value
virtual double valueToMidiParameter(double dValue); // returns the midi range parameter 0..127
```

This is a **better design than the one I specified**, and it is worth being direct about why:

- It is **universal**. Every control has it; ranges are not universal.
- It **subsumes the reason min/max was required**. Clients wanted min/max in order to scale a control into
  its range. Parameter space does the scaling inside the engine, where the correct curve is known —
  logarithmic for gain, audio-tapered for volume, linear for a crossfader. A client scaling from min/max
  would get all of those wrong.
- It has **MIDI built in**. `midiToParameter` and `valueToMidiParameter` handle 0..127 directly.

Our own MIDI mapping layer already normalises everything to 0..1 internally and then scales via
`min`/`max`. That scaling is redundant work that produces *worse* results than asking the engine.

### 4.4 Recommended amendment

1. Add a normalised **`parameter`** (0..1) to `get`, `set`, `value` and `changed`. Every conforming engine
   MUST support it.
2. Demote `min`, `max` and `type` in descriptors from **MUST** to **SHOULD**, as optional hints for engines
   that have them.
3. Keep `label` and `default` mandatory — Mixxx supplies both.
4. Prefer parameter space in the MIDI mapping layer, so per-control curves come from the engine.

This is applied in the commit accompanying this report.

---

## 5. `§2.10` control set: validated, with two errors found

12 of 14 sampled control names appear in Mixxx source as specified: `playposition`, `keylock`, `rate_dir`,
`sync_leader`, `sync_enabled`, `pregain`, `hotcue_1_activate`, `loop_enabled`, `cue_gotoandplay`,
`track_loaded`, plus `crossfader` and `headMix` confirmed directly in `enginemixer.cpp`.

**Two are wrong:**

| Spec said | Reality | Evidence |
|---|---|---|
| `[Master]`/`gain`, `headGain` range `0..4` | **`-14..14` decibels** | `enginemixer.cpp:67,71` — `ControlAudioTaperPot(ConfigKey(group,"gain"), -14, 14, 0.5)` |
| `[Channel N]`/`eq_low`, `eq_mid`, `eq_high` | **Not deck controls.** EQ is a separate effects group | `common-controller-scripts.js:590` — `script.eqRegEx = /^\[EqualizerRack1_(\[.*\])_Effect1\]$/`, parameters `parameter1..3`, range 0..4 |

The EQ error matters beyond a name: it means per-deck EQ arrives through the **effects rack**, so the
effects subsystem is not optional for a v1 that promises per-deck EQ (`§0.2`). That is a scope finding, not
just a typo.

Both corrections are applied to `SPECIFICATION.md` in the accompanying commit. The `gain` error is also a
good argument for §4.4: had the client been scaling 0..4 against a control that is really -14..14 dB on an
audio taper, every gain move would have been wrong, and *parameter space would have prevented it entirely*.

---

## 6. What this spike did **not** do

Stating this plainly, because the backlog item asked for more than was possible here.

**Mixxx was not built.** It needs CMake, Qt6, MSVC and roughly forty dependencies. This environment has
none of them (`cmake`, `qmake`, `cl`, `g++`, `ninja` all absent; no Qt; no Visual Studio). Installing that
toolchain and building a ~640 MB C++ project is a multi-hour job that belongs on a real development
machine.

**Consequently, no latency was measured.** The `§8.1` budgets — sub-10 ms deterministic audio callback,
p99 < 20 ms for CDEP command → control applied — remain **unvalidated**. They are still assumptions.

**What remains for SPIKE-1 to be complete:**

| Step | Why it needs a real machine |
|---|---|
| Build Mixxx from source | Qt6 + CMake + MSVC toolchain |
| Strip to a headless binary | Requires the build to iterate against |
| Wire `getAllInstances()` to a CDEP server | Small, but only meaningful once it compiles |
| Measure command → audio latency | Needs a real audio device |
| Measure MIDI → audible latency | Needs real hardware (`AC-12` also needs this) |
| Confirm the `§8.1` budgets | The one genuinely open technical risk |

The analysis half is the half that could invalidate the plan cheaply, and it did not. The measurement half
is the half that can only be done properly with hardware, and it is still owed.

---

## 7. Verdict

**ADR-002 is confirmed. Continue with the fork.**

The abstraction CDEP was designed against is real, richer than assumed, and the engine is not entangled
with the GUI. The extraction looks *more* tractable than the ADR claimed, not less.

Three things changed as a result of looking:

1. CDEP gains **parameter space** and loses mandatory `min`/`max`/`type` — a real contract amendment,
   driven by evidence, exactly what writing the contract first was supposed to surface.
2. Two `§2.10` errors are corrected, one of which (EQ via the effects rack) has scope consequences.
3. One of my own claims (`ControlModel` enumerates) is corrected.

**Residual risk is now concentrated in one place: the latency budgets.** Everything else about the fork has
been checked. That is a better position than the spike started from, and it says clearly what the next
person needs a machine for.

---

## 8. Changes landed from this spike

Findings are only worth the changes they cause. Everything below is committed and passing CI.

| Area | Change |
|---|---|
| `protocol/src/controls.js` | `min`/`max`/`type` demoted to optional; added `PARAMETER_MIN`/`MAX`, `coerceParameter`, `parameterToValue`, `valueToParameter` |
| `protocol/src/messages.js` | `value` and `changed` carry an optional `parameter` |
| `protocol/src/client.js` | `setParameter()` / `getParameter()` |
| `protocol/cdep-1.schema.json` | `controlDescriptor.required` relaxed to `group, item, default, readonly, label` |
| `engine-stub/` | Serves and accepts parameter space on `get`, `set` and `changed` |
| `interconnect/src/mapping.js` | Absolute MIDI bindings emit `parameter` alongside `value` |
| `conformance/src/suite.js` | **C20** — parameter round-trip, out-of-range refusal, mandatory descriptor fields (20 checks total) |
| `protocol/test/parameter.test.js` | 10 tests, including one that demonstrates the exact gain bug the amendment prevents |
| `SPECIFICATION.md` | `REQ-CDEP-12` reworded, `REQ-CDEP-12a` added, §2.10 corrected, §2.1 citation fixed |
| `DECISIONS.md`, `engine/README.md` | `ControlModel` claim corrected to `getAllInstances()` |
| `docs/data/backlog.json` | `ENG-1` keep-list gains `effects`; `ENG-2`/`ENG-3` carry the spike's findings; `SPIKE-1` marked partial |
| `tools/build-backlog.mjs` | `partial` added as a first-class status, counted separately from `done` |
| `tools/extract-requirements.mjs` | Requirement IDs may carry a letter suffix, so amendments don't renumber |
| `tools/licence-lint.mjs` | Fails closed on unassigned directories; `thirdParty` plane; **all five import forms** now checked |
| `tools/test/licence-lint.test.js` | 6 tests proving each licence rule actually fires |
| `spike/mixxx-src/PROVENANCE.md` | Exact upstream commit, licence, and per-file citation map |

### A licence gap this spike opened, and closed

Fetching ~160 KB of Mixxx source into the repo quietly created the exact problem
[ADR-001](../DECISIONS.md) exists to prevent: **GPL code sitting in an Apache-2.0 repository, unmarked.**
Worse, `licence-lint` reported "no violations" throughout — because `spike/` matched no declared plane and
unassigned paths were silently skipped. A gate that ignores what it does not recognise is worse than no gate,
because it produces false confidence.

Three fixes, each verified by a test that fails when the rule is removed:

1. **Fail closed.** Source outside every declared plane is now a violation, not a skip.
2. **`spike/mixxx-src` is a declared copyleft plane.** Upstream files keep their own headers (we must not
   edit third-party source), but any Apache-2.0 file importing from them fails the build exactly as if it had
   imported from `engine/`.
3. **The boundary rule was itself broken.** It only matched `import … from "x"`. A bare side-effect import
   — `import "x";` — has no `from` clause and walked straight through. So did `import()`. Both are now
   caught, along with `require`, `export … from`, and `#include`.

Point 3 is the one worth remembering: the rule had been passing since M1 while blind to two of the five ways
JavaScript can load a module. It was found only by deliberately trying to violate it. Nothing in the
repository was actually in breach — but the guard would not have stopped it.

The single most useful artefact is [`protocol/test/parameter.test.js`](../protocol/test/parameter.test.js):

```
test("the whole point: scaling from min/max would have produced wrong gain", ...)
```

The specification declared `[Master]/gain` as `0..4` linear. Mixxx uses `-14..14` dB. A MIDI fader at half
travel would have computed `2.0` and meant *"double gain"*; the engine, reading its own control, means
`0 dB` — *unity*. Same wire value, opposite intent. That test now fails if anyone reintroduces client-side
range scaling.

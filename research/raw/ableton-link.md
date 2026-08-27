# ableton-link

QUERY: Ableton Link protocol open source SDK tempo sync phase quantum how it works

## Synthesized answer
Ableton Link is an open‑source, peer‑to‑peer library that shares a single global timeline—tempo, beat position and phase—across any number of applications on one or more devices on a local network; each participant creates a Link object, enables it, and optionally supplies a “quantum” value (in beats) that defines the unit of phase alignment so that all peers with the same quantum stay perfectly in sync and peers with multiples of each other’s quantum stay aligned at the larger boundaries (e.g., a 8‑beat loop aligns with a 4‑beat loop at the start of each 8‑beat bar). The SDK provides functions such as getTempo/setTempo, getBeat, getPhase(quantum), isPlaying, enableStartStopSync, requestBeatAtTime(beat,time,quantum) and forceBeatAtTime, which allow reading the current tempo and phase, changing tempo, and requesting a specific beat to occur at a precise time; when start/stop sync is enabled, transports are quantized to the next quantum boundary so that all participants launch or stop together, while the underlying clock runs continuously and each peer can independently compute its local beat and phase from the shared timeline.

## Sources

### GitHub - ktamas77/ableton-link: Ableton Link · GitHub
URL: https://github.com/ktamas77/ableton-link
### `getTempo(): number`

`getTempo(): number`

Get the current tempo in BPM.

### `setTempo(bpm: number): void`

`setTempo(bpm: number): void`

Set a new tempo in BPM.

### `getNumPeers(): number`

`getNumPeers(): number`

Get the number of connected Link peers.

### `getBeat(): number`

`getBeat(): number`

Get the current beat position.

### `getPhase(quantum: number): number`

`getPhase(quantum: number): number`

Get the current phase for the given quantum (beat subdivision).

### `isPlaying(): boolean`

`isPlaying(): boolean`

Check if transport is playing.

Important: Start/stop sync must be enabled with `enableStartStopSync(true)` for this method to work correctly. Without start/stop sync, Link only synchronizes tempo and beat position, not play/stop state. [...] Register a callback to be notified when the tempo changes.

### `setStartStopCallback(callback: (isPlaying: boolean) => void): void`

`setStartStopCallback(callback: (isPlaying: boolean) => void): void`

Register a callback to be notified when the play/stop state changes.

### `requestBeatAtTime(beat: number, time: number, quantum: number): void`

`requestBeatAtTime(beat: number, time: number, quantum: number): void`

Request a specific beat to occur at a specific time. When connected to peers, this will quantize to the nearest quantum boundary for synchronized starts.

### `requestBeatAtStartPlayingTime(beat: number, quantum: number): void`

`requestBeatAtStartPlayingTime(beat: number, quantum: number): void` [...] ### `isStartStopSyncEnabled(): boolean`

`isStartStopSyncEnabled(): boolean`

Check if start/stop synchronization is enabled.

### `forceBeatAtTime(beat: number, time: number, quantum: number): void`

`forceBeatAtTime(beat: number, time: number, quantum: number): void`

Force a specific beat  ...

### OSC and Network
URL: https://csound.com/docs/manual/OSCNetwork.html
Ableton Live is not required to use the Ableton Link protocol, as it is a peer-to-peer protocol.
There is one Link session on the local area network that maintains a global time, tempo, and
beat. Any peer may set the tempo,
and thereafter all peers in the session share that tempo. A process may
have any number of peers (i.e., any number of Link objects). Each peer
may also define its own "quantum" i.e. some multiple of the beat, e.g. a
quantum of 4 might imply 1 beat every measure of 4/4 time. The phase of the time is defined w.r.t
the quantum, e.g. phase 0.5 of a quantum of 4 would be the second beat of
the measure. Peers may read and write timelines with local time, beat, and
phase, counting from when the peer is enabled, but the tempo and beat on [...] link\_create - Creates an Ableton Link peer object.

link\_enable - Enable/disable synchronization with the network Ableton Link session tempo and beat.

link\_is\_enabled - Returns whether or not this Ableton Link peer has joined the network session.

link\_tempo\_set - Sets the tempo for the network's Ableton Link session.

link\_tempo\_set - Returns the tempo of the network's Ableton Link session.

link\_beat\_get - Returns the beat, phase, and current time of Ableton Link for this session for a given quantum.

link\_metro - Returns a trigger that is 1 on the beat and 0 otherwise along with the beat, phase, and current time of Ableton Link for this session for a given quantum.

link\_beat\_request - Requests a beat with a specific number at a specific time at a given quantum. [...] The first peer in a session determines the initial tempo. After
that, the tempo is changed only, and whenever, any peer explicity calls
the set tempo functon (link\_tempo\_set, in Csound).

The Link tempo is independent of the Csound scor ...

### Link Documentation | Ableton
URL: https://ableton.github.io/link
In order to enable the desired bar and loop alignment, an application provides a quantum value to Link that specifies, in beats, the desired unit of phase synchronization. Link guarantees that session participants with the same quantum value will be phase aligned, meaning that if two participants have a 4 beat quantum, beat 3 on one participant’s timeline could correspond to beat 11 on another’s, but not beat 12. It also guarantees the expected relationship between sessions in which one participant has a multiple of another’s quantum. So if one app has an 8-beat loop with a quantum of 8 and another has a 4-beat loop with a quantum of 4, then the beginning of an 8-beat loop will always correspond to the beginning of a 4-beat loop, whereas a 4-beat loop may align with the beginning or the [...] As of Version 3, Link allows peers to share information on the user’s intent to start or stop transport with other peers that have the feature enabled. Start/stop state changes only follow user actions. This means applications will not adapt to, or automatically change the start/stop state of a Link session when they are joining. After a peer joins a session it exposes and listens to all upcoming start/stop state changes. This is different to tempo, beat, and phase that are automatically aligned as soon as an application joins a session. As every application handles start and stop commands according to its capabilities and quantization, it is not expected that applications start or stop at the same time. Rather every application should start according to its quantum and phase. [...] # Ableton Link

Ableton Link is a technology that synchronizes musical beat, tempo, phase, and start/stop commands across multiple applications running on one or more devices. Applications on devices co ...

### Playing in time with Ableton Link
URL: https://help.heavym.net/hc/en-us/articles/360016513019-Playing-in-time-with-Ableton-Link
The protocol syncs up tempo, beat, and phase between multiple applications that can be running on one or multiple devices. That way, you can for

### Ableton Link- A technology for synchronization that expands on MIDI timing – MIDI.org
URL: https://midi.org/ableton-link-a-technology-for-synchronization-that-expands-on-midi-timing
by Ableton

Phase Synchronization

Even with Tempo Synchronization and Beat Alignment, when working with loops and bars lines, you often want the large structure ( 2 bar, 4 bar, 8 bar, etc.) to be aligned.  Phase Synchronization is a clever way to do this. Link requires that each application provide a quantum value in beats that specifies the desired unit of phase synchronization. [...] Specifying the quantum value and the handling of phase synchronization is the aspect of Link integration that leads to the greatest diversity of approaches among developers. There’s no one-size-fits-all recommendation about how to do this, it is very application-specific. Some applications have a constant quantum that never changes. Others allow it to change to match a changing value in their app, such as loop length or time signature. In Ableton Live, it is directly tied to the “Global Quantization” control, so it may be useful to explore how different values affect the behavior of Live in order to gain intuition about the quantum. [...] In order to maintain phase synchronization, the vast majority of Link-enabled applications (including Live) perform a quantized launch when the user starts transport. This means that the user sees some sort of count-in animation or flashing play button until starting at the next quantum boundary. This is a very satisfying interaction because it allows multiple users on different devices to start exactly together just by pressing play at roughly the same time. We strongly recommend that developers implement quantized launching in Link-enabled applications.

by Ableton

Start/Stop Synchronization

### Ableton Link Tutorial - How to build and some tips - Useful Tools and Components - JUCE
URL: https://forum.juce.com/t/ableton-link-tutorial-how-to-build-and-some-tips/31242
`Example calls
// Capture the session.
/If you must capture the session from a non-audio thread,
then use captureAppSessionState() while also ensuring that
the out_time_us value has been retrieved in a
thread-safe and realtime-safe manner./
auto session = link.captureAudioSessionState();
// Get the beat
const auto beat = session.beatAtTime(out_time_us, link.quantum);
// Get the phase
const auto link_phase = session.phaseAtTime(out_time_us, link.quantum);
// Make an initial sync request call
const auto ph = get_internal_play_head(); // Your internal playhead object that stores the current bpm, position, beat, etc.
session.setTempo(ph.bpm, out_time_us);
session.setIsPlaying(ph.is_playing, out_time_us);
session.requestBeatAtTime(ph.beat, out_time_us, link.quantum);` [...] Ok, now we have the out\_time\_us stored. You will use this value all over the place in Link’s API to query the current beat, bpm, phase etc. or make requests to change tempo/playback state, etc. wherever you need it in your audio chain. [...] `class Link : public ableton::Link
{
friend class DeviceManager;
public:
//======================================================================
using us = std::chrono::microseconds;
using SessionState = ableton::Link::SessionState;
//======================================================================
static constexpr const double
quantum = 4.; //======================================================================
Link() noexcept : ableton::Link{ 120. } {}
auto out_time_us() const noexcept-> us { return out_time_us_; }
private:
//======================================================================
ableton::link::HostTimeFilter<ableton::link::platform::Clock>
host_time_filter;
us
out_time_us_{},
out_latency_us{};
JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR ( ...

### Some Thoughts on Tempo Sync in Audulus - Feature Requests - Audulus
URL: https://forum.audulus.com/t/some-thoughts-on-tempo-sync-in-audulus/114
Ableton Link has implementation requirements that will dictate some elements of a potential sync node. Enabling/disabling Link (and presumably MIDI) will most likely need to be done within the settings menu rather than at the patch level. Assuming that Link is enabled and a session is available on the network, what inputs and outputs should we expect? Link provides beat, time and tempo to session participants and participants can send tempo change requests, a synchronization quantum (roughly time signature), and start/stop requests. One consideration of Link implementation is that when a client joins an existing session it must adopt the current tempo and should only request a change in response to user action. This precludes using a tempo input on the node attached to a knob or something [...] The third mechanism which has gained in popularity in the last few years is Ableton Link. This is a protocol and accompanying software developed by the Ableton company to allow various musical applications running on the same or different platforms but connected by a common network to synchronize with each other. Unlike MIDI sync or traditional plug-in sync, Link does not have a single master clock. Each device maintains its own timebase and any device can request an alteration of the tempo or request to start and stop the session. Similar to the other methods, Ableton Link provides an application with tempo, beat position and position within a “measure”. [...] I will reply to this at greater length later, but we are definitely going to add Ableton Link to Audulus 4.

The only question is how it will be implemented. It will definitely be a node of some kind, but what kind of inputs and outputs it has is up in the air.

But you bring up an interesting point, if not directly - Able ...

### Synchronizing with Link, Tempo Follower, and MIDI — Ableton Reference Manual Version 12 | Ableton
URL: https://www.ableton.com/en/manual/synchronizing-with-link-tempo-follower-and-midi
## 36.1 Synchronizing via Link

Ableton Link is a technology that synchronizes musical beat, tempo, and phase across multiple applications or devices over a wired or wireless network. Link Audio extends Link by making it possible to stream audio in real-time between Link session participants, or peers, without additional hardware or complex routing setups. [...] Link and Link Audio are built into all Ableton products as well as a growing number of third-party apps and hardware devices. Any participant of a Link session can start and stop playback independently and remain in time and phase with connected peers, with playback following the global launch quantization. Any participant can adjust the tempo and the change will be reflected in all connected apps or devices. Participants can join or leave at any time without interrupting the synchronization between other peers.

You can synchronize via Link alongside Tempo Follower or MIDI synchronization. In both cases, Live will use the tempo received from the external input for the Link session.

### 36.1.1 Setting up Link and Link Audio [...] Arrangement Position Shows Relation to Link Timeline.

The first participant to join a Link session sets the initial tempo for other connected peers. Any peer can then change the tempo at any time and the other participants will follow. If multiple participants try to change the tempo simultaneously, everyone else will try to follow, but the tempo will be set by the last participant who made the change. Tempo changes made by a Link session participant will override tempo automation in your Live Set.

Note that the metronome’s recording count-in cannot be used when Link is enabled.

Link generally works without issues as soon as it is enabled and provides reliable synchronization in mos ...


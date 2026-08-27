# midi-clock-mtc-sync

QUERY: MIDI clock MTC MIDI time code sync DJ software tempo sync jitter best practices

## Synthesized answer
MIDI Clock and MIDI Time Code (MTC) serve different sync purposes: MIDI Clock is a real‑time, tempo‑dependent stream of 24 pulses per quarter‑note that drives musical timing and is the preferred method for tight beat‑level synchronization in DJ software and hardware, while MTC encodes SMPTE video timecode (hour‑minute‑second‑frame) in eight quarter‑frame messages per frame and does not convey tempo, making it unsuitable for precise musical sync and prone to noticeable jitter because its resolution is limited to about 0.6 ms and the messages can be delayed by other MIDI traffic. To minimise jitter when using MIDI Clock in a DJ setup, keep the clock path simple (avoid daisy‑chaining Thru ports that can create loops), use a dedicated MIDI interface with low‑latency drivers, prioritize real‑time messages in the host’s MIDI queue, and consider locking the host’s internal tempo to an external audio‑derived tempo follower if a live drummer or turntables are the master source; if MTC must be used (e.g., for video‑to‑audio alignment), ensure it is sent on a separate channel, limit simultaneous SysEx traffic, and accept that its timing will be coarser than Clock, using it only for positional reference rather than beat‑accurate triggering.

## Sources

### Rack v2 still has midi clock jitter issue from other Daws? - Page 2 - Development - VCV Community
URL: https://community.vcvrack.com/t/rack-v2-still-has-midi-clock-jitter-issue-from-other-daws/14209?page=2
Also, many of those pro-sequencers from the 80s relied on MMC play/stop commands as much as the actual MTC timecode stream, although I agree that a number of them could use MTC too (but only because they defined their own tempo map).

Again, MTC has no relevance for musical time sync, which is what most sync-via-MIDI-for-DAWs-hardware-and-plugins is all about.

MTC is video timecode transcoded into MIDI messages. It does not define tempo, beats, bars or any other musical time in anyway whatsoever.

Want tight timing, buy a mpc3000.

People still keep msdos computers around today to run my ms dos sequencer from to early 80s. Plenty tight.

Or just audio impulse to trigger midi? Im using sync gen pro and havent looked back since then, but its only midi trigger without data! [...] Introducing the MMU and virtualization of interrupts made modern computes much more stable, but made midi timing terrible. When the world decided they wanted windows music software I stopped making it.

I never programmed MTC time sync, I just read this:

"When the time is running continuously, the 32-bit time code is broken into 8 4-bit pieces, and one piece is transmitted each quarter frame. I.e. 96—120 times per second, depending on the frame rate. Since it takes eight quarter frames for a complete time code message, the complete SMPTE time is updated every two frames. "

Depends how you lock your clock phases i guess, but if i was to code something to sync over MIDI, i’d prefer " System Real Time Messages" - Just saying. [...] # Rack v2 still has midi clock jitter issue from other Daws?

IMO, midi realtime messages are the only ones that are supposed to be used for accurate sync’ing. The MTC is not accurate to 1/3125 sec - it has lower priority than midi realtime messages. It’s sent every 1/1 ...

### My Life With MIDI Time Code (SOS Jan 90)
URL: https://www.muzines.co.uk/articles/my-life-with-midi-time-code/5739
Even on a dedicated line, MTC will experience some jitter, because the resolution of MIDI is not infinite. A device reading SMPTE timecode on tape can be phase-locked, so the resolution can be as accurate as the rise time of the SMPTE signal, and that resolution is checked each time a bit comes in, which is up to 2400 times every second. MIDI resolution has an upper limit of about 0.6 milliseconds, and since the quarter-frame messages come in no faster than 120 times per second, any corrections made would be much coarser. While MIDI's resolution is fine for sequencers, it is no good for analogue tape, because we would hear the changes as flutter — the human ear is much more sensitive to minute changes in pitch than it is to changes in rhythm. As one engineer I know puts it, slaving your [...] Even on a dedicated line, MTC will experience some jitter, because the resolution of MIDI is not infinite. A device reading SMPTE timecode on tape can be phase-locked, so the resolution can be as accurate as the rise time of the SMPTE signal, and that resolution is checked each time a bit comes in, which is up to 2400 times every second. MIDI resolution has an upper limit of about 0.6 milliseconds, and since the quarter-frame messages come in no faster than 120 times per second, any corrections made would be much coarser. While MIDI's resolution is fine for sequencers, it is no good for analogue tape, because we would hear the changes as flutter — the human ear is much more sensitive to minute changes in pitch than it is to changes in rhythm. As one engineer I know puts it, slaving your [...] The quarter-frame messages are as accurate, if not more so, as MIDI Timing Clock commands (it takes a tempo of 300 beats per minute to generate MIDI Timing Clocks at the 120-per-second rate of ...

### How does MIDI keep music, lights, and visuals in sync? - AudioGearz
URL: https://www.audiogearz.com/audio/midi-synchronization-music-lighting-visuals
MIDI Clock: Sends constant timing pulses (24 per quarter note) to set a shared tempo. MIDI Timecode (MTC): Communicates the precise hour, minute

### - MIDI Timecode (MTC) vs MIDI Beat Clocks
URL: https://motu.com/techsupport/technotes/document.2004-07-09.6053528299
# MOTU

MOTU
Audio Home
Video Home

##### Sections

Products
Tech Support
Store
Downloads
Company

##### Tech Support

##### Document Actions

Print this page

# MIDI Timecode (MTC) vs MIDI Beat Clocks

MIDI Timecode (MTC) and MIDI Beat Clocks are two different ways to sync MIDI devices. MTC is channelized, meaning that it is sent and received using one MIDI port; MIDI Beat Clocks are a system common message, which means that it is sent to all ports of a MIDI device. [...] Sometimes a MIDI clock loop can occur when transmitting or syncing to MIDI Beat Clocks. This can happen if you have a MIDI device that is connected to your interface via a Thru port - this will echo the beat clock messages back into the system and there will now be two clock sources. If you are having trouble when syncing to or transmitting MIDI beat clocks, try disconnecting all of your MIDI devices from your interface. If the problem goes away, reconnect them one at at time to determine which unit is introducing the problem.

Check out our others FAQs on "MIDI Timecode (MTC)" and "MIDI Beat Clock".

Note: AudioDesk does not have the option to sync to MIDI Beat Clocks.

##### Products

### Rack v2 still has midi clock jitter issue from other Daws? - Development - VCV Community
URL: https://community.vcvrack.com/t/rack-v2-still-has-midi-clock-jitter-issue-from-other-daws/14209?page=
Moreover, MTC is a video timestandard, and has no particular relationship to musical time (beats) or audio time (samples).

VST/LV2/AU/AAX plugins can ask the host for timeline position, but almost never in terms of MTC (video frames).

That’s not quite true. most “pro” midi sequencers in the 80’s could sync to MTC. They would apply their own temp map and start time to the MTC. This let a sequencer start up in the middle of a song in sync. It’s true that has less application in rack, but it’s still a clock source that one can derive stable timing from.

Powered by Discourse, best viewed with JavaScript enabled [...] I’ll poke around the source later if I get the chance, but having The Word™ from Andrew himself on how Midi clocking, time code, and engine clocking are working together at a high level would be appreciated.

As an aside, if MTC is being used now, I feel for Andrew in development, as it hurts my brain a little.

MTC is not relevant, VCV Rack doesn’t have a timeline.

But MIDI realtime messages should be put in front of the midi message queue.

MTC is not relevant, VCV Rack doesn’t have a timeline. [...] MTC is not relevant, VCV Rack doesn’t have a timeline.

The Rack For Daws (studio edtion? IDK, I’m very mixed up on terminology now) implementation will almost certainly be able to get MTC from the host DAW. Plus, even the community edition will be able to render at faster-than-realtime now, so I could see whenever that render is initated counting as the ‘0:00’ of a timeline.

Could be, we will probably never know, as that part is closed source.

MTC refers only to a timeline, which has no meaning inside Rack itself.

Even if you were running Rack as a plugin inside a host (DAW or otherwise), it would still be meaningless almost all the time to know “where we ...

### Synchronizing with Link, Tempo Follower, and MIDI — Ableton Reference Manual Version 12 | Ableton
URL: https://www.ableton.com/en/manual/synchronizing-with-link-tempo-follower-and-midi
MIDI Clock: MIDI Clock works like a metronome ticking at a fast rate. The rate of the incoming ticks is tempo-dependent: Changing the tempo at the sync host (e.g., a drum machine) will cause the device to follow the change. The MIDI Clock protocol also provides messages that indicate the song position. With respect to MIDI Clock, Live can act as both a MIDI sync host and device. [...] If you run into any issues with Link Audio, have a look at the Link Audio FAQ in the Knowledge Base.

## 36.2 Synchronizing via Tempo Follower

You might encounter situations where a Link connection or MIDI Clock are not available. Or, sometimes you might prefer not to use a rigid, computer-generated clock. For example, you might like Live’s tempo to follow the natural push and pull of a drummer in your band, or you might be trying to synchronize to a set of turntables during a DJ performance. This is where Tempo Follower comes in. Tempo Follower analyzes an incoming audio signal in real-time and interprets its tempo, allowing Live to follow along and keep in time.

### 36.2.1 Setting Up Tempo Follower [...] ### 36.3.1 Synchronizing External MIDI Devices to Live

Live can send MIDI Clock messages to an external MIDI sequencer (or drum machine). After connecting the sequencer to Live and setting it up to receive MIDI sync, turn the device on as a sync destination in Live’s Tempo & MIDI Settings.

Choosing a MIDI Device for Live.

The lower indicator LED next to the Control Bar’s EXT button will flash when Live is sending sync messages to external sequencers.

### 36.3.2 Synchronizing Live to External MIDI Devices

Live can be synchronized via MIDI to an external sequencer. After connecting the sequencer to Live and setting it up to send sync, use Live’s Tempo & MIDI Settings to tell Live ab ...

### Maschine Midi Clock Out Jitter - Gearspace
URL: https://gearspace.com/board/electronic-music-instruments-and-electronic-music-production/880476-maschine-midi-clock-out-jitter.html
It works via a plugin that generates a stream a sample accurate clicks that are converted to to MIDI sync. Completely removes any MIDI jitter

### Syncing Drum Machines and Synthesizers With a DJ Set
URL: https://djtechtools.com/2015/05/10/syncing-drum-machines-and-synthesizers-with-a-dj-set
Manually syncing a drum machine is the fastest way to get started, no midi clock or midi cable required. Simply match the tempo of the drum


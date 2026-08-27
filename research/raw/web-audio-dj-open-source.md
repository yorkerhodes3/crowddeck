# web-audio-dj-open-source

QUERY: open source web based DJ app Web Audio API GitHub browser DJ mixer project

## Synthesized answer
Several open‑source, browser‑based DJ mixers built with the Web Audio API are available on GitHub, the most prominent being DJ23, a casual two‑deck DJ mixer that runs entirely in the browser and uses the Web Audio API for low‑latency playback, beat‑matching, and optional Web‑MIDI controller support; GridSound, a work‑in‑progress free digital audio workstation that includes multitrack mixing, effects, and a full Web Audio‑API backend; Waveform‑Playlist, a multitrack Web Audio editor and player that displays waveforms on a canvas, lets users set cues, fades and shift tracks in time, and can export mixes to AudioBuffer or WAV; and a lightweight “web‑audio‑mixer” repository that demonstrates basic deck cross‑fading, volume control and synchronisation using Web Audio nodes. All of these projects are licensed under permissive open‑source terms, include source code and documentation on GitHub, and can be run directly in any modern browser without additional plugins.

## Sources

### GitHub - GizzZmo/DJ: DJ is a Python-based mixer designed for seamless audio playback across multiple sound devices. Built for flexibility and performance, it enables users to mix tracks and output audio to several outputs simultaneously, making it ideal for DJs, audio engineers, and enthusiasts who need multi-device support. · GitHub
URL: https://github.com/GizzZmo/DJ
### 🔴 Recording and Export

`recording.py`

### 📋 Playlist Management

`playlist_manager.py`

### 📊 Visual Waveform Display

`waveform_display.py`

### 🌐 Web-Based Interface

`web_interface.py`

## Quick Start with New Features

### Using Enhanced Mixer

### Starting Web Interface

### Running Feature Demos

## Advanced Usage Examples

### Audio Effects Chain

### Beat Detection

### MIDI Control

## Testing

Run the comprehensive test suite:

## Project Structure (Updated) [...] `DJ/
├── dj_mixer.py # Core DJ mixer functionality
├── enhanced_mixer.py # 🆕 Enhanced mixer with all features
├── dj_gui.py # Graphical user interface
├── dj_cli.py # Interactive command-line interface
├── ai_dj_assistant.py # AI-powered mixing assistant
├── audio_effects.py # 🆕 Real-time audio effects (EQ, filters, reverb)
├── beat_detection.py # 🆕 Beat detection and auto-sync
├── midi_controller.py # 🆕 MIDI controller support
├── recording.py # 🆕 Recording and export functionality
├── playlist_manager.py # 🆕 Playlist management
├── waveform_display.py # 🆕 Waveform visualization
├── web_interface.py # 🆕 Web-based interface (Flask + WebSocket)
├── demo_features.py # 🆕 Comprehensive feature demonstrations
├── test_features.py # 🆕 Test suite for new features [...] | Name | | Name | Last commit message | Last commit date |
 ---  --- 
| .github | | .github |  |  |
| web/templates | | web/templates |  |  |
| .gitignore | | .gitignore |  |  |
| CONTRIBUTING.md | | CONTRIBUTING.md |  |  |
| FEATURES\_SUMMARY.md | | FEATURES\_SUMMARY.md |  |  |
| IMPLEMENTATION\_SUMMARY.md | | IMPLEMENTATION\_SUMMARY.md |  |  |
| LICENSE | | LICENSE |  |  |
| PYAUDIO\_ASIO\_IMPLEMENTATION.md | | PYAUDIO\_ASIO\_IMPLEMENTATION.md |  |  |
| README.md | | README.md |  |  |
| ai\_dj\_assistant.py | | ai\_dj\_a ...

### mixing-audio · GitHub Topics
URL: https://github.com/topics/mixing-audio?o=
100% browser-based & open source audio javascript. Offers full control over the execution of songs, jingles, and various content, audio mixer built around

### Medium
URL: https://medium.com/@mecreate/how-i-built-a-browser-based-beat-maker-from-scratch-using-nothing-but-vanilla-javascript-and-the-a87f2ee8c451
The result is WebChestra — a pure JavaScript, browser-based music mixer inspired by Incredibox and Sprunki Beats. Click emoji characters, layer instruments, build a beat. Zero dependencies.

## The Pain: Web Audio API Is Powerful but Unforgiving

Let me be honest about the journey. The Web Audio API is incredibly capable — but it’s also incredibly low-level. There’s no `playNote("C3")` function. There's no `createKickDrum()`. You get raw oscillators, gain nodes, and biquad filters. You are the synthesizer.

`playNote("C3")`
`createKickDrum()`

## Pain Point #1: Everything Is Frequencies

Want a bass note? You need to know that G2 is 98.00 Hz, C3 is 130.81 Hz, and D2 is 73.42 Hz. There’s no shortcut. You’re working with the physics of sound: [...] Sign up

Sign in

Sign up

Sign in

Unknown user

# How I Built a Browser-Based Beat Maker From Scratch Using Nothing But Vanilla JavaScript and the Web Audio API

Muhammetberdi Jepbarov

--

Listen

Share

AI Didn’t Want to Give Me Exact MIDI Notes — It Didn’t Know It Was Dealing With a Musician :D

Video Demo | Try It Yourself

There’s a moment every developer knows — the moment you discover something in the browser that makes you think “wait, you can do THAT?” For me, that moment was the Web Audio API.

I wanted to make music. Not by loading .mp3 files. Not by embedding SoundCloud players. I wanted the browser itself to synthesize sound from nothing — oscillators, noise, waveforms, frequencies. Real sound generation. No libraries, no frameworks, no external audio files. [...] The AI didn’t know it was dealing with someone who would actually listen to the output and know if it was wrong.

So I did what any stubborn musician-developer would do: I looked up the frequency tables myself, tuned by ear, iterated on patterns until t ...

### DJ23 - A casual two-deck DJ mixer that runs entirely in the ...
URL: https://www.reddit.com/r/coolgithubprojects/comments/1vr1ee3/dj23_a_casual_twodeck_dj_mixer_that_runs_entirely
I built a free, open-source web MIDI controller … a modular synth built on the Web Audio API (free, runs entirely in-browser) runs entirely in-

### GitHub - notthetup/awesome-webaudio: A curated list of awesome WebAudio packages and resources. · GitHub
URL: https://github.com/notthetup/awesome-webaudio
dsssp-demo - WebAudio music player with 7-bands EQ and filter presets.
 SingMeter – A collection of browser-based singing tools including a pitch detector and vocal range test.
 Drumhaus – a browser-based drum machine with step sequencing, pattern variations, and groove editing.
 All-in-One Advanced BPM Tool – Instantly measure song speed by tapping or using the spacebar. Features MIDI input, optional sound clicks, and real-time BPM visualization. Essential for producers, DJs, rhythm gamers.
 synflow Github - a browser based modular synth flow engine. With all Web Audio API nodes and more with Worklets (like Vocoder, Reverb, etc. ). With sophisticated Flow automation. [...] EarSketch - free educational programming environment to teach Python and Javascript through music composing and remixing
 webaudio-tinysynth - a small synthesizer written in JavaScript with GM like timbre map.
 web-audio-beat-detector - a beat detection utility which is using the Web Audio API
 web-audio-mixer - An audio mixer built using Web Audio.
 Audio-motion interface - A web synthesizer that generates sound using smartphone gestures in the space.
 Topos - A Web based live coding environment inspired by the Monome Teletype. Uses Web Audio and MIDI.
 Online Sequencer - A simple and easy-to-use sequencer with plenty of functionality, based around the Web Audio API.
 Binary Synth - A web-synthesizer that generates sound from the binary code of any files. [...] waveform-playlist - Multitrack Web Audio editor and player with canvas waveform preview. Set cues, fades and shift multiple tracks in time. Record audio tracks or provide audio annotations. Export your mix to AudioBuffer or WAV! Project inspired by Audacity.
 SoundCycle - A Web Audio based Loopstation for musicians with effects and different  ...

### Mixxx - Free DJ Mixing Software App
URL: https://mixxx.org
Mixxx Logo

## DJ Your Way

Free and open source DJ software for Windows, macOS, and Linux

 Mastodon
 Bluesky
 Facebook
 Zulip
 GitHub

## Powerful Features For All DJs

Mixxx integrates the tools DJs need to perform creative live mixes with digital music files.  
Whether you are a new DJ with just a laptop or an experienced turntablist, Mixxx can support your style and techniques of mixing.

BPM, Key Detection & Sync

##### BPM, Key Detection & Sync

BPM and musical key detection help you find the perfect next track from your library. Use Sync Lock to match the tempo and beats of four songs for seamless mixing.

DJ Controller Support

##### DJ Controller Support [...] ## Free & Open Source

Mixxx is free open-source software and entirely community-driven. There is no company behind Mixxx — the development is shouldered by passionate DJs and programmers that dedicate their free time to working on their favorite DJ software. Mixxx is and always will be free!

Download

Donate

Source Code

## Latest News

To see a list of all news and announcements, head over to our news page or subscribe to the Atom feed.

##### Introducing Mixxx e.V. - A Nonprofit Organization for the Community [...] You can get involved with Mixxx today by reporting bugs and suggesting features, making a controller mapping, adding features & fixing bugs, helping with translations, or working on one of our other starter tasks.

Mac App Store   
 #1 Top Free Mac App Worldwide  
 Mac App Store  
 February 2011

CNet

Computer Music  
 Free Pick of the Month  
 September 2007

Synthtopia   
 "The coolest open source  
application ever?"  
 February 2011

## Pages

 Overview
 Features
 Press
 Get Support
 Get Involved
 Donate

## Community

 Forums
 Mastodon Mastodon
 Facebook Facebook
 Zulip Zulip
 GitHu ...

### webaudioapi · GitHub Topics · GitHub
URL: https://github.com/topics/webaudioapi
## Navigation Menu

# webaudioapi

## Here are 106 public repositories matching this topic...

### scribbletune / scribbletune

Create music with JavaScript

### software-mansion / react-native-audio-api

High-performance audio engine for react-native

### GoogleChromeLabs / web-audio-samples

Web Audio API samples by Chrome Web Audio Team

JZZ

### jazz-soft / JZZ

MIDI library for Node.js and web-browsers

### benji6 / virtual-audio-graph

🎶 Library for declaratively manipulating the Web Audio API

### nextgtrgod / webaudio-synth

WebAudio Polyphonic Synthesizer

### escottalexander / simpleTones.js [...] ### escottalexander / simpleTones.js

The goal of simpleTones.js is to provide every JavaScript developer with a lightweight solution for creating custom sounds in their web applications. This documentation has been written in hopes that the least experienced developer can read, understand and go on to do great things. You can check out several examples at this link:

### sapphi-red / web-noise-suppressor

Noise suppressor nodes for Web Audio API.

### mikehelland / omg-music

Music making, remixing, and collaborating tools for the web

### ccrma / music220a

The code examples for Music 220A

Live-Audio-MFCC

### pulakk / Live-Audio-MFCC

Live Audio MFCC Visualization in the browser using Web Audio API - 

### shiehn / SignalsAndSorcery [...] ### shiehn / SignalsAndSorcery

A VueJS, WebAudioApi powered audio sample arrangement tool.

### pavle-goloskokovic / web-audio-unlock

🔊🔓 Unlocking Web Audio – the smarter way

### MD-AZMAL / Sharp-Tune

Lightweight Cross-platform music player build upon the node using the electron framework.

### ElizabethHudnott / sound-synth

Me building a simple synthesizer and sequencer to learn about Web Audio. Check out the wiki.

### ...

### webaudio · GitHub Topics · GitHub
URL: https://github.com/topics/webaudio
### quiet / quiet-js

Star  2.3k

Transmit data with sound using Web Audio -- Javascript binding for libquiet

webaudio emscripten data-transfer ultrasonic modem

 Updated Jul 1, 2021
 JavaScript

daw

### gridsound / daw

Star  1.9k

GridSound (2.59.3) is a work-in-progress free browser-based digital audio workstation following the Web Audio API 🎛🎹🎵✨ -- If you can, please sponsor us a little on our Patreon ❤️

audio music drums daw lfo webaudio synth web-audio digital-audio-workstation

 Updated Jul 28, 2026
 JavaScript

### naomiaro / waveform-playlist

Sponsor 

Star  1.7k [...] Updated Feb 7, 2026
 JavaScript

webaudio-examples

### mdn / webaudio-examples

Star  1.4k

Code examples that accompany the MDN Web Docs pages relating to Web Audio.

audio demo examples webaudio webaudio-api

 Updated May 5, 2026
 HTML

### notthetup / awesome-webaudio

Star  1.4k

A curated list of awesome WebAudio packages and resources.

audio list awesome midi webaudio awesome-list

 Updated Jun 5, 2026

### maximecb / noisecraft

Sponsor 

Star  1.2k

Browser-based visual programming language and platform for sound synthesis.

audio javascript music visual-programming-language midi webmidi sound webaudio synthesizer music-programming-language modular-synthesizers music-programming sound-synthesis

 Updated Sep 30, 2023
 JavaScript

### 2fps / recorder

Star  1.2k [...] Skip to content   
 

## Navigation Menu

Sign in

Appearance settings

Sign in

Sign up

Appearance settings

You signed in with another tab or window. Reload to refresh your session. You signed out in another tab or window. Reload to refresh your session. You switched accounts on another tab or window. Reload to refresh your session. Dismiss alert

{{ message }}

#

# webaudio

Star

## Here are 877 public reposito ...


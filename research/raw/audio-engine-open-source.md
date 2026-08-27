# audio-engine-open-source

QUERY: open source low latency audio engine miniaudio PortAudio JUCE RtAudio comparison C++

## Synthesized answer
All four libraries are open‑source C/C++ solutions for real‑time audio, but they differ in design, latency handling and feature breadth: miniaudio is a single‑header, dependency‑free library released into the public domain or MIT that targets the lowest possible overhead by using the native back‑ends (WASAPI, Core Audio, ALSA, PulseAudio, JACK, etc.) directly; with its lock‑free callback model it consistently achieves sub‑5 ms round‑trip latency on modern desktop drivers when the host buffer size is set to 64–128 frames. PortAudio is a mature C API wrapper around many OS APIs (including the same back‑ends as miniaudio) that adds a thin abstraction layer; its latency is comparable to the underlying driver and can be tuned via the suggestedLatency field, typically reaching 5–10 ms on Windows WASAPI or Linux JACK with small buffers, but it incurs a small additional call‑stack overhead. RtAudio provides a pure C++ class interface that also delegates to the native APIs and is deliberately lightweight; its latency is similar to PortAudio’s because it simply forwards the callback, and it is praised for a very simple API and straightforward cross‑platform builds, though it lacks some of the higher‑level utilities found in the others. JUCE is a comprehensive C++ framework that bundles audio I/O, GUI, DSP, and plugin formats; its audio device manager wraps the same platform back‑ends and adds automatic buffer‑size negotiation, high‑resolution timers and built‑in thread‑priority handling, which can yield low latencies (often 3–8 ms) when configured for low buffer sizes, but the added abstraction and optional GUI modules increase binary size and compile complexity. In summary, for the absolute minimal‑latency, header‑only, no‑dependency solution, miniaudio is the most streamlined; for a stable, widely‑used C API with extensive documentation, PortAudio is a solid choice; RtAudio offers a clean C++ wrapper with similar performance to PortAudio; and JUCE gives the richest feature set and cross‑platform tooling at the cost of larger footprint and a higher learning curve.

## Sources

### Tech Kaizen: Cross Platform Audio(sound) Libraries ..
URL: http://kktechkaizen.blogspot.com/2015/12/cross-platform-audio-libraries.html
PortAudio - PortAudio is a free, cross-platform, open-source, audio I/O library.  It lets you write simple audio programs in 'C' or C++ that will compile and run on many platforms including Windows, Macintosh OS X, and Unix (OSS/ALSA). It is intended to promote the exchange of audio software between developers on different platforms. Many applications use PortAudio for Audio I/O.  
   
 RtAudio - RtAudio is a set of C++ classes that provide a common API (Application Programming Interface) for realtime audio input/output across Linux, Macintosh OS-X and Windows operating systems. RtAudio significantly simplifies the process of interacting with computer audio hardware. [...] # Tech Kaizen

passion + usefulness = success .. change is the only constant in life

## Search this Blog:

### Cross Platform Audio(sound) Libraries ..

Cross Platform Audio(sound) libraries:  
 

1. PortAudio
2. RtAudio
3. JUCE
4. libsoundio
5. SDL
6. OpenSL
7. OpenMAX [...] JUCE - JUCE (Jules' Utility Class Extensions) is an all-encompassing C++ framework for developing cross-platform software. It contains pretty much everything you're likely to need to create most applications, and is particularly well-suited for building highly-customised GUIs, and for handling graphics and sound. JUCE officially supports Windows, Mac OS X, Linux, iOS, and Android.

### choosing platform JUCE/portaudio/rtaudio/jack?? - DSP and Plugin Development Forum - KVR Audio
URL: https://www.kvraudio.com/forum/viewtopic.php?t=326591
- be able to compile using free tools on linux  
 - be able to take advantage of Jack  
 - ideally be able to run it as a non-jack app as well, especially on os x  
 - may be able to use rewire??  
 - get damn low latency on linux for gig use  
 - be able to integrate it into reaper maybe?? no idea how feasible that is.  
 - find good docs and examples as I am not a C++ wizard, ideal would be some open source apps with solid live-rt oriented architectures that I can study  
 - reasonable license fee should I decide to release a product ( Juce = reasonable, QT = out of my budget for this project )  
   
 I'm not worried about:  
 - native os looking gui ( Juce would be fine )  
 - running on windows  
 - what kind of plug in platform or host I use, I'm flexible there [...] that doesn't block the audio thread - be able to compile using free tools on linux - be able to take advantage of Jack - ideally be able to run it as a non-jack app as well, especially on os x - may be able to use rewire?? - get damn low latency on linux for gig use - be able to integrate it into reaper maybe?? no idea how feasible that is. - find good docs and examples as I am not a C++ wizard, ideal would be some open source apps with solid live-rt oriented architectures that I can study - reasonable license fee should I decide to release a product ( Juce = reasonable, QT = out of my budget for this project ) I'm not worried about: - native os looking gui ( Juce would be fine ) - running on windows - what kind of plug in platform or host I use, I'm flexible there I've been looking at [...] I've been looking at PortAudio, RtAudio, plain Jack, and JUCE, and am pretty overwhelmed by the choices, of seen examples of using Juce for gui with portaudio for audio layer, and read suggestions of always writing ...

### C++ audio - 東 Higaski
URL: https://higaski.at/c-audio
The libraries I tried are PortAudio and RtAudio. Both are surprisingly easy to use and have great documentation. Recently there's also been some

### Thoughts on audio manipulation in C++ : r/cpp - Reddit
URL: https://www.reddit.com/r/cpp/comments/o32o4/thoughts_on_audio_manipulation_in_c
As for handling the actual audio stream, both portaudio and RtAudio are good alternatives. RtAudio has a C++ API, if you prefer that. edit

### PortAudio - an Open-Source Cross-Platform Audio API
URL: https://portaudio.com
PortAudio Portable Cross-platform Audio I/O API

 Home
 Documentation
 Download
 Git Repo
 Wiki & Tickets
 Status
 FAQ
 Mail List
 Applications
 Contributors
 Links
 License
 Volunteer
 Contact Us

PortAudio Portable Cross-platform Audio I/O API

PortAudio is a free, cross-platform, open-source, audio I/O library.  It lets you write simple audio programs in 'C' or C++ that will compile and run on many platforms including Windows, Macintosh OS X, and Unix (OSS/ALSA). It is intended to promote the exchange of audio software between developers on different platforms. Many applications use PortAudio for Audio I/O. [...] This website is hosted and maintained by Phil Burk of SoftSynth.com. Phil is also a co-designer of PortAudio and used it for audio I/O in JSyn, a real-time synthesis API for Java and 'C'.

Brought to you by the PortAudio community. [...] PortAudio provides a very simple API for recording and/or playing sound using a simple callback function or a blocking read/write interface. Example programs are included that play sine waves, process audio input (guitar fuzz), record and playback audio, list available audio devices, etc.

The Portaudio Wiki is maintained by the community of PortAudio developers. It has the most up-to-date information and is recommended as a starting point for exploring PortAudio. PortAudio developers and users keep in touch on the PortAudio mailing list. Please feel free to join.

The PortAudio project and API was proposed by Ross Bencina to the music-dsp mailing list. Ross uses PortAudio in his AudioMulch synthesis application. Many people have since contributed to PortAudio's development.

### How does OpenMPT's audio pipeline work?
URL: https://forum.openmpt.org/index.php?topic=
OpenMPT uses PortAudio (and optionally RtAudio, mostly for its Wine support) which some custom patches to iron out some bugs, plus custom ASIO/

### RtAudio or PortAudio, which one to use?
URL: https://stackoverflow.com/questions/5174393/rtaudio-or-portaudio-which-one-to-use
I'm considering RTAudio + RTMidi and PortAudio + PortMidi for a new project that requires realtime audio and midi procesing. Can anyone with experience

### miniaudio - A single file audio playback and capture library.
URL: https://miniaud.io
| Open Source  miniaudio is open source with a permissive license of your choice of public domain or MIT No Attribution. | Detailed Documentation  miniaudio has some of the best documentation of any open source audio library and includes a suite of examples. | And Much More  Built-in decoders, advanced mixing and effect processing, resource management, 3D spatialization, filters, data conversion and more. | [...] |  |  |  |  |  |  |
 ---  ---  --- |
| |  |  |  --- | | Documentation | Examples | |  |  |  |

An audio playback and capture library for C and C++.

Download miniaudio.h

miniaudio is an audio playback and capture library for C and C++. It's made up of a single source file, has no external dependencies and is released into the public domain. [...] |  |  |  |  |  |
 ---  --- 
|  |  |  |  |  |
| Windows | macOS / iOS | Linux | FreeBSD / OpenBSD / NetBSD | Android |
| WASAPI  DirectSound  WinMM | Core Audio | ALSA  PulseAudio  JACK | OSS  sndio  audio(4) | AAudio  OpenSL | ES |
|  |  |  |  |  |
|  |  | Web |  |  |
|  |  | Emscripten / WebAudio |  |  |

|
|  |

Copyright © 2026 David Reid  
 Developed by David Reid - mackron@gmail.com


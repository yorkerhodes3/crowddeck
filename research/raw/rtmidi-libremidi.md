# rtmidi-libremidi

QUERY: RtMidi libremidi JUCE midi library cross platform C++ open source comparison

## Synthesized answer
RtMidi is a lightweight, header‑only C++ library that provides a simple object‑oriented API for real‑time MIDI input and output on Linux (ALSA and JACK), macOS (CoreMIDI and JACK), Windows (Multimedia and UWP), iOS, Android and WebMIDI; it is released under a permissive BSD‑style license, focuses on minimal dependencies, enumerates devices by numeric IDs and historically lacked built‑in MIDI 2 support, but its straightforward design makes it easy to embed in small projects. libremidi is a modern rewrite derived from RtMidi and ModernMIDI that targets C++20, adds comprehensive MIDI 2 handling on macOS (11+), Linux (kernel 6.5+), and Windows 11 (or Windows 10 with the new MIDI Services), and introduces features such as hot‑plug aware observers, stable handle‑based port identification, reduced virtual‑function overhead, optional static‑ or small‑vector message storage for hard‑real‑time use, nanosecond timestamps, and full WebMIDI support; it is also open source (MIT‑like) and ships with extensive documentation and a modular CMake build. JUCE is a full‑featured, cross‑platform C++ framework that includes a robust MIDI module offering classes for MIDI message handling, device enumeration, virtual ports, MIDI file I/O, and integration with its audio and GUI subsystems; JUCE’s MIDI support covers CoreMIDI, ALSA, JACK, and Windows MM/UM, works on desktop, iOS, Android and WebAssembly, is released under the GPLv3 with a commercial license option, and while it does not yet provide native MIDI 2 APIs, its high‑level abstractions, real‑time safety, and tight coupling with audio processing make it the most comprehensive solution for applications that already use JUCE’s broader toolset. In summary, RtMidi is the most minimal and widely compatible option for basic MIDI 1 tasks; libremidi builds on that foundation with modern C++20 features, MIDI 2 support, and performance optimizations; and JUCE offers the richest ecosystem and higher‑level MIDI utilities at the cost of a larger framework and a dual‑licensing model.

## Sources

### How to write a MIDI librarian program?
URL: https://gearspace.com/threads/how-to-write-a-midi-librarian-program.974106
For MIDI you could. The RtMidi Tutorial. Check out JUCE, it's a great C++ library (cross-platform, open source). The framework provides MIDI and GUI.

### Foreword - libremidi documentation
URL: https://celtera.github.io/libremidi
## Keyboard shortcuts

Press `←` or `→` to navigate between chapters

Press `S` or `/` to search in the book

Press `?` to show this help

Press `Esc` to hide this help

# libremidi documentation

# Funky MIDI with libremidi

libremidi is an all-in-one cross-platform C++20 MIDI library for both file and real-time output. Real-time I/O supports MIDI 2 on macOS (11+) and Linux (Kernel 6.5+), and on Windows (currently on Windows 11 Insiders builds or Windows 10 with an explicit install of the new Windows MIDI Services).

It is a fork / rewrite originally based on two libraries, but has since then been almost entirely rewritten:

 RtMidi
 ModernMIDI

Compared to its origins, it features a lot of changes and improvements: [...] `libremidi::observer` allows to enumerate MIDI devices and provides hotplug support on every back-end.
 Ports are identified not with a number but with a handle which enables more stability when unplugging / replugging.
 Memory allocations and virtual function calls are greatly reduced when compared to the RtMidi base-line.
  + Ability to enforce fixed message sizes with boost::static\_vector for hard real-time operation
  + Ability to use boost::small\_vector to cover most cases. [...] Integer timestamps everywhere, by default in nanoseconds. This avoids precision issues for instance when doing precise computations over long-running art installations mixing short and long timescales: in double-precision, the assertion “number of nanoseconds in a year + 1 == number of nanoseconds in a year” holds.
 Ability to choose different timestamping methods (e.g. relative, absolute monotonic clock, sample-based or custom timestamping…).
 Integration of modern C++20 types (for instance std::span instead of std::vector, std::function for callbacks, etc.)
 Standard ...

### GitHub - celtera/libremidi: A modern C++ MIDI 1 / MIDI 2 real-time & file I/O library. Supports Windows, macOS, Linux and WebMIDI. | Jean-Michaël Celerier
URL: https://www.linkedin.com/posts/jcelerier_github-celteralibremidi-a-modern-c-activity-7346916741060444162-m7MN
Agree & Join LinkedIn

By clicking Continue to join or sign in, you agree to LinkedIn’s User Agreement, Privacy Policy, and Cookie Policy.

# Jean-Michaël Celerier’s Post

View profile for Jean-Michaël Celerier

I'm excited to share the latest release of #libremidi, a cross-platform open-source C++20 library which enables a new generation of apps to support #MIDI and #MIDI2 on all major platforms: Windows, macOS, Linux, BSD, and Emscripten.
Grab it here! 
It is built with real-world audio development in mind from years of experience developing audio software: MIDI shouldn't be the hard part of your project!
 #cpp #midi #audio #realtime #crossplatform #opensource #cpp20 #audiodevelopment #tech #innovation #proaudio #mididevelopment #synthesizers [...] GitHub - celtera/libremidi: A modern C++ MIDI 1 / MIDI 2 real-time & file I/O library. Supports Windows, macOS, Linux and WebMIDI.

Zakaria Jaiathe, graphic

Sjef V.

To view or add a comment, sign in

Jean-Michaël Celerier

3,131 followers

## Explore content categories

## Sign in to view more content

Create your free account or sign in to continue your search

or

New to LinkedIn? Join now

By clicking Continue to join or sign in, you agree to LinkedIn’s User Agreement, Privacy Policy, and Cookie Policy.

LinkedIn

Never miss a beat on the app

Don’t have the app? Get it in the Microsoft Store.

### GitHub - celtera/libremidi: A modern C++ MIDI 1 / MIDI 2 real-time & file I/O library. Supports Windows, macOS, Linux and WebMIDI. · GitHub
URL: https://github.com/celtera/libremidi
## Repository files navigation

# libremidi

Build status

Build status

Packaging status

Packaging status

libremidi is a cross-platform C++20 library for real-time and MIDI file input and output.

This is a fork / rewrite based on two libraries:

Additionnally, for MIDI 2 parsing support we use cmidi2!

Read the documentation here.

## Citation

If you use this work as part of academic research, please kindly cite the paper:

## Changelog

### Since v5.4

`import libremidi;`
`-DLIBREMIDI_LIBRARY_MODE=MODULE`
`examples/modules.cpp`
`libremidi::set_client_name`
`client_name`
`port_information`
`input_port`
`output_port`
`<libremidi/port_comparison.hpp>`
`libremidi::find_closest_port(query, existing_ports)`

### Since v5.3

### Since v5.2

### Since v5.1

### Since v5 [...] ### Since v5.2

### Since v5.1

### Since v5

`libremidi::port_information`

### Since v4.5

### Since v4.4

`track_any`

### Since v4.3

`Custom`
`midi_in::absolute_timestamp()`

### Since v4.2

`dlopen`
`libasound`

### Since v4

`-DLIBREMIDI_SLIM_MESSAGE=<NBytes>`

### Since v3

`span`
`(uint8_t bytes, std::size_t size)`

### Since v1

`std::function`
`boost::small_vector`
`std::vector`
`snake_case`

#### New & improved backends

## Roadmap

# They use this library

## About

A modern C++ MIDI 1 / MIDI 2 real-time & file I/O library. Supports Windows, macOS, Linux and WebMIDI.

### Topics

### Resources

### Stars

### Watchers

### Forks

## Releases

## Sponsor this project

## Packages

## Used by

## Contributors

## Languages

## Footer

### Footer navigation [...] ## Latest commit

## History

## Folders and files

| Name | | Name | Last commit message | Last commit date |
 ---  --- 
| .github | | .github |  |  |
| .well-known | | .well-known |  |  |
| bindings/python | | bindings/python |   ...

### The RtMidi Tutorial
URL: https://caml.music.mcgill.ca/~gary/rtmidi
# Introduction

RtMidi is a set of C++ classes (RtMidiIn, RtMidiOut and API-specific classes) that provides a common API (Application Programming Interface) for realtime MIDI input/output across Linux (ALSA & JACK), Macintosh OS X (CoreMIDI & JACK), Windows (Multimedia Library & UWP), Web MIDI, iOS and Android systems. RtMidi significantly simplifies the process of interacting with computer MIDI hardware and software. It was designed with the following goals:

 object oriented C++ design
 simple, common API across all supported platforms
 only one header and one source file for easy inclusion in programming projects
 MIDI device enumeration

Where applicable, multiple API support can be compiled and a particular API specified when creating an RtAudio instance. [...] ## Linux:

RtMidi for Linux was developed using the Fedora distribution. Two different MIDI APIs are supported on Linux platforms: ALSA and JACK. A decision was made to not include support for the OSS API because the OSS API provides very limited functionality and because ALSA support is now incorporated in the Linux kernel. The ALSA sequencer and JACK APIs allows for virtual software input and output ports.

## Macintosh OS X (CoreAudio):

The Apple CoreMIDI API allows for the establishment of virtual input and output ports to which other software applications can connect.

The RtMidi JACK support can be compiled on Macintosh OS-X systems, as well as in Linux.

## Windows (Multimedia Library):

The `configure` script provides support for the MinGW compiler. [...] |  |  |  |  |  |
 ---  --- 
| OS: | MIDI API: | Preprocessor Definition: | Library or Framework: | Example Compiler Statement: |
| Linux | ALSA Sequencer | LINUX\_ALSA | `asound, pthread` | `g++ -Wall -D__LINUX_ALSA__ -o midiprobe midiprobe.cpp RtM ...

### Recommendations for C++ audio library (with focus on Midi)
URL: https://www.reddit.com/r/cpp/comments/krvugb/recommendations_for_c_audio_library_with_focus_on
JUCE already has numerous classes to handle the fundamentals of MIDI. Your challenge is not about MIDI - it's about music theory and classifying

### Just learned about libremidi — a modern MIDI library ...
URL: https://x.com/_kzr/status/1915741298306531549
a modern MIDI library inspired by RtMidi. RtMidi now supports iOS and Android. A modern C++ MIDI … real-time & file I/O library.

### Where can I find a list of all the C++ libraries available in Juce (and 3rd party ones that work well with it)? - Getting Started - JUCE
URL: https://forum.juce.com/t/where-can-i-find-a-list-of-all-the-c-libraries-available-in-juce-and-3rd-party-ones-that-work-well-with-it/43671
thanks… that looked like a promising one, but as you say it seems to be audio not midi.

I’ll still look out for more 3rd party libs especially for midi stuff like chord detection etc. I’d be willing to pay; not just looking for open source stuff. If I can saw time not reinventing the wheel, then all the better.

There’s a library called Superpowered, but then I’d have to integrate that with Juce, and I think there would be some work to do there.

### Related topics [...] # Where can I find a list of all the C++ libraries available in Juce (and 3rd party ones that work well with it)?

Just trying to find out whats included in Juce and a list of C++ libraries it has available.

Also, wondering about other C++ libraries that work well with Juce…  
Don’t want to reinvent the wheel - am willing to pay for such libraries.  
Mainly looking for Midi handling libs.

There’s lots of MIDI handling classes in Juce - you won’t need to go elsewhere. Just check out the classes in the documentation.

thanks  
what about more developed libraries, for example, is there a library detects chord or detects what scale its in if you pass it the Midi buffer?

there was a discussion about that on the forum the other day iirc - have a search. [...] I started a thread a couple of days ago and didn’t really get a response.  
I did search for other threads - there’s one from October and one guy replied and said he basically wrote the code himself to detect chord and scale. So I’m thinking that there are no developed libraries in Juce that can already do this.

I did look at the classes documentation and did a search on midi and found some low level stuff but nothing in terms of what I’m looking for.

yes, there’s nothing in Juce for detecting stuff like that. i didn’t realise it was you that start ...


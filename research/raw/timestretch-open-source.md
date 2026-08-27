# timestretch-open-source

QUERY: open source time stretching pitch shifting Rubber Band SoundTouch elastique license

## Synthesized answer
Rubber Band is an open‑source audio time‑stretching and pitch‑shifting library released under the GNU GPL (v2 or later), which means you can use and modify it freely in GPL‑compatible projects but must distribute any derived work under the same license; for proprietary or App‑Store distribution a commercial licence (often sold for a few hundred dollars for unlimited use) is required. SoundTouch is also open source but uses a permissive license (LGPL‑2.1 with a static‑link exception that effectively allows commercial use without open‑sourcing your code, provided you honor the attribution and source‑availability requirements for the library itself). Elastique, by Z‑Plane, is not open source at all—it is a proprietary, commercial‑only product with a relatively high licensing cost and no free version, so it can only be used under a paid licence.

## Sources

### Pitch Shift/Slow Down Algorithms - General JUCE discussion - JUCE
URL: https://forum.juce.com/t/pitch-shift-slow-down-algorithms/19219
# Pitch Shift/Slow Down Algorithms

Hey guys,

It seems no one has really made any open source slow-down/pitch shifting algorithms. Of course there is SoundTouch, but the results are ok. Then one can license the others but very expensive.

Is good audio pitch shifting and slow down that hard?

Last time I checked Sooundtouch was the only unrestrictive algorithm. But I am thinking about licencing Rubberband. Its GPL with a reasonable commercial licence (something around 400$ for unlimited usage).

It may not be as sparkling as elastique but for occasional time stretching tasks it should be OK. Plus the API is pretty clear and there is a demo app which you can evaluate pretty easily.

And it’s fairly hard :wink: I’m sure there a load of papers on the topic, search for WSOLA and PSOLA. [...] Actually, I reckon that the licence fees for the ‘big guys’ like ZPlane are still cheaper than the cost to yourself (assuming you like paying yourself a respectable wage) to create something of a similar quality. Elastique is a long way ahead of things like SoundTouch. Not that I mean that as an insult to SoundTouch. We use it and have a licensing agreement with Olli, the developer behind it.

Here is a decent open source algorithm:

(BTW in its raw for that’s quite slow)

Out of curiosity…What makes it hard?

I am an engineer, but I have been more on the marketing sales side as I don’t have time for the core DSP side. [...] I am currently using SuperpoweredSDK on my audio processing app but the sound quality after time stretching is really bad even when you increase to 20% or decrease to 20%. I am looking for how to fix this as I have seen many audio apps that handles Time stretching 100% tempo increase / decrease perfectly. Please is there any iOS/Android Developers that you can sugg ...

### GitHub - breakfastquay/rubberband: Official mirror of Rubber Band Library, an audio time-stretching and pitch-shifting library. · GitHub
URL: https://github.com/breakfastquay/rubberband
## Licence

Rubber Band Library is distributed under the GNU General Public License (GPL). You can redistribute it and/or modify it under the terms of the GPL; either version 2 of the License, or (at your option) any later version. See the file COPYING for more information.

If you wish to distribute code using Rubber Band Library under terms other than those of the GNU General Public License, you must obtain a commercial licence from us before doing so. In particular, you may not legally distribute through any Apple App Store unless you have a commercial licence. See  for licence terms. [...] ### Resources

GPL-2.0 license

### Contributing

Custom properties

### Stars

773 stars

### Watchers

23 watching

### Forks

123 forks

Report repository

## Used by

You can’t perform that action at this time. [...] If you have obtained a valid commercial licence, your licence supersedes this README and the enclosed COPYING file and you may redistribute and/or modify Rubber Band under the terms described in that licence. Please refer to your licence agreement for more details.

Rubber Band includes a .NET interface generously contributed by Jonathan Gilbert under a BSD-like licence. The files in the `dotnet/rubberband-dll` and `dotnet/rubberband-sharp` directories fall under this licence. If you make use of this interface, please ensure you comply with the terms of its licence.

### Rubber Band Audio Time Stretcher Library
URL: https://breakfastquay.com/rubberband
Rubber Band Library is open source software under the GNU General Public License. If you want to distribute it in a proprietary commercial application, you need to buy a licence. Read more about this.

 Particular Programs Ltd, 2025
 Breakfast Quay
 News
 RSS/Atom
 Contact us
  
 This page does not use cookies. [...] Why choose Rubber Band Library? Find out here.

25th October, 2024: Rubber Band Library v4.0 released!   
This is a major release with a new simplified pitch-shifting API. Read the announcement.

### Download and Use

|  |

| Rubber Band Library v4.0.0 source code Download the source release |
| Documentation Code documentation, technical notes, and integration advice |
| Rubber Band Library v4.0.0 command-line utility Windows executable for the Rubber Band utility program |
| Rubber Band Library v4.0.0 command-line utility macOS binary executable for the Rubber Band utility program |
| Visit the Rubber Band Library code project Including source code browser and issue tracker |

### Buy a Commercial Licence

|  |

| Buy now! Read about commercial licence options and buy a licence here. | [...] # Rubber Band Library

« Home

## Make your audio applications stretchier than ever

Rubber Band Library is a high quality software library for audio time-stretching and pitch-shifting. It permits you to change the tempo and pitch of an audio stream or recording dynamically and independently of one another.

Rubber Band Library is a C++ library intended for use by developers creating their own application programs. It can be integrated into apps for any desktop or mobile platform. It also includes a simple, free command-line utility that you can use to make adjustments to the speed and pitch of existing audio files.

Why choose Rubber Band Library? Find out here.

### Rubberband timestretch & pitch shift | Tool
     | Renoise
URL: https://www.renoise.com/tools/rubberband-timestretch-pitch-shift
We can't find the internet

Attempting to reconnect

Something went wrong!

Hang in there while we get back on track

# Rubberband timestretch & pitch shift by Suva

The Rubberband Timestretch/Pitch-shift Tool brings Time Stretching and Pitch Shifting features to the Sample Editor.

Inserts “Timestretch…” and “Pitch Shift…” entries into the Process submenu in the Sample Editor.

Allows the user to make precise time corrections to the samples to match the song tempo, or to create interesting effects like pad instruments from short stab sounds. The program uses open source Rubberband library, Windows and mac binaries, on Linux, the rubberband utility must be installed manually by issuing a command “apt-get install rubberband-cli” or what ever equivalent of your system. [...] Rubberband is distributed under the terms of GPL and can be downloaded from 

v0.7 upgrades rubberband binaries to latest upstream version.

v0.8 Fixes a issue with too long stretch warning

## External Links

## Downloads

youtube
x
facebook
reddit
soundcloud
tumblr

### Free, Open-Source Audio Time-Stretching and Pitch-Shifting
URL: https://superpowered.com/free-open-source-time-stretching-pitch-shifting
Patrick Vlaskovits

Follow @Pv

Audio time-stretching is one of the most complex audio processing tasks, and as such, is incredibly hard to create from scratch. It’s not something one developer can quickly code, which is why they will search the internet for free, open source audio time-stretching and pitch-shifting solutions first.

The two most promising and often cited findings are Rubber Band and SoundTouch. Let's take a look at their pros and cons, and then compare Superpowered’s Time Stretching and Pitch-Shifting to those.

## Rubber Band Library [...] There are basically two kinds of time-stretching methods: time-domain and frequency domain. The aforementioned Rubber Band (and all quality commercial audio libraries) work in the frequency domain for highest audio quality.

Time-domain stretching works with overlapping windows, providing absolutely no “phasiness” with the cost of missing or doubling some parts of the audio, which sounds strange. And, even if you handle transients somehow, the overall result sounds too “compressed”.

SoundTouch does not handle transients, so it doesn’t work for most modern music, unfortunately. A prominent unwanted audio artifact is oddness with drum kicks. It either misses them completely or doubles them.

You can learn more here. [...] ## Rubber Band Library

This is a big library with lots and lots of code inside. The audio quality is great, as the author did a solid job researching audio algorithms. It handles audio transients well (not losing them) and does a great job in preserving audio quality (reducing so-called “phasiness”).

But the digital signal processing work is not stellar, Rubber Band’s CPU load is so high that you cannot run it on a mobile device for real-time processing, even if you try to utilize every DSP hack a ...

### FreshPorts -- audio/rubberband: Audio time-stretching and pitch-shifting library and utility program
URL: https://www.freshports.org/audio/rubberband
| |  |  | Port details | | rubberband Audio time-stretching and pitch-shifting library and utility program  4.0.0 audio on this many watch lists=1 search for ports that depend on this port Find issues related to this port Report an issue related to this port View this port on Repology. pkg-fallout 4.0.0Version of this port present on the latest quarterly branch.  Maintainer: acm@FreeBSD.org search for ports maintained by this maintainer  Port Added: 2012-02-07 06:38:13  Last Update: 2026-02-02 18:16:05  Commit Hash: 78992d8  People watching this port, also watch:: foot, spotify-player, sway, sd, libva-intel-driver to UHD 630 (Gen9.5)")  License: GPLv2  WWW:    Description:  Rubber Band Library is a high quality software library for audio time-stretching and pitch-shifting. It permits you [...] audio time-stretching and pitch-shifting. It permits you to change the tempo and pitch of an audio stream or recording dynamically and independently of one another.  Homepage    cgit ¦ Codeberg ¦ GitHub ¦ GitLab ¦ SVNWeb   Manual pages:  FreshPorts has no man page information for this port.  pkg-plist: as obtained via: `make generate-plist`  Expand this list (25 items)  Collapse this list.  1. @ldconfig 2. /usr/local/share/licenses/rubberband-4.0.0/catalog.mk 3. /usr/local/share/licenses/rubberband-4.0.0/LICENSE 4. /usr/local/share/licenses/rubberband-4.0.0/GPLv2 5. bin/rubberband 6. bin/rubberband-r3 7. include/rubberband/RubberBandLiveShifter.h 8. include/rubberband/RubberBandStretcher.h 9. include/rubberband/rubberband-c.h 10. lib/ladspa/ladspa-rubberband.cat 11. [...] of these commands:   `pkg install audio/rubberband`  `pkg install rubberband`  NOTE: If this package has multiple flavors (see below), then use one of them instead of the name specified above.  PKGNAME: rubberban ...

### (Deleted) - Other Gear - Elektronauts
URL: https://www.elektronauts.com/t/deleted/207439
OM connection with IRCAM SuperVP signal processing kernel - GitHub - openmusic-project/OM-SuperVP: OM connection with IRCAM SuperVP signal processing kernel

or the “Rubber Band” Library

### GitHub - breakfastquay/rubberband: Official mirror of Rubber Band Library, an...

Official mirror of Rubber Band Library, an audio time-stretching and pitch-shifting library. - GitHub - breakfastquay/rubberband: Official mirror of Rubber Band Library, an audio time-stretching an...

or the “Sound Touch” Library

### GitHub - VinMing/soundtouch: an open-source audio processing library that allows...

an open-source audio processing library that allows changing the sound tempo, pitch and playback rate parameters independently from each other - GitHub - VinMing/soundtouch: an open-source audio p... [...] look for “paulstretch”. Which is an algorithm but also there are plugins that do super stretch with it, not sure if that sound coming of that algo is what you are looking for.

or

### Release v2.2-3 · akx/paulstretch

s/tag/v2.2-3

Now with macOS Catalina build.
⚠️ The build is unsigned, so you will need to right-click the .app file, option-click Open and choose to open anyway.

or for nerds in code

### GitHub - paulnasca/paulstretch\_cpp: PaulStretch

PaulStretch. Contribute to paulnasca/paulstretch\_cpp development by creating an account on GitHub.

Reaper has both SoundTouch and Rubber band and other implementations readily available.

PaulStretch is a bit of stretch… It’s more a sound design tool for heavy changes of a sound (or gimmick in some people’s opinion)

### Does anyone know what technologies are currently available for pitch-shifting without quality loss? - Development - JUCE
URL: https://forum.juce.com/t/does-anyone-know-what-technologies-are-currently-available-for-pitch-shifting-without-quality-loss/67351
There’s pros and cons to each, and your choice will depend on your needs and budget. I’ve used Rubber Band (which I found good for offline renders) and Signalsmith Stretch (which is flexible and free). Elastique is considered to be the industry standard and is very good. I’m not a fan of their licensing, but it’s still probably the best option if you have the budget for it.

If you’re any good with math, you can implement one yourself: [...] This algorithm (PVDR) is more or less state-of-the-art. I’m sure Elastique and other algorithms have further refinements, but PVDR is simple, general-purpose, and realtime while still sounding great on almost all content. My first big DSP project was implementing a phase vocoder—you learn a ton, and it’s very gratifying when the algorithm you use was written by hand.

If you’re in a time crunch or need the absolute best quality, I second the recommendations made by @icebreakeraudio.

You could also consider Bungee (and Bungee Pro).

@officialnsa Bungee builds upon similar methods as PVDR (phase vocoder done right) and is free / open source. [...] #### include/PitShift.h

`master`
`#ifndef STK_PITSHIFT_H
#define STK_PITSHIFT_H
#include "Effect.h"
#include "DelayL.h"
namespace stk {
//
/! \class PitShift
\brief STK simple pitch shifter effect class.
This class implements a simple pitch shifter
using a delay line.
by Perry R. Cook and Gary P. Scavone, 1995--2023.
/
//
const int maxDelay = 5000; //5024;`

There’s three main libraries I know of for this:  
Rubber Band  
zplane ELASTIQUE  
Signalsmith Stretch


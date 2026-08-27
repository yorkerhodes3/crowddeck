# verify-mixxx-stems

QUERY: Mixxx 2.6 stems support release notes NI stem format what is new

## Synthesized answer
Mixxx 2.6 adds full‑scale STEM mixing support built on Native Instruments’ open‑specification stem format, allowing users to load, mute, solo, gain‑adjust and apply effects to individual stems in real time; the implementation extends the original NI spec by accepting any codec Mixxx already supports (AIFF, MP3, Opus, WAV, WV, etc.) as long as the same codec, sample‑rate and stereo layout are used across all four stems, and it brings a suite of new engine‑level features such as native file and engine support for stems, multithreaded scaling, analyser integration, per‑stem gain control, quick FX, and (in the upcoming beta) loading stems as samplers and UI enhancements, while further plans include deck‑splitting functionality.

## Sources

### GSoC 2024: Adding STEM mixing support
URL: https://mixxx.org/news/2024-08-26-stem-mixing
Now, with Stem Mixing in Mixxx, you can take that same level of control into your DJ sets. Built on top of Native Instrument' Open Specification This feature enables you to isolate and manipulate these elements in real-time, allowing for live remixing, mashups, and creative edits on the fly. Whether you’re blending two tracks together or creating entirely new soundscapes, Stem Mixing offers a new dimension of flexibility and creativity for your performances.

Mixxx now supports Native Instruments stem files, the current public specification for this format. Whether you're an amateur DJ eager to experiment with new techniques or a professional looking to enhance your performances, Stem Mixing in Mixxx offers powerful new capabilities to elevate your mixes. [...] ## Empowering open standards

Over the past few years, many DJing solutions have introduced their own proprietary standards for stems. While most of these formats can be reverse-engineered with relative ease, we wanted to support and encourage the open-source approach introduced by Native Instruments. We've extended the scope of that standard in Mixxx, allowing for more flexibility in audio formats. Unlike the original specification, which only supported AAC and ALAC, Mixxx now supports a broader range of codecs. These include all the formats already compatible with Mixxx, such as AIFF, MP3, Opus, WAV, and WV. The only requirement is to use the same codec across all stems, keep the sample rate consistent parameter and use stereo. [...] |
|  |
| File support | Releasing in 2.6 | PR #13044 |
| Engine support | Releasing in 2.6 | PR #13070 |
| Multithreaded scaling | Releasing in 2.6 | PR #13143 |
| Analyser support | Releasing in 2.6 | PR #13106 |
| Gain control | Releasing in 2.6 | PR #13086 |
| Quick FX | Releasi ...

### Stems feature is finally added to my mapping for Mixxx.
URL: https://www.facebook.com/groups/471353249547944/posts/24698381563085108
About the stems, please note it is a new feature from Mixxx beta 2.6. If you install the stable version 2.5.1, they won't be available.

### Stem files using an open format - General Discussion - Mixxx
URL: https://mixxx.discourse.group/t/stem-files-using-an-open-format/33338
Currently the idea is to support both FLAC and Opus encoded stems. To do this either an Ogg or Matroska wrapper would be used (I haven’t figured out if there are any constraints that would make one desirable over the other yet, but my initial definition uses Ogg). There are a handful of open questions mentioned in the Internet Draft (I-D) linked below, but the main one is how to store per-stem and global metadata if using Ogg, and how the DSP should work (I’m assuming NI bundles their own specific DSP and the parameters in their JSON blob correspond to that, but that’s likely not an option here; since this is supposed to be a clean room stem format I haven’t read their spec to check). [...] # Stem files using an open format

Hi all,

This may only be of interest to the developers among us, but I’ve recently been experimenting with a format for stem files that works similar to the one used by the Native Instruments files supported by Mixxx 2.6+. The difference being that mine uses only freely available, non-patent-encumbered formats. [...] It seems to me that a nice path forward might be to ask NI for permission to release their MP4 stems container format as a CC0 or similar document. And then work on an open DSP solution. The audio format seems like it would be trivial, but perhaps it’s not? Just a matter of specifying that any format of audio can be supported by open-stems. I suppose the issue there is differentiating players that support only NI-stems in AAC/ALAC format; and ensuring no confusion with open-stems in Ogg, etc, format. Having DJs getting confused and trying to load stems into Traktor that aren’t compatible ain’t it…. that’s bad for everyone. It WOULD be less confusing if open-stems weren’t in MP4 containers so had different file extensions… Pros and cons ...

### Mixxx - Mixxx 2.6 beta Released
URL: https://mixxx.org/news/2025-05-11-mixxx-2_6_beta-released
Drop a hotcue on another position

Before, cues played as long as you pressed them, to continue the playing you needed to press the play button. That's now possible with only a mouse: click and hold the cue, drag & drop it on the play button and ... tada, the track keeps playing.

#### 2.6 beta Changelog

The complete changelog can be found here
This is a selection of the changes and new features.

### STEM file support

### Library

`bpm:locked`

### Waveforms

### Controller Mappings

### Controller Backend

### Engine

### Preferences

### Skins

`play`

### Target support

### Misc Refactorings

GitHub profile
Discourse profile

#### Comments

## Pages

## Community

Mastodon
Facebook
Zulip
GitHub

## About [...] Mixxx

# Mixxx 2.6 beta Released

Date
Sun 11 May 2025

Author
Evelynne Veys

Tag
2.6 beta,
release announcement start CI

Date
Author
Tag

#### Mixxx 2.6 beta Release Announcement

We're proud to announce a new beta release of Mixxx, version 2.6.
This is a beta release containing a lot of new features, we offer this release in order to get it tested by the most possible users.
We look forward to the feedback of all users.

Mixxx needs testers for the new 2.6 beta release.
If you would like to contribute to your favorite DJ program (translate, add a mapping, add a feature, test) Get Involved.

Enjoy Mixxx 2.6 beta

#### STEMS STEMS STEMS [...] Enjoy Mixxx 2.6 beta

#### STEMS STEMS STEMS

To explain what STEMS are all about, we take a sentence from the introduction of this post, a regular text and convert it to a STEMS-text.
In this example we extract 4 TEXT-STEMS that represent each a particular part of that sentence that only result in the original text when they are combined they result.

In the Text stems example here you can play with the mute and effe ...

### mixxx/CHANGELOG.md at main
URL: https://github.com/mixxxdj/mixxx/blob/main/CHANGELOG.md
2.6.0 (Unreleased) STEM file support Add simple support for STEM files #13044 Add stem controls and waveforms. Require a C++20 compiler Support

### Mixxx - Mixxx - stems tag
URL: https://mixxx.org/news/tag/stems
# Articles tagged with stems

#### GSOC 2025 - Converting Demucs v4 (Hybrid Transformer) AI model to ONNX format

Date   Author Anmol Mishra   Tag gsoc, gsoc-2025, stems

Imagine loading any track in Mixxx and instantly isolating the vocals, drums, bass, or instruments live, in real time. This is the vision behind our Google Summer of Code 2025 project: "Converting Demucs v4 (Hybrid Transformer) AI model to ONNX format".

Mixxx 2.6 will support playback of stem files …

Read More

#### GSoC 2024: Adding STEM mixing support

Date   Author Antoine Colombier   Tag gsoc, gsoc-2024, stems

Disclaimer: The blog post primarily serves as the documentation for the Google Summer of Code 2024 project: "Multi channel mixing support (STEMS)". [...] ## Explore New Creative Horizons with Mixxx's Latest Feature: Stem Mixing

We're excited to bring a powerful new feature to Mixxx: Stem Mixing. While the concept of stems — separate …

Read More

#### Midsummer Mixxx

Date   Author Evelynne Veys   Tag harmonic mixing, stems

#### Let the Mixxx shine

Summertime, partytime. In the middle of the festival season you are maybe playing a sunny vibes gig somewhere. Or you are relaxing on the beach or at the pool with a cocktail in the hand checking the long list of music you had to discover. Both …

Read More

## Pages

 Overview
 Features
 Press
 Get Support
 Get Involved
 Donate

## Community

 Forums
 25th Anniversary Shop
 Mastodon Mastodon
 Facebook Facebook
 Zulip Zulip
 GitHub GitHub

## About [...] ## About

 News (Archives, Feed)
 Contact
 Imprint/Impressum
 Privacy Policy
 Wiki

© 2001-2024 Mixxx Development Team  
 Logo by Paul Bloch  
 This site is powered by Netlify.

### Help wanted to create stems - Help & Support - Mixxx
URL: https://mixxx.discourse.group/t/help-wanted-to-create-stems/30627
c:\Stem\Output>(  
set “filename=Shiva - Alleluia feat. Sfera Ebbasta (Official video).3.wav”  
set “newname=!filename:\_(Drums)=.1!”  
ren “Shiva - Alleluia feat. Sfera Ebbasta (Official video).3.wav” “!newname!”  
)

c:\Stem\Output>(  
set “filename=Shiva - Alleluia feat. Sfera Ebbasta (Official video).4.wav”  
set “newname=!filename:\_(Drums)=.1!”  
ren “Shiva - Alleluia feat. Sfera Ebbasta (Official video).4.wav” “!newname!”  
)

c:\Stem\Output>echo “Bass → .2”  
“Bass → .2”

c:\Stem\Output>for %f in (\) do (  
set “filename=%~nxf”  
set “newname=!filename:\_(Bass)=.2!”  
ren “%f” “!newname!”  
) [...] c:\Stem\Output>(  
set “filename=Shiva - Alleluia feat. Sfera Ebbasta (Official video).4.wav”  
set “newname=!filename:\_(Bass)=.2!”  
ren “Shiva - Alleluia feat. Sfera Ebbasta (Official video).4.wav” “!newname!”  
)

c:\Stem\Output>echo “Other → .3”  
“Other → .3”

c:\Stem\Output>for %f in (\) do (  
set “filename=%~nxf”  
set “newname=!filename:\_(Other)=.3!”  
ren “%f” “!newname!”  
)

c:\Stem\Output>(  
set “filename=Shiva - Alleluia feat. Sfera Ebbasta (Official video).1.wav”  
set “newname=!filename:\_(Other)=.3!”  
ren “Shiva - Alleluia feat. Sfera Ebbasta (Official video).1.wav” “!newname!”  
) [...] c:\Stem\Output>echo “Vocals → .4”  
“Vocals → .4”

c:\Stem\Output>for %f in (\) do (  
set “filename=%~nxf”  
set “newname=!filename:\_(Vocals)=.4!”  
ren “%f” “!newname!”  
)

c:\Stem\Output>(  
set “filename=Shiva - Alleluia feat. Sfera Ebbasta (Official video).1.wav”  
set “newname=!filename:\_(Vocals)=.4!”  
ren “Shiva - Alleluia feat. Sfera Ebbasta (Official video).1.wav” “!newname!”  
)

c:\Stem\Output>(  
set “filename=Shiva - Alleluia feat. Sfera Ebbasta (Official video).2.wav”  
set “newname=!filename:\_(Vocals)=.4!”  
ren “Shiva - Alleluia feat. Sfera Eb ...

### Test that Mixxx 2.6 can load STEM files generated by third-party tools · Issue #15304 · mixxxdj/mixxx · GitHub
URL: https://github.com/mixxxdj/mixxx/issues/15304
## Navigation Menu

### Uh oh!

There was an error while loading. Please reload this page.

There was an error while loading. Please reload this page.

### Uh oh!

There was an error while loading. Please reload this page.

There was an error while loading. Please reload this page.

# Test that Mixxx 2.6 can load STEM files generated by third-party tools #15304

## Description

@JoergAtGithub

Mixxx should be a good citizen and should be interoperable with files in the STEM format generated by other tools.  
This ensures that the energy consuming STEM seperation process is not repeated, if a user switches to Mixxx.

## Metadata

## Metadata

### Assignees

### Labels

### Type

### Projects

### Milestone

### Relationships

### Development

## Issue actions

## Footer [...] ### Development

## Issue actions

## Footer

### Footer navigation


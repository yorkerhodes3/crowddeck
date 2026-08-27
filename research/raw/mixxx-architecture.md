# mixxx-architecture

QUERY: Mixxx source code architecture engine buffer soundmanager controller scripting QML

## Synthesized answer
Mixxx’s architecture is built around a C++ core that drives audio processing through the Engine, whose central class EngineMixer orchestrates all mixing, beat‑matching and effect routing while the SoundManager handles the audio I/O layer, selecting devices, configuring sample rate and latency and managing the circular sound buffer that supplies the next block of PCM data to EngineMixer; controller support is exposed via a JavaScript/TypeScript‑based scripting API that lets mapping files read and write Mixxx Controls (including a latency‑buffer‑size control) to interact with the engine in real time, and the user interface is being migrated to Qt QML for Mixxx 3.0, replacing the older QtWidgets UI and enabling a modern, easily customizable front‑end while still using the same engine and SoundManager backend.

## Sources

### 16.8. Changelog — Mixxx User Manual
URL: https://manual.mixxx.org/2.7/cs/chapters/appendix/changelog
Controller: fix the tabs display for QML=OFF. Use capitalized Mixxx in Windows installer. Add TypeScript declarations for engine and controller scripting API

### MIXXX_ARCHITECTURE_GUIDE.md, made by Claude Sonnet ...
URL: https://gist.github.com/mxmilkiib/ad55a02d3aea12ecaa8bc6acdc3484e5
See also: Controllers and Scripting, MIDI Message Flow, Controller Testing. SoundManager (Engine): Audio I/O configuration, device selection, buffer management.

### 16.5. Mixxx Controls
URL: https://manual.mixxx.org/2.4/en/chapters/appendix/mixxx_controls.html
Latency setting (sound buffer size) This control can be used in controller scripts to trigger context-specific actions.

### Developer Guide Engine · mixxxdj/mixxx Wiki
URL: https://github.com/mixxxdj/mixxx/wiki/Developer-Guide-Engine
EngineMixer is the main class that drives the entire mixing engine. SoundManager calls EngineMixer directly to request that the next buffer of

### A Look Into the Only Open-Source DJ Software On the Market: A Conversation with the Mixxx Team - Magnetic Magazine
URL: https://magneticmag.com/2025/12/a-look-into-the-only-open-source-dj-software-on-the-market-a-conversation-with-the-mixxx-team
The DJ industry is rapidly moving towards more closed solutions and expensive subscriptions. Users may love the convenience of a controller with built-in audio playback at first, but there will always a place for an open alternative that can run on any commodity PC. The Mixxx dev team is hard at work rewriting the entire user interface in a more modern framework called QML which will enable Mixxx to run on phones and tablets in additional to the usual laptops. [...] Developed by a global community of volunteers, Mixxx is shaped as much by the DJs who use it as by the developers who write its code. From deep controller scripting and timecode vinyl support to broadcast-ready streaming tools and a modular effects engine, the software reflects a philosophy rooted in transparency, experimentation, and shared ownership. Rather than chasing lock-in or exclusivity, Mixxx embraces adaptability – running across Windows, macOS, Linux, and beyond, and supporting an ever-expanding range of hardware. [...] Mixxx has a many advantages, the first of which is flexibility and openness. Mixxx works on three major operating systems, dozens and dozens of controllers, can play just about every audio file type including some very obscure ones, and works with countless audio hardware cards. And that’s just what Mixxx can do out of the box. Mixxx’s controller mappings are written in Javascript and XML, so it’s possible to imagine entirely new ways of controlling music playback. Also, Mixxx works on much older hardware than most manufacturers target. We have users from around the world who do not have access to the latest PCs and operating systems, and we think they should be able to throw parties too.

### GitHub - mixxxdj/mixxx: Mixxx is Free DJ software that gives you ...
URL: https://github.com/mixxxdj/mixxx
| .prettierrc.yaml | .prettierrc.yaml |  |  |
| .qmlformat.ini | .qmlformat.ini |  |  |
| AGENTS.md | AGENTS.md |  |  |
| CHANGELOG.md | CHANGELOG.md |  |  |
| CMakeLists.txt | CMakeLists.txt |  |  |
| CODE\_OF\_CONDUCT.md | CODE\_OF\_CONDUCT.md |  |  |
| CONTRIBUTING.md | CONTRIBUTING.md |  |  |
| COPYING | COPYING |  |  |
| Doxyfile | Doxyfile |  |  |
| LICENSE | LICENSE |  |  |
| README.md | README.md |  |  |
| eslint.config.cjs | eslint.config.cjs |  |  |
| pyproject.toml | pyproject.toml |  |  |
|  | [...] | Name | Name | Last commit message | Last commit date |
 ---  --- |
| .github | .github |  |  |
| .tx | .tx |  |  |
| cmake | cmake |  |  |
| lib | lib |  |  |
| packaging | packaging |  |  |
| res | res |  |  |
| src | src |  |  |
| tools | tools |  |  |
| .clang-format | .clang-format |  |  |
| .clang-tidy | .clang-tidy |  |  |
| .cmakelintrc | .cmakelintrc |  |  |
| .codespellignore | .codespellignore |  |  |
| .codespellignorelines | .codespellignorelines |  |  |
| .flake8 | .flake8 |  |  |
| .gersemirc | .gersemirc |  |  |
| .gitattributes | .gitattributes |  |  |
| .gitignore | .gitignore |  |  |
| .markdownlint-cli2.yaml | .markdownlint-cli2.yaml |  |  |
| .pre-commit-config.yaml | .pre-commit-config.yaml |  |  |
| .prettierrc.yaml | .prettierrc.yaml |  |  | [...] ## Repository files navigation

# Mixxx

GitHub latest tag Packaging status Build status Coverage status Zulip chat Donate

Mixxx is Free DJ software that gives you everything you need to perform live DJ mixes. Mixxx works on GNU/Linux, Windows, and macOS.

## Quick Start

To get started with Mixxx:

1. For live use, download the latest stable version.
2. For experimentation and testing, download a development release.
3. To live on the bleeding edge, clone the repo: `git clone 

## Bug tracker
 ...

### 1. Introduction to Mixxx
URL: https://manual.mixxx.org/2.0/pl/chapters/introduction
Mixxx is the only free cross-platform vinyl control software and has the most advanced MIDI/HID controller support via our innovative JavaScript-based

### Mixxx - Announcing the new shape of Mixxx 3.0 - take part in the future of Open Source DJing
URL: https://mixxx.org/news/2025-08-06-qml-project
Code Contributions: Help us implement the new QML interface, fix bugs, and add new features. Your expertise in Qt/QML will be invaluable as we transition to this new technology.
  > Pro tip
  >
  > Contributing to Mixxx enhances your coding skills and connects you with a vibrant community, providing real-world impact and career opportunities. Many contributors have advanced their careers through Mixxx, gaining valuable experience and recognition. Join us to collaborate with passionate developers and open doors to exciting tech industry opportunities. [...] Here is a preview of the current look we have designed during the proposal. Of course, as always with design work, the final version will likely look a little different, but this helps as a general guideline and goal to something we like, and hopefully you will to!

Preview Preview Preview

## Why We Are Redesigning Mixxx

The current user interface of Mixxx has served us well, but as technology evolves, so must we. The shift to QML will simplify customization and maintenance, allowing us to focus more on innovative features and less on upkeep. This transition will also enable us to phase out our homemade theme system, streamlining our development process.

## Key Features of the New Design [...] Preview Preview Preview Preview

## Get Involved

We are calling on developers and testers to join us in this exciting journey. Whether you are a seasoned developer or a passionate DJ looking to contribute, there are many ways you can help us.

This significant project offers a fantastic opportunity to make a substantial impact from the ground up. By helping implement the new QML interface, fixing bugs, and adding features, you can shape the future of a widely-used DJ software. Your Qt/QML expertise will be crucial in this tr ...


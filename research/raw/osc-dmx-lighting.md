# osc-dmx-lighting

QUERY: Open Sound Control OSC DMX Art-Net lighting control open source library DJ light show

## Synthesized answer
Open Sound Control (OSC) can be combined with DMX‑based lighting via several free, open‑source projects that are well suited for DJ‑style light shows: the Open Lighting Architecture (OLA) provides a robust OSC‑to‑DMX/Art‑Net bridge and includes a C++ library (libola) plus a Python API for mapping OSC messages to DMX universes; liblo is a lightweight C library that handles OSC packet parsing and can be paired with OLA or with custom code to translate OSC to Art‑Net. For ready‑made applications, LightGroove is a modern web‑based DMX controller that runs on Windows, macOS and Linux, offers Art‑Net output, BPM‑sync and a browser UI that any DJ can access from a phone or laptop; DigiShow is a Qt‑based show‑control app written in C++/QML that ships with TinyOSC, RtMidi and built‑in Art‑Net support, allowing you to map MIDI, OSC, DMX and other protocols in a single patch and is explicitly marketed for DJ performances; QLC+ (Q Light Controller Plus) and DMXControl 3 are also open‑source DMX suites with plug‑ins for OSC input and Art‑Net output, making them viable choices for integrating music software, VJ tools or iPad controllers (e.g., Lemur) into a synchronized light rig. All of these libraries and applications can run on typical DJ hardware and provide the OSC‑to‑DMX/Art‑Net conversion needed to drive professional fixtures from a DJ’s music tempo.

## Sources

### OSC and DMX Lighting
URL: https://opensoundcontrol.stanford.edu/implementations/OSC-and-DMX-Lighting.html
OpenSoundControl.org:   /page-list   /toc   /spec/1.0   /spec/1.1   /implementations   /publications   /about  
 (contents of this file: links to each section)

# OSC and DMX Lighting

status: Active (as of 15-Mar-21)

Project Type: Software Application

Project URL: 

OSC Documentation URL: 

## Description

DMX lighting controller with native support for OSC in and out. This allows easy integration of lighting control with other show control applications like music, VJ and media server. Since it is a lighting software, you can use it to convert OSC to Artnet or outputting through a DMX USB dongle. The TUIO protocol is also supported.

## Implementation Details

Platform(s): Windows

Features: Packet Parsing, Packet Construction, Bundle Support, Timetag Support, Stateless Interface [...] Supported OSC types: f: float32

Bundle support: Reads Bundles, Creates Bundles, Supports Nested Bundles

Timetag support: Generates “immedate” timestamp

Transport support: UDP, Bidirectional UDP (via sendto/recvfrom)

Submitted to opensoundcontrol.org by Legacy at 2/24/21 12:32

This page of OpenSoundControl website updated Tue Aug 16 13:15:19 PDT 2022 by matt (license: CC BY).

### LightGroove - Free Open Source DMX Lighting Controller | LightGroove
URL: https://oliverbyte.github.io/lightgroove
# Professional Lighting Control, Completely Free

Modern web-based DMX controller with ArtNet output - Community powered development and support

## Built For You

Whether you're a mobile DJ, running a small venue, or a tech enthusiast - LightGroove has you covered

### Mobile DJs

Lightweight, portable lighting control that runs on any laptop or tablet. Set up your light show in minutes and control it from your device's web browser. Control from any device on your network - phone, tablet, or laptop. No expensive dedicated hardware required, just your existing equipment and an ArtNet interface.

### Small Venues [...] ### Color Effects

Built-in static colors and 4 dynamic effect modes. Random chase effects, synchronized color changes, and alternating strobe patterns. Smooth fade transitions for professional looks.

### ArtNet Output

Send DMX via ArtNet to any compatible interface. Works with professional lighting equipment like Enttec ODE, DMXking, and other ArtNet nodes. Multiple universe support with flexible mapping.

### Master Control

Global intensity scaling for all fixtures. Perfect for quick brightness adjustments during shows without changing individual fader positions. Real-time response.

### BPM Sync

Sync color effects to your desired tempo from 1-480 BPM. Adjustable fade time (0-100%) for smooth color transitions. Perfect timing for music-synchronized lighting.

### Web Config [...] ### Easy Setup

Up and running in minutes with simple installers for Windows and macOS. Brew installation on macOS or source installation on any platform. No complex configuration required to get started.

### No Compromise

Professional features including ArtNet output, real-time fader control, dynamic color effects, and web-based configuration. Free doesn't mean limited -  ...

### OSC and DMX Lighting - OSC to DMX | OSC to Artnet
URL: https://www.lightjams.com/osc.html
# OSC In and Out Easy Integration With Other Applications

# OSC (Open Sound Control) as the Universal Language

In today's event world, lighting isn't alone and DMX isn't the king. There's projection, VJ, media server, music software and more. Here comes OSC to the rescue! OSC is becoming the standard protocol to enable all these applications to communicate. Lightjams wants to be part of the conversation and happily speaks the OSC language.

If you're looking for a nice OSC launchpad, try the LightjamsPAD. [...] Directly from Italy, Manuel Carreras uses Lightjams and an iPad running Lemur to control the lighting. Lemur is used to trigger scenes and modify lighting parameters in real-time and it communicates with Lightjams via the OSC protocol. The show is controlled wirelessly via an iPad, allowing Manuel to move around in the club during the night. The DMX fixtures are: 20 eurolite LED bar 252/10, 4 coeff mp 250 fresnell, 3 blinders and 2 eurolite LED par 64 rgb.

In the next video, Volt Vision uses Lightjams with an iPad and a Wiimote to remotely control LEDs around windows. They have created multiple effects triggered via a Wiimote.

# OSC Input [...] # OSC Input

Receive up to 512 OSC values in realtime. You can use these values to control any lighting parameters. This lets you easily control DMX lighting with your fancy music sequencer, VJ software and remotes like MSA Remote, OSCemote and TouchOSC.

OSCemote interfaces

# OSC Learn Mode

OSC is great. However, right now, it's a jungle where each application defines its own adressing format. Lightjams has a handy OSC learn mode letting you use any incoming message, whatever its format.

# OSC Mapper

Use Lightjams mapping capability to convert incoming OSC values to any of the output types, mainly OSC to DMX, OSC  ...

### GitHub - robinz-labs/digishow: A digital show control app written in c++ and qml, enables signal mapping between MIDI, DMX, OSC, ArtNet, Modbus, Arduino, Philips Hue and more digital device interfaces. · GitHub
URL: https://github.com/robinz-labs/digishow
Required to enable DigiShow LINK to play MP4, MOV video files on your Windows computer.  
   download

## Developer Resources

DigiShow is open-source. If you would like to rebuild this software using the source code we contributed, please visit  .

Building executables from source using the qmake tool or the QtCreator application requires Qt 5.12 or 5.15 LTS.

Additional library dependencies are already included in the repository:

 RtMidi 4.0.0 
 TinyOSC library 
 Ableton Link library 
 global hotkey library 
 qt-qrcode 
 libFTDI 

The source code can be compiled for target platforms compatible with:

 macOS 10.13 or later
 Windows 10 or Windows 11 (64-bit version)
 Linux (tested on ARM 64-bit platforms such as Raspberry Pi 5)

## About [...] ## Key Features

 Multi-Protocol Support

  Supports MIDI, DMX, OSC, Modbus, Arduino, Hue, and other protocols for coordinated control of audio, lighting, screens, robotics, and more.
 Signal Mapping

  Converts MIDI notes, OSC control signals, etc., into lighting, servo motor, and media playback commands. Also transforms sensor inputs into MIDI/OSC signals for music software (e.g., Ableton Live, Logic Pro) and real-time visual creative tools (e.g., TouchDesigner, Unreal Engine).
 Interactive Control

  Ideal for DJ performances, stage or space lighting synchronization, experimental music, and interactive installations to enhance live engagement and visual effects.

For a typical 'digital' show, requires some particular digital things working together, along with DigiShow LINK. [...] Skip to content   
 

## Navigation Menu

Sign in

Appearance settings

Sign in

Sign up

Appearance settings

You signed in with another tab or window. Reload to refresh your session. You signed out in another tab or window. Reload to refresh your s ...

### Introduction to receiving MIDI, OSC and DMX.
URL: https://vdmx.vidvox.net/tutorials/introduction-to-receiving-midi-osc-and-dmx
OSC (Open Sound Control) is a protocol for sending control information over a network. ArtNet is a network version of the DMX512 protocol for

### DMX Lighting Software for DJs: The Complete Guide
URL: https://www.nadj.org.uk/news/dmx-lighting-software-for-djs-the-complete-guide
QLC+ (Q Light Controller Plus) is a free, open-source DMX application available for Windows, Mac, Linux, and Raspberry Pi. It supports an

### Top 5 Lighting Control Software for Stunning Light Shows
URL: https://www.starshinelights.com/blogs/news/best-lighting-control-software
DMXControl 3 is free, open-source dmx lighting software designed for simplicity and functionality. It's an excellent choice for smaller setups

### Open Sound Control - Teensy Forum - PJRC
URL: https://forum.pjrc.com/index.php?threads%2Fopen-sound-control.18849%2F=
It supports OSC over ethernet. OSC is used for lighting control, robotics and all kind of things. and-dmx/ for control from lighting, sound,


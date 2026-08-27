# verify-midi2-ump-os

QUERY: MIDI 2.0 UMP operating system support Windows MIDI Services macOS CoreMIDI Linux ALSA 2026

## Synthesized answer
Windows 11 gained full native MIDI 2.0 support in early 2026 through the new Windows MIDI Services stack, which implements the Universal MIDI Packet (UMP) format, offers multi‑client access, automatic translation between MIDI 1.0 and 2.0, and a PowerShell‑based SDK; macOS has supported MIDI 2.0 at the OS level since October 2021 via an updated CoreMIDI framework that provides native USB‑MIDI 2.0 drivers and UMP handling; Linux added official MIDI 2.0 UMP support in the ALSA subsystem starting with kernel 6.5 (released in 2023) and continued through subsequent kernels, exposing rawmidi devices (e.g., /dev/snd/ump*) and extending the ALSA sequencer API to handle UMP packets, automatic version conversion, and endpoint metadata.

## Sources

### Building a USB MIDI 2.0 Device – Part 1 – MIDI.org
URL: https://midi.org/building-a-usb-midi-2-0-device-part-1
# Building a USB MIDI 2.0 Device – Part 1

### Andrew Mee

#### By Andrew Mee in collaboration with the OS API Working Group

USB MIDI 2.0 was released by the USB-IF in June 2020, with Apple adding support within CoreMIDI in October 2021, Google added support in Android in August 2022, ALSA (GNU Linux) in 2023, and Microsoft in 2026. An update to the MIDI 2.0 UMP specification was approved in the first half of 2023.  
For a more complete timeline see 

This technical guide to building a USB MIDI 2.0 device is the first in a series of articles targeted specifically to device developers.  
For musicians, please see this article: [...] ### Linux (6.5+) / ALSA

### Android 13+

Android 13+ currently connects to the USB MIDI Interface and can use either the USB MIDI 1.0 function on Alternate Setting #0 or use the USB MIDI 2.0 function on Alternate Setting #1 on a per application basis. When apps call midiManager.getDevicesForTransport( MidiManager.TRANSPORT\_UNIVERSAL\_MIDI\_PACKETS), they see the USB MIDI 2.0 device as a MIDI 2.0 device. If they call midiManager.getDevicesForTransport( MidiManager.TRANSPORT\_MIDI\_BYTE\_STREAM), they see the device as a MIDI 1.0 device. A device can be opened as only one of the two modes at once.

See  for more information.  contains some sample applications developers can test with.

### Windows 11 2026

Windows offers commandline tools and a MIDI Settings App. The App is available at [...] While MIDI 2.0 Protocol is declared in the Monosynth Group Terminal Block, a host Application may send MIDI 1.0 Channel Voice Message either intentionally or accidentally. In UMP 1.1 Stream Configuration messages may also be used to switch Protocols. To ensure the best compatibility with incoming messages a MIDI 2.0 Device supporting MIDI 2.0 Protocol s ...

### MIDI 2.0 Coming to Windows 11 – MIDI.org
URL: https://midi.org/midi-2-0-coming-to-windows-11
At January NAMM 2026, Pete Brown and Gary Daniels from Microsoft showed off Windows MIDI Services top features for musicians and developers, and explained some of what is going on under the hood.

Windows MIDI Services is a modern, rebuilt system for handling Musical Instrument Digital Interface (MIDI) on Windows, offering full support for both legacy MIDI 1.0 and the new MIDI 2.0 standard with Universal MIDI Packets (UMP), enabling faster, more reliable communication, simultaneous multi-client access to devices, automatic translation between versions, and new tools like the MIDI Services Console for management and diagnostics, all built on an open-source foundation for future expansion.

--- [...] Built-in Scripting Built-in support for scripting MIDI using PowerShell. Want to automate synchronization between mixers? Want to set up a script to initialize all your devices for a show? All this can be done via the PowerShell Cmdlets.  
  
Developer Benefits#  
UMP-Centric.   
The new SDK fully embraces MIDI 2.0 and the Universal MIDI Packet format and handles all required translation in the service and driver. This makes the app model simple while ensuring all your existing devices continue to work. Messages to and from any endpoint, whether it is MIDI 1.0 or MIDI 2.0 data format, are transparently translated in the service, and presented as UMP through the SDK.  
  
Extensive Endpoint Metadata [...] What We Do
  + Innovation Awards
  + Music Accessibility
  + MIDI In Music Education
  + AI in Music and Games
 Specs and Tech
  + Specifications
  + MIDI 2.0 Products
 What's Happening
  + News
  + Events and Trade Shows
  + Forum
 About
  + About Us
  + Membership
  + Get Involved

Sign Up

# MIDI 2.0 Coming to Windows 11

### The MIDI Association

Read More

One of the mos ...

### MIDI 2.0 Preview Branch - News and Announcements - JUCE
URL: https://forum.juce.com/t/midi-2-0-preview-branch/66453
`midi2`
`develop`
`midi2`
`develop`

### Related topics

| Topic |  | Replies | Views | Activity |
 ---  --- 
| Making Clean UMP on Mac  General JUCE discussion | 8 | 164 | June 20, 2026 |
| Experimental support for the Windows Runtime MIDI API  Windows | 34 | 10229 | November 16, 2018 |
| Status of Midi 2.0 and Juce  General JUCE discussion | 10 | 1987 | November 7, 2022 |
| Linux MIDI support?  Linux | 10 | 968 | August 4, 2006 |
| MIDI 2.0 Device Support  General JUCE discussion | 2 | 1001 | December 18, 2023 |

Powered by Discourse, best viewed with JavaScript enabled

JUCE Logo [...] You can use `ump::Endpoints::getBackend()` to determine which MIDI implementation is currently in use. If you’re on Windows, and the backend isn’t WMS, then you can operate in a reduced functionality mode using the old MIDI APIs, and/or direct users to go and install the appropriate runtime. Another option might be to update your product’s installer to also install the WMS runtime.

`ump::Endpoints::getBackend()`

thanks

When making decisions based on detection, it’s important to note that Windows MIDI Services comes in two parts:

If you use WinMM APIs, and Windows MIDI Services is in-box, you get multi-client for free. You’ll also have access to MIDI 2.0 hardware, but downscaled to MIDI 1.0 and translated to the MIDI 1.0 byte format, so with reduced fidelity compared to MIDI 2.0 UMP. [...] `AudioProcessor`

In the meantime, if OS-level MIDI 2.0 support is something that interests you, please do checkout the branch and let us know how it’s working.

This is outstanding news! Looking forward to digging into it.

Forgot to mention: the new branch also includes support for creating virtual MIDI ports on Android, which is a feature that’s been missing from JUCE up until now. This makes i ...

### ALSA: Add MIDI 2.0 support [LWN.net]
URL: https://lwn.net/Articles/932437
Hi, this is a (largish) patch set for adding the support of MIDI 2.0 functionality, mainly targeted for USB devices. MIDI 2.0 is a complete overhaul of the 40-years old MIDI 1.0. Unlike MIDI 1.0 byte stream, MIDI 2.0 uses packets in 32bit words for Universal MIDI Packet (UMP) protocol. It supports both MIDI 1.0 commands for compatibility and the extended MIDI 2.0 commands for higher resolutions and more functions. For supporting the UMP, the patch set extends the existing ALSA rawmidi and sequencer interfaces, and adds the USB MIDI 2.0 support to the standard USB-audio driver. The rawmidi for UMP has a different device name (/dev/snd/umpCD) and it reads/writes UMP packet data in 32bit CPU-native endianness. For the old MIDI 1.0 applications, the legacy rawmidi interface is provided, too. [...] ALSA: seq: Automatic conversion of UMP events ALSA: seq: Allow suppressing UMP conversions ALSA: seq: Bind UMP device ALSA: seq: ump: Create UMP Endpoint port for broadcast ALSA: seq: Add ioctls for client UMP info query and setup ALSA: seq: Print UMP Endpoint and Block information in proc outputs ALSA: seq: Add UMP group filter ALSA: docs: Add MIDI 2.0 documentation Documentation/sound/designs/index.rst | 1 + Documentation/sound/designs/midi-2.0.rst | 342 ++++++ include/linux/usb/midi-v2.h | 94 ++ include/sound/asequencer.h | 4 + include/sound/rawmidi.h | 16 +- include/sound/seq_device.h | 1 + include/sound/seq_kernel.h | 10 + include/sound/ump.h | 175 ++++ include/sound/ump_msg.h | 540 ++++++++++ include/uapi/sound/asequencer.h | 83 +- include/uapi/sound/asound.h | 58 +- [...] | 1 + sound/core/ump.c | 677 ++++++++++++ sound/core/ump_convert.c | 520 ++++++++++ sound/core/ump_convert.h | 43 + sound/usb/Kconfig | 11 + sound/usb/Makefile | 1 + sound/usb/card.c | 12 +- sound/usb/midi ...

### MIDI 2.0 on Linux — The Linux Kernel documentation
URL: https://docs.kernel.org/sound/designs/midi-2.0.html
MIDI 2.0 protocol is an extended protocol to achieve the higher resolution and more controls over the old MIDI 1.0 protocol.

MIDI-CI is a high-level protocol that can talk with the MIDI device for the flexible profiles and configurations. It’s represented in the form of special SysEx.

For Linux implementations, the kernel supports the UMP transport and the encoding/decoding of MIDI protocols on UMP, while MIDI-CI is supported in user-space over the standard SysEx.

As of this writing, only USB MIDI device supports the UMP and Linux 2.0 natively. The UMP support itself is pretty generic, hence it could be used by other transport layers, although it could be implemented differently (e.g. as a ALSA sequencer client), too. [...] The access to UMP devices are provided in two ways: the access via rawmidi device and the access via ALSA sequencer API.

ALSA sequencer API was extended to allow the payload of UMP packets. It’s allowed to connect freely between MIDI 1.0 and MIDI 2.0 sequencer clients, and the events are converted transparently.

## Kernel Configuration¶

The following new configs are added for supporting MIDI 2.0: CONFIG\_SND\_UMP, CONFIG\_SND\_UMP\_LEGACY\_RAWMIDI, CONFIG\_SND\_SEQ\_UMP, CONFIG\_SND\_SEQ\_UMP\_CLIENT, and CONFIG\_SND\_USB\_AUDIO\_MIDI\_V2. The first visible one is CONFIG\_SND\_USB\_AUDIO\_MIDI\_V2, and when you choose it (to set =y), the core support for UMP (CONFIG\_SND\_UMP) and the sequencer binding (CONFIG\_SND\_SEQ\_UMP\_CLIENT) will be automatically selected. [...] ## ALSA Sequencer with USB MIDI 2.0¶

In addition to the rawmidi interfaces, ALSA sequencer interface supports the new UMP MIDI 2.0 device, too. Now, each ALSA sequencer client may set its MIDI version (0, 1 or 2) to declare itself being either the legacy, UMP MIDI 1.0 or UMP M ...

### MIDI-2.0 is under construction - Related Projects - Zynthian Discourse
URL: https://discourse.zynthian.org/t/midi-2-0-is-under-construction/2655
Now, to be honest, there is a second difficulty : there is currently no driver on Windows, Mac or Linux to provide MIDI2.0 stream from any sequencer. The solution I found is to write a special driver for Windows and a daemon for Linux which acts as a bridge/translator between existing applications and networked UMP. I will release them soon (they are now in final tests) along with a test tool I call UMP-OX (in “memory” of MIDI-OX :slightly_smiling_face:). UMP-OX will be released as open-source (and I am also evaluating to release the bridge driver also as open-source, at least for the Linux version)

:slightly_smiling_face: [...] The problem is that USB MIDI driver 2.0 only exists on Mac OS (it does not yet exist on iOS, as far as I know). It does not exist yet on Windows, nor Linux (even if Microsoft and ALSA have announced things). And as far as I know, the few software running on MacOS able to deal with the new API only provide MIDI 1.0 data encapsulated into UMP (Universal MIDI Protocol), they don’t yet provide access to the MIDI 2.0 part of the protocol with the higher resolution for example.

I am convinced that the Open Source community has a strong part to play in the adoption of MIDI 2.0, but due to licensing issues with USB, things will probably start to move only when “open” protocols (Ethernet and Serial) specifications will be released by the MMA.

Hi to all Zynthianers, [...] I am currently working on a UMP daemon for the Zynthian with the latest protocol version (I needed first to modify the rtpUMP driver running on Windows machine, the one you see on the screenshot). The nice thing is that the driver allows to send MIDI commands from sequencers or MIDI-OX using the UMP protocol, not RTP-MIDI anymore.  
If everything goes like I want, I plan to have a wor ...

### Windows MIDI 2.0 Rollout
URL: https://vi-control.net/community/threads/windows-midi-2-0-rollout.169894
Apple was the first to implement full MIDI 2.0 support within CoreMIDI for macOS, iOS, and iPadOS, providing native USB MIDI 2.0 driver support.

### Big Patch Series Prepares The Linux Audio Drivers For ...
URL: https://www.phoronix.com/news/MIDI-2.0-Linux-Kernel-Patches
For supporting the UMP, the patch set extends the existing ALSA rawmidi and sequencer interfaces, and adds the USB MIDI 2.0 support to the


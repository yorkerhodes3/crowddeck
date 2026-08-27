# midi-2-0-spec

QUERY: MIDI 2.0 specification Universal MIDI Packet UMP MIDI-CI property exchange profiles 2025

## Synthesized answer
The MIDI 2.0 standard defines the Universal MIDI Packet (UMP) as a 32‑bit‑aligned container that can be 32, 64, 96 or 128 bits long, supporting up to 16 independent groups each with 16 channels and carrying both legacy MIDI 1.0 byte‑stream messages and the new MIDI 2.0 voice‑channel messages, with built‑in discovery of UMP endpoints to enable bidirectional switching between protocols; MIDI Capability Inquiry (MIDI‑CI, MA02) provides a universal discovery and configuration layer that uses System Exclusive messages to exchange device capabilities, and its Common Rules for Profiles (MA03, version 1.1, updated 2024) define a schema for Profile specifications that allow devices to auto‑configure behavior via Profile Configuration, Profile Added/Removed, and Profile Details Inquiry messages, while the Common Rules for Property Exchange (MA04, version 1.1, unchanged since 2020) specify a JSON‑based Resource/Property model for getting and setting a wide range of device properties—such as preset names, parameter mappings, and state information—through dedicated MIDI‑CI Property Exchange messages, all of which are required for full UMP‑based operation in the 2025 MIDI 2.0 ecosystem.

## Sources

### M2-100-U MIDI 2.0 Specification Overview, Version 1.1
URL: https://amei-music.github.io/midi2.0-docs/amei-pdf/M2-100-U_v1-1_MIDI_2-0_Specification_Overview.pdf
the marketplace. See the Common Rules for MIDI-CI Property Exchange [MA04] for more details. 2.6 Universal MIDI Packet (UMP) Format and MIDI 2.0 Protocol The Universal MIDI Packet (UMP) Format and MIDI 2.0 Protocol specification defines a new data format for MIDI 1.0 Protocol messages, MIDI 2.0 Protocol messages, and a foundation for the expansion of MIDI. The UMP Format includes discovery mechanisms for UMP Endpoints which must be enacted before using other features of the Universal MIDI Packet (UMP) Format and MIDI 2.0 Protocol specification. UMP discovery enables increased interoperability, such as bidirectional transactions for switching between MIDI 1.0 Protocol and MIDI 2.0 Protocol. The data format of the UMP adds 16 Groups, each containing an independent set of System Messages and [...] to implement MIDI 2.0. MIDI 2.0 features are defined in the following documents: 1. MIDI Capability Inquiry (MIDI-CI) [MA02] 2. Common Rules for MIDI-CI Profiles [MA03] 3. Common Rules for MIDI-CI Property Exchange [MA04] 4. Universal MIDI Packet (UMP) Format and MIDI 2.0 Protocol [MA05] 2.3 MIDI Capability Inquiry (MIDI-CI) MIDI-CI defines a discovery mechanism and an architecture that allows Devices with bidirectional communication to agree to use the extended capabilities of MIDI 2.0 for autoconfiguration and interoperability. Goals of MIDI-CI design: • Allow a Sender to know the capabilities of a Receiver. • Enable easier configuration between Devices using auto-configuration Profiles. • Define method for Getting and Setting a wide range of Device properties. MIDI-CI delivers on these [...] rights reserved. 13 3 MIDI Transports 3.1 MIDI-CI on MIDI 1.0 and MIDI 2.0 Capable Transports One of the core goals of MIDI 2.0 was to allow addition of MIDI 2.0 bi-directional communicati ...

### M2-100-U MIDI 2.0 Specification Overview, Version 1.1
URL: https://amei.or.jp/midistandardcommittee/MIDI2.0/MIDI2.0-DOCS/M2-100-U_v1-1_MIDI_2-0_Specification_Overview.pdf
the marketplace. See the Common Rules for MIDI-CI Property Exchange [MA04] for more details. 2.6 Universal MIDI Packet (UMP) Format and MIDI 2.0 Protocol The Universal MIDI Packet (UMP) Format and MIDI 2.0 Protocol specification defines a new data format for MIDI 1.0 Protocol messages, MIDI 2.0 Protocol messages, and a foundation for the expansion of MIDI. The UMP Format includes discovery mechanisms for UMP Endpoints which must be enacted before using other features of the Universal MIDI Packet (UMP) Format and MIDI 2.0 Protocol specification. UMP discovery enables increased interoperability, such as bidirectional transactions for switching between MIDI 1.0 Protocol and MIDI 2.0 Protocol. The data format of the UMP adds 16 Groups, each containing an independent set of System Messages and [...] to implement MIDI 2.0. MIDI 2.0 features are defined in the following documents: 1. MIDI Capability Inquiry (MIDI-CI) [MA02] 2. Common Rules for MIDI-CI Profiles [MA03] 3. Common Rules for MIDI-CI Property Exchange [MA04] 4. Universal MIDI Packet (UMP) Format and MIDI 2.0 Protocol [MA05] 2.3 MIDI Capability Inquiry (MIDI-CI) MIDI-CI defines a discovery mechanism and an architecture that allows Devices with bidirectional communication to agree to use the extended capabilities of MIDI 2.0 for autoconfiguration and interoperability. Goals of MIDI-CI design: • Allow a Sender to know the capabilities of a Receiver. • Enable easier configuration between Devices using auto-configuration Profiles. • Define method for Getting and Setting a wide range of Device properties. MIDI-CI delivers on these [...] rights reserved. 13 3 MIDI Transports 3.1 MIDI-CI on MIDI 1.0 and MIDI 2.0 Capable Transports One of the core goals of MIDI 2.0 was to allow addition of MIDI 2.0 bi-directional communicati ...

### MIDI 2.0 – MIDI.org
URL: https://midi.org/midi-2-0
MIDI 2.0 Specification Overview
 MIDI Capability Inquiry (MIDI-CI)
 Common Rules for MIDI-CI Profiles
 Common Rules for MIDI-CI Property Exchange
 Universal MIDI Packet (UMP) Format an MIDI 2.0 Protocol
 MIDI Clip File Specification (SMF format for UMP)

There are specifications that build on the core MIDI 2.0 specifications. These define further capabilities in MIDI 2.0 for specific applications and various device types. (To download all 6 in a zip file, click download below after logging in.)

Join Us to Download

Details

### Protocol

The MIDI 2.0 Protocol is an extension of the MIDI 1.0 Protocol. Architectural concepts and semantics remain the same as MIDI 1.0. Compatibility for translation to/from the MIDI 1.0 Protocol is given high priority in the design of the MIDI 2.0 Protocol. [...] Details

### Property Exchange

Property Exchange is part of the MIDI Capability Inquiry (MIDI-CI) specification and MIDI 2.0. Property Exchange is a method for getting and setting various data, called Resources, between two Devices. Resources are exchanged inside two payload fields of System Exclusive Messages defined by MIDI-CI, the Header Data field and Property Data field. This document defines only the contents of the Header Data and Property Data fields. For information on how to transmit and receive these Resource payloads inside MIDI-CI System Exclusive messages, see the MIDI Capability Inquiry specification and Common Rules for MIDI-CI Property Exchange specification.

Details

### Profiles [...] Details

### Profiles

A Profile is a defined set of rules for how a MIDI receiver device implementing the Profile shall respond to a chosen set of MIDI messages to achieve a particular purpose or to suit a particular application.

Details

### Past Versions of MIDI 2.0 Specificat ...

### M2-100-U v1-0 MIDI 2-0 Specification Overview | PDF | Specification (Technical Standard) | Computer Networking
URL: https://www.scribd.com/document/513124951/M2-100-U-v1-0-MIDI-2-0-Specification-Overview
Scribd

# M2-100-U v1-0 MIDI 2-0 Specification Overview

M2-100-U v1-0 MIDI 2-0 Specification Overview

## Uploaded by

AI-enhanced description

# M2-100-U v1-0 MIDI 2-0 Specification Overview

The document defines MIDI 2.0 and its core components which are MIDI Capability Inquiry (MIDI-CI), Common Rules for MIDI-CI Profiles, Common Rules for MIDI-CI Property Exchange, and Universal MIDI Packet (UMP) Format and MIDI 2.0 Protocol. It also defines minimum requirements for devices to claim MIDI 2.0 compatibility.

# M2-100-U v1-0 MIDI 2-0 Specification Overview

M2-100-U v1-0 MIDI 2-0 Specification Overview

## Uploaded by

AI-enhanced description

## Share this document

## Footer menu

## About

## Support

## Legal

## Social

## Get our free apps

### Cubase PC and MIDI 2 - (and maybe AI) what is happening or likely 2026? - Cubase - Steinberg Forums
URL: https://forums.steinberg.net/t/cubase-pc-and-midi-2-and-maybe-ai-what-is-happening-or-likely-2026/1014264
MIDI 2 has Property Exchange, as I understand it, this is a feature within the MIDI-CI (MIDI Capability Inquiry) specification that allows MIDI 2.0 devices to exchange detailed information with each other, such as preset names, parameter settings, and controller mappings.

MIDI 2 profile configuration is (AI text here is orange for some reason)

It is the process of automatically mapping controls between MIDI 2.0 devices for a specific user scenario, eliminating manual setup. It uses a feature within the MIDI-CI (MIDI Capability Inquiry) specification that allows MIDI 2.0 devices to exchange detailed information with each other, such as preset names, parameter settings, and controller mappings.

### MIDI 2.0 on Linux — The Linux Kernel documentation
URL: https://www.kernel.org/doc/html/v6.7/sound/designs/midi-2.0.html
Support of Universal MIDI Packet (UMP)
 Support of MIDI 2.0 protocol messages
 Transparent conversions between UMP and legacy MIDI 1.0 byte stream
 MIDI-CI for property and profile configurations

UMP is a new container format to hold all MIDI protocol 1.0 and MIDI 2.0 protocol messages. Unlike the former byte stream, it's 32bit aligned, and each message can be put in a single packet. UMP can send the events up to 16 "UMP Groups", where each UMP Group contain up to 16 MIDI channels.

MIDI 2.0 protocol is an extended protocol to achieve the higher resolution and more controls over the old MIDI 1.0 protocol.

MIDI-CI is a high-level protocol that can talk with the MIDI device for the flexible profiles and configurations. It's represented in the form of special SysEx. [...] A UMP packet can be sent/received in a sequencer event embedded by specifying the new event flag bit SNDRV\_SEQ\_EVENT\_UMP. When this flag is set, the event has 16 byte (128 bit) data payload for holding the UMP packet. Without the SNDRV\_SEQ\_EVENT\_UMP bit flag, the event is treated as a legacy event as it was (with max 12 byte data payload).

With SNDRV\_SEQ\_EVENT\_UMP flag set, the type field of a UMP sequencer event is ignored (but it should be set to 0 as default).

The type of each client can be seen in /proc/asound/seq/clients. For example: [...] The protocols are specified in two field, the protocol capabilities and the current protocol. Both contain the bit flags specifying the MIDI protocol version (SNDRV\_UMP\_EP\_INFO\_PROTO\_MIDI1 or SNDRV\_UMP\_EP\_INFO\_PROTO\_MIDI2) in the upper byte and the jitter reduction timestamp (SNDRV\_UMP\_EP\_INFO\_PROTO\_JRTS\_TX and SNDRV\_UMP\_EP\_INFO\_PROTO\_JRTS\_RX) in the lower byte.

### Details about MIDI 2.0, MIDI-CI, Profiles and Property Exchange (Updated June, 2023) – MIDI.org
URL: https://midi.org/details-about-midi-2-0-midi-ci-profiles-and-property-exchange-updated-june-2023
One or more Profiles controllable by MIDI-CI Profile Configuration messages.
 Any Property Data exchange by MIDI-CI Property Exchange messages.
 Any Process Inquiry exchange by MIDI-CI Process Inquiry messages.

However to run the Universal MIDI Packet and take advantage of MIDI 2.0 Voice Channel messages with expanded resolution, there needs to be new specifications written for each transport. 

The new Universal Packet Format that will be common to all new transports defined by AMEI and The MIDI Associaton. The new Universal Packet contains both MIDI 1 .0 messages and MIDI 2.0 Voice Channel Messages plus some messages that can be used with both.

The most popular MIDI transport today is USB. The vast majority of MIDI products are connected to computers or hosts via USB. [...] The MIDI 1.0 Data Format defines the byte stream as a Status Byte followed by data bytes. Status bytes have the first bit set high. The number of data bytes is determined by the Status.

The Universal MIDI Packet (UMP) Format, introduced as part of MIDI 2.0, uses a packet-based data format instead of a byte stream. Packets can be 32 bits, 64 bits, 96 bits, or 128 bits in size.

This format, based on 32 bit words, is more friendly to modern processors and systems than the byte stream format of MIDI 1.0. It is well suited to transports and processing capabilities that are faster and more powerful than those when MIDI 1.0 was introduced in 1983.

The first nibble in each packet declares the Message Type. Each Message Type has a defined size and standard format. [...] ### NEW Common Rules for MIDI-CI Profiles, Version 1.1

The Common Rules for Profiles complements MIDI-CI by defining a set of design rules for all Profile Specifications.

Latest Notable Changes:

Update to align with updates to MIDI-C ...

### MIDI 2.0 Specification Overview, Version 1.0 - datahacker blog
URL: https://datahacker.blog/files/86/MIDI-20-Specifications/92/MIDI-20-Specification-Overview.pdf
is a "GM On" message but no reply from the Receiver. New MIDI-CI Profiles take advantage of two way communication. This document defines how specific Profile specifications should be written and how Devices that are compatible with MIDI-CI Profile Configuration should use Profiles. See the Common Rules for MIDI-CI Profiles for more details. 2.4 Common Rules for MIDI-CI Property Exchange Property Exchange is a set of mechanisms to get and set Device property data using JSON transmitted via MIDI-CI Universal System Exclusive messages. Property Exchange can allow Devices to auto map controllers, choose programs, change state and also provide visual editors to DAW’s without any prior knowledge of the Device or specially crafted software. This means that Devices could work on a wide range of [...] if they implement MIDI-CI plus any one or more of the following features: • One or more Profiles controllable by the use of MIDI-CI Profile Configuration messages. • Any Property Data exchange by the use of MIDI-CI Property Exchange messages. • MIDI 2.0 Channel Voice Messages as defined by the Universal MIDI Packet (UMP) Format and MIDI 2.0 Protocol. • Jitter Reduction Timestamps as defined by the Universal MIDI Packet (UMP) Format and MIDI 2.0 Protocol. • System Exclusive 8 as defined by the Universal MIDI Packet (UMP) Format and MIDI 2.0 Protocol. • Mixed Data Set as defined by the Universal MIDI Packet (UMP) Format and MIDI 2.0 Protocol. Note: See Appendix A of the MIDI Capability Inquiry (MIDI-CI) Version 1.1 specification for a list of the minimum requirements to implement MIDI-CI. [...] This means that Devices could work on a wide range of systems such as desktop operating systems, mobile devices, and web browsers and may provide tighter integrations with DAWs and hardware co ...


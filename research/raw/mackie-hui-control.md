# mackie-hui-control

QUERY: Mackie Control HUI protocol MIDI control surface specification open source implementation

## Synthesized answer
The Mackie Control HUI (Human User Interface) protocol is a 10‑bit (0‑1023) MIDI‑based control surface specification originally created in 1997 by Mackie and Digidesign for Pro Tools and later adopted by many DAWs (including Logic, Cubase, REAPER, Ableton Live, Ardour and Studio One) and hardware (e.g., SSL UF8, PreSonus FaderPort, Behringer X‑Touch); it defines a fixed set of MIDI messages for motorised fader position, transport (play/stop/record), channel‑strip pan, mute/solo, V‑pot rotary encoders and a 4‑character track name display, typically transmitted on channel 0 with CC 0‑31 for fader values and a series of System‑Exclusive and Note‑On/Off messages for button states. Although Mackie never released the official document and required NDA sign‑offs from licensees, a reverse‑engineered specification has been publicly posted as a PDF (often called “Mackie HUI MIDI control protocol”) and has been used as the basis for several open‑source implementations: the TouchMCU project on GitHub includes a complete markdown description and Arduino‑compatible code for HUI/MCU, an Arduino library for Mackie Control Universal (which also carries HUI support) is available, MusE’s Linux control‑surface module contains a clean‑room re‑implementation, and various community‑maintained fuzzy‑system scripts replicate the fader‑resolution mapping (using the least‑significant‑bit trick for 1024 steps). These resources collectively provide a workable open‑source reference for developers wanting to build or emulate an HUI‑compatible MIDI control surface.

## Sources

### Mackie HUI MIDI Control Protocol | PDF - Scribd
URL: https://www.scribd.com/document/235676955/Mackie-HUI-MIDI-control-protocol
This is a reversed engineered specification of the Mackie Human User Interface (HUI) MIDI control protocol. Open Source Fuzzy System

### Control Surface HUI protocol
URL: https://linuxmusicians.com/viewtopic.php?t=
MusE is a DAW for Linux with both MIDI and Audio editing. The only way to implement it would be to clean room reverse engineer it. Open Source

### Mackie Control and HUI - what are they? | VI-CONTROL
URL: https://vi-control.net/community/threads/mackie-control-and-hui-what-are-they.58351
The MCU communication protocol is used by many other hardware units, like the PreSonus FaderPort-8, and is open-source - this protocol is not likely to change or be discontinued any time soon. All in all, the MCU system is about the best there is for Logic, and even after all these years still holds up well when compared with EuCon, which is used by Avid controllers. EuCon has a few advantages but is NOT open-source and is not as widely adapted as MCU.  
  
All in all, an MCU controller is a safer and better bet than a HUI, but if you are getting a very cheap price on a HUI just check and make sure that your DAW software explicitly supports HUI protocol before plunking down the cash. [...] >   
> The MCU communication protocol is used by many other hardware units, like the PreSonus FaderPort-8, and is open-source - this protocol is not likely to change or be discontinued any time soon. All in all, the MCU system is about the best there is for Logic, and even after all these years still holds up well when compared with EuCon, which is used by Avid controllers. EuCon has a few advantages but is NOT open-source and is not as widely adapted as MCU.  
>   
> All in all, an MCU controller is a safer and better bet than a HUI, but if you are getting a very cheap price on a HUI just check and make sure that your DAW software explicitly supports HUI protocol before plunking down the cash.  
> [...] Awesome explanation. Thank you very much for your lengthy and thorough response! One thing I am still unclear about though is what exactly the protocol is/does. Does it automatically map everything to the DAW, or is it more like Mackie's proprietary MIDI where you will have to map everything yourself etc?  
  
The unit I have been offered is the Mackie Baby HUI, which is the smaller f ...

### Control Surface Protocols Compared: EUCON, HUI And Beyond | Audio Production: News, Tutorials & Reviews
URL: https://www.production-expert.com/production-expert-1/control-surface-protocols-compared-eucon-hui-and-beyond
HUI is a proprietary MIDI communications protocol for interfacing between a hardware audio control surface and digital audio workstation (DAW) software.
 It was developed in 1997 between Mackie and Digidesign for use with non-Digidesign control surfaces for Pro Tools.
 It supports motorised faders, transport controls (play, stop, record), panning, and basic plugin parameter control.
 While originally designed for the Mackie HUI hardware, the protocol is now used by many modern controllers (e.g., SSL UF8, PreSonus FaderPort and Behringer X-Touch) to interface with DAWs.
 It communicates via MIDI, either using 5-pin DIN MIDI cables or MIDI-over-USB.
 It is considered an older, slower protocol compared to EUCON, with limited support for complex plugin mapping. [...] In 2003, the Mackie Control Universal (MCU) protocol was introduced, combining functionality from Mackie Control, Logic Control and HUI into a single protocol.
 All the limitations of HUI still apply, as MCU is the current conduit for the HUI protocol. However, the 4-character track name limit has been increased to 6 or 7 characters, depending on the specific implementation and display configuration.
 HUI via MCU is the only way for 3rd-party control surfaces to interact with Avid’s Pro Tools, as Avid has ringfenced Eucon support for their own control surfaces as the interface for their own DAW.
 ‘HUI compatible control surfaces’ are still listed as supported in the Avid Knowledge Base article Pro Tools Supported Audio Hardware and Control Surfaces, last updated on June 17, 2025. [...] > When looking into the SSL UF8, I quickly realised that the engineers at SSL had overcome this issue by using the least significant bit (LSB) to achieve 1024 levels of fader resolution, which, to me, seemed incredible and made t ...

### Human User Interface Protocol - Wikipedia
URL: https://en.wikipedia.org/wiki/Human_User_Interface_Protocol
Android and Wi-Fi communication

Human User Interface Protocol (commonly abbreviated to HUI) is a proprietary MIDI communications protocol for interfacing between a hardware audio control surface and digital audio workstation (DAW) software. It was first created by Mackie "Mackie (company)") and Digidesign in 1997 for use with Pro Tools, and is now part of the Mackie Control Universal") (MCU) protocol.

## Functionality

[edit]

HUI protocol allows a digital audio workstation (DAW) and a connected hardware control surface to exchange MIDI signals that synchronize the states of their sliders, buttons, wheels, and displays. The user can write console automation which can then be seen in the DAW. It includes support for 10-bit/1,024 discrete values.

## History

[edit] [...] ## History

[edit]

The HUI protocol was created jointly by Mackie "Mackie (company)") and Digidesign in 1997 for Mackie's Human User Interface (HUI), the first non-Digidesign hardware control surface for Digidesign’s Pro Tools. It was subsequently implemented by hardware controllers from manufacturers such as Solid State Logic, Yamaha, TASCAM, and Novation.

By the time Mackie introduced the Baby HUI in August 2002, the protocol was also supported by DAWs including Digital Performer and Nuendo, making them cross-compatible with HUI-compatible hardware controllers. Other DAWs to support HUI protocol include Logic Pro, REAPER, and Cakewalk Sonar.

### Mackie Control Universal (MCU)

[edit")] [...] ### Mackie Control Universal (MCU)

[edit")]

In 2003, the Mackie Control Universal (MCU) protocol was introduced, combining together functionality from Mackie Control, Logic Control and HUI into a single protocol. DAWs which support MCU (in addition to those which support HUI) include Ardour "Ardour (software ...

### Control Surface HUI protocol - LinuxMusicians
URL: https://linuxmusicians.com/viewtopic.php?t=25489
The protocol specification not only isn't publically available, mackie also makes licensees sign a Non-disclosure agreement not to reveal the

### Add HUI MIDI Mapping Protocol - Feedback Loop
URL: https://discuss.cakewalk.com/topic/3008-add-hui-midi-mapping-protocol
The HUI MIDI mapping protocol is a proprietary communications protocol for interfacing between a hardware audio control surface and digital

### TouchMCU/doc/mackie_control_protocol.md at main
URL: https://github.com/NicoG60/TouchMCU/blob/main/doc/mackie_control_protocol.md
Protocol: HUI (Human User Interface); Interface: MIDI on 5-Pin DINs or a serial RS232/422 port. · Protocol: LCU (Logic Control Unit) · Protocol: MCU (Mackie


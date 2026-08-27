# dj-controller-standards

QUERY: DJ controller MIDI mapping standard HID mode jog wheel resolution Serato Traktor mapping files

## Synthesized answer
The de‑facto standard for modern DJ controllers that support both MIDI and HID is to use HID mode for any jog‑wheel work that requires high resolution, because traditional 7‑bit MIDI only supplies 0‑127 steps (14‑bit MIDI exists but most CDJ‑style units don’t implement it) whereas HID can transmit many more increments per turn; in practice Pioneer CDJs and many Serato‑certified accessories expose a 128‑step base count per full rotation and mapping files typically multiply that base to achieve smooth scrolling – the most common “range” value seen in Serato XML mappings is 1536 (128 × 12), although other mappings use 450, 1500 or similar counts depending on the wheel’s firmware; to enable these HID messages in Serato or Traktor you must set the unit’s HID mode to “Advanced” (or “Standard” for basic functionality) in the utility menu, then edit the controller’s XML (Serato) or .tsk/.tmi (Traktor) mapping file, inserting the desired range value for the jog‑wheel element and assigning the appropriate relative‑turn messages, which lets the software interpret each HID packet as a fine‑grained position change rather than the coarse 7‑bit steps of pure MIDI.

## Sources

### HID Mode / Midi, whats that all about? - General Discussion - DJ TechTools Forum
URL: https://forum.djtechtools.com/t/hid-mode-midi-whats-that-all-about/69137
HID stands for Human Interface Device. It’s a standard for input devices to a PC/MAC over USB, used for things like mouses, keyboards, etc.

Unlike MIDI, which sends standards based messages between devices, HID is dependent on the manufacturer of the controller to provide a driver for working with the hardware.

In the case of the CDJ’s, Serato and Traktor have HID drivers for the 2000’s and such.

Standard old-school MIDI only support 7-bit MIDI messages, meaning a control (knob, slider, etc) can have values in the range 0-128. This is far below what is needed for a high resolution pitch slider. There is a 14-bit MIDI standard, but the CDJ’s don’t support it as far as I know. [...] HID stands for Human Interface Device. It’s a standard for input devices to a PC/MAC over USB, used for things like mouses, keyboards, etc.

Unlike MIDI, which sends standards based messages between devices, HID is dependent on the manufacturer of the controller to provide a driver for working with the hardware.

In the case of the CDJ’s, Serato and Traktor have HID drivers for the 2000’s and such.

Standard old-school MIDI only support 7-bit MIDI messages, meaning a control (knob, slider, etc) can have values in the range 0-128. This is far below what is needed for a high resolution pitch slider. There is a 14-bit MIDI standard, but the CDJ’s don’t support it as far as I know. [...] Can I just stick with MIDI and use it for 2000/2000Nexus, 900/900Nexus and 850s (maybe XDJ-1000s)? Is HID a problem when considering the possibility that the CDJs are not firmware updated?

Thanks.

Use HID when possible. The CDJ’s ae absolutely terrible midi controllers. In HID they work amazing tho. Are you using traktor or Serato?

If you’re not using anything that isn’t on the CDJs, why bother with the lapt ...

### Hacking Serato DJ's MIDI Mapping: Jogwheels, Touchstrips, and Modifiers - DJ TechTools
URL: https://djtechtools.com/amp/2018/04/11/hacking-serato-djs-midi-mapping-jogwheels-touchstrips-and-modifiers
## The Code

Here’s the most interesting part of the article: the XML code. You just have to copy and paste it in your mapping, remembering to replace the CC and Note On numbers with the right ones for your controller. Also, remember to respect the MIDI markups at the beginning and the end of the XML mapping file. Another thing yo’ll have to change for your controller is the “range” variable in the jogwheel code. In the video and in the code below, the min and max range is 1536 – but why? I can’t give a precise answer for that. [...] In some mappings I have found during my research on this topic, usually the range is the number of messages that the wheel sends in one turn, and I found mappings with values of 1500, 450, 1800… but with the XDJ-700 I discovered that the jogwheel only sends a max of 128 messages in one turn. I tried with a value of 128 in the mapping, but the result was terrible, so I tried multiples of that value. Finally the value that worked best was 1536, that it’s 128 times 12.

## Jogwheel [...] DJ TechTools
DJ TechTools
DJ TechTools

# Hacking Serato DJ’s MIDI Mapping: Jogwheels, Touchstrips, and Modifiers

From the early years of Scratch Live to the current Serato DJ Pro, Serato has been relatively secretive about the MIDI implementation of their software. Though the software allows the use of any MIDI device, many features are only available on certified controllers. You can’t map your own jogwheels, functions like needle search / slicer are restricted, and there are no shift control layers or modifiers to create advanced mappings. In today’s tutorial, DJTT contributor Teo Tormo shares secrets for writing custom MIDI mappings for Serato DJ – including jogwheels, modifiers, and more.

### [SOLVED] CDJ 900 not able to map MIDI in SERATO.... ...
URL: https://forums.pioneerdj.com/hc/en-us/community/posts/203099259--SOLVED-CDJ-900-not-able-to-map-MIDI-in-SERATO-why
In the Utility Menu of the CDJ-900 (Press and hold the Menu button) have you changed HID Mode to "Advanced" rather than "Standard"? Now try to

### HELP! Pioneer DDJ-1000SRT “Jog Mode” function MIDI ...
URL: https://www.reddit.com/r/Beatmatch/comments/ou0kb8/help_pioneer_ddj1000srt_jog_mode_function_midi
Serato has a MIDI map mode that allows you to click on the function you want to map, then press the key or key combination on the hardware.

### MIDI mapping with Serato DJ Pro – Serato Support
URL: https://support.serato.com/hc/en-us/articles/209377487-MIDI-mapping-with-Serato-DJ-Pro
plugin badge
plugin badge
plugin badge

# How can we help?

# MIDI mapping with Serato DJ Pro

The MIDI feature in Serato DJ Pro is a great way to add flexibility to your performances by mapping frequently used Serato DJ Pro controls to your primary Serato DJ hardware, secondary MIDI controller, or Serato official accessory. Create, save, and customise your mapping to better suit your performance style. The following article will give some tips on: [...] Once in MIDI assign mode click a control on Serato DJ Pro, then press/move/twist the desired MIDI control on your Serato official accessory to map the two together. The grey "assign" box will turn blue when successfully assigned. If you make a mistake, press the ENTER key while the blue box is showing to revert the mapping. [...] Once in MIDI assign mode click a control on Serato DJ Pro, then press/move/twist the desired MIDI control on your hardware to map the two together. The grey "assign" box will turn blue when successfully assigned. If you make a mistake, press the ENTER key while the blue box is showing to revert the mapping. Some controls on Serato DJ Pro can have a secondary function by using CTRL + Click when mapping. For example, holding CTRL and clicking on the loop button allows you to MIDI map the Loop Trigger instead of Loop Toggle.

### Mapping Jogwheels 'like vinyl' in Traktor - Controller Mappings - DJ TechTools Forum
URL: https://forum.djtechtools.com/t/mapping-jogwheels-like-vinyl-in-traktor/74464
### Related topics

| Topic |  | Replies | Views | Activity |
 ---  --- 
| Jogwheel mapping in Traktor  Controller Mappings | 14 | 19649 | October 30, 2015 |
| Traktor Jog Turn problem.  Controller Mappings traktor ,  midi ,  ddj-s1 ,  ddj ,  pioneerdj | 23 | 8511 | August 14, 2017 |
| Help in JogWheels  Controller Mappings | 19 | 12013 | March 29, 2019 |
| make jogwheels less sensitive  Controller Mappings | 5 | 2445 | March 24, 2014 |
| Jog wheel mapping  Controller Mappings | 0 | 1974 | May 23, 2010 |

Powered by Discourse, best viewed with JavaScript enabled [...] Jog Touch On is the equivalent of putting your hand on the record to stop it or lifting it to resume playback. You’d map this to the message your controller sends when you touch the top of the jogwheel. If you only map Jog Turn without mapping Touch On it’s basically like adjusting the record to beat match rather than scratching (since the record isn’t stopping).

### Related topics [...] I don’t know a lot about scratch but you might wanna try:

Flux mode might be involved? left click on the button “focus deck X” (deck letter)

Are you using traktor scratch pro or traktor pro?

Seek position is the equivalent of lifting the needle and moving it around the record so not exactly what you want.

Jog Turn is what you want, it works best with relative commands like jogwheels, you might just need to tweak the sensitivity to the right value for your device so you don’t get label slip. You map this to turning the jogwheel (without touching the top)

### MCX8000 Traktor Pro 2 midi mapping Jog-LED's? - Controllers - Engine DJ Community
URL: https://community.enginedj.com/t/mcx8000-traktor-pro-2-midi-mapping-jog-leds/1743
Friendly greetings, Kristof

Hey Kristof, I’ve been testing a patch recently but honestly don’t remember if the leds were rotating. Would you like me to send you the procedure ?

Hi KristofSt, great to see someone working on a Traktor mapping for the MCX8000! If you could find it in your heart to share your mapping once you are done I would be very grateful. I got my MCX8000 a couple of months ago which has forced me to move to Serato after being a Traktor user for years. There are many things I prefer about Traktor but mostly I miss playing with Stems and Remix decks. Of course, I guess we can never get the screens to work with Traktor. Good luck with your mapping!

Cheers

Hi sseroussi [...] Hi everyone
After a few busy days (weeks) at work I finally found time to complete my personal Traktor Midi Mapping for my MCX8000 controller.

After stress-testing the MCX8000 in conjunction with the Traktor mapping at home, I played a 5 hour set in public last Saturday. All went well and no issue’s occurred.
The mapping is made for my PERSONAL usage, for 2 or 4 Deck use (All Track Decks, NO remix decks, with 1-button-push effects)

In CUE mode:
All PADS assigned to corresponding cue points

In ROLL mode:
PAD1: Filter 92 LFO
PAD2: Reverb T3
PAD3: Peak Filter RISE
PAD4: Peak Filter FALL
PAD5: Beatsmasher2 – Value 1
PAD6: Beatsmasher2 – Value 2
PAD7: Beatsmasher2 – Value 3
PAD8: Beatsmasher2 – Value 4 [...] Maybe have the leds timed with beatgrid? 1/48th notes for the number of led’s in the circle? I used to have a vestax vci 400 with a custom mapping in traktor 2 that allowed for a selection of 4 leds to blink in time with the beatgrid. IDK. i doubt its “impossible” to mod the thing to do anything. The LCDs work with VDJ and Serato, which is indicative of the unit having the capab ...

### Jog wheel configuration mapping settings - Facebook
URL: https://www.facebook.com/groups/780187232400212/posts/1179396162479315
DJay Pro offers flexible mapping options for various controllers, How to adjust jog wheel settings on Roland DJ controllers? Traktor Kontrol S4


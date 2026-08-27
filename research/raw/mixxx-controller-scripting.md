# mixxx-controller-scripting

QUERY: Mixxx controller mapping JavaScript API HID MIDI mapping XML documentation

## Synthesized answer
Mixxx controller mappings are defined in XML files that specify the controller name, the type (MIDI or HID), and the JavaScript script files to load; each `<controller>` element can include a `<scriptfiles>` list that points to one or more .js files containing QtScript (ECMAScript) functions such as init and shutdown and any custom handlers, and a `<mappings>` section that links individual MIDI or HID messages (identified by status, midino, or HID packet fields) to script functions via a `<key>` tag and a `<Script‑Binding/>` option; the JavaScript API is exposed through a set of declaration files (e.g., engine-api.d.ts, hid-controller-api.d.ts, midi-controller-api.d.ts, console-api.d.ts, color-mapper-api.d.ts) and common helper scripts (common‑controller‑scripts.js, common‑hid‑packet‑parser.js) which are referenced in a jsconfig.json file to enable IDE type checking, and the XML mapping may also contain optional `<settings>` groups for configurable options that the script can read; the controller wizard can generate a basic XML preset for MIDI devices, which you can edit manually to add HID support or more complex behavior, and any additional JavaScript files must be placed alongside the XML in the user controller mapping folder and listed exactly as they appear in the `<scriptfiles>` section.

## Sources

### Midi Controller Mapping File Format · mixxxdj/mixxx Wiki · GitHub
URL: https://github.com/mixxxdj/mixxx/wiki/MIDI-controller-mapping-file-format
ronso0 edited this page Jun 1, 2023 · 5 revisions

Support for additional MIDI devices can be added to Mixxx by creating a new "MIDI preset" file. This file tells Mixxx how to translate, or map, MIDI messages from a controller into commands that Mixxx understands.

The easiest way to create a new MIDI preset is by using the MIDI Learning Wizard in the Preferences > Controllers. This will generate an XML file located in the user controller mapping folder. You can then modify this XML file it creates (or any of the ones that ship with Mixxx or found on the forum) using the information on this page. This will work for most basic functions on most controllers, but most controllers will require some use of MIDI scripting with JavaScript for a complete mapping. [...] Each XML mapping file starts with a header with metadata:

```
    Example MIDI Preset for Mixxx Tom Care This is an example XML MIDI preset for Mixxx. The scope of the preset could be from a small functionality addition, to a complete mapping for a controller, to a complex personal setup with multiple controllers. This description is intended for distribution and could include comments about the extent of the functionality. Encoded URL to Mixxx wiki page documenting this controller mapping Encoded URL to Mixxx discussion forums page for this controller mapping    
``` [...] NOTE: Due to an influx of spam we were forced to make the wiki read-only. If you'd like to change a page, please file an issue on Github or Zulip and post your changes there. Thank you.

Mixxx is a free and open-source DJ software.

Wiki Home  
 Website

Manual  
 Hardware Compatibility  
 Reporting Bugs  
 Getting Involved

Contribution Guidelines  
 Coding Guidelines  
 Using Git  
 Developer Guide  
 Creating Skins

## Mapping Creators

Co ...

### 14. Advanced Topics — Mixxx User Manual
URL: https://manual.mixxx.org/2.4/en/chapters/advanced_topics
The Controller wizard saves the new mapping to the `controllers` directory in the user settings directory, see The Mixxx Settings Directory.

You can then modify the XML file it creates (or any of the ones that ship with Mixxx) if you’d like to fine-tune it or add more mappings. For more information, go to .

The Controller Wizard works only for MIDI devices. Currently you can’t map modifier (shift) keys and platter rotations. Use MIDI Scripting instead.

### MIDI Scripting

In order to support the advanced features of many MIDI/HID controllers, Mixxx offers what we call MIDI Scripting. [...] You're reading the manual for Mixxx 2.4. If you're using another version, please select it in the sidebar. The latest Mixxx release is version 2.5.

 14. Advanced Topics
 Edit on GitHub

# 14. Advanced Topics

## 14.1. Adding support for your MIDI/HID Controller

With several dozens of DJ controllers supported out-of-the-box, Mixxx gives you comprehensive hardware control for your DJ mixes, see Using MIDI/HID Controllers.

Support for additional devices can be added to Mixxx by creating a new mapping file. This file tells Mixxx how to translate, or map, MIDI/HID messages from a controller into commands that Mixxx understands.

You can download and share custom controller mappings in the Mixxx User Controller Mapping forums. [...] It enables MIDI controls to be mapped to QtScript (aka Javascript/EMCAScript) functions stored in function library files, freeing Mixxx from a one-to-one MIDI mapping ideology. These user-created functions can then do anything desired with the MIDI event such as have a single controller button simultaneously affect two or more Mixxx properties (“controls”), adjust incoming control values to work better with Mixxx (scratching), display a complex LED sequ ...

### 14. Advanced Topics — Mixxx User Manual
URL: https://manual.mixxx.org/2.3/en/chapters/advanced_topics
The Controller wizard saves the new mapping to the `controllers` directory in the user settings directory, see The Mixxx Settings Directory.

You can then modify the XML file it creates (or any of the ones that ship with Mixxx) if you’d like to fine-tune it or add more mappings. For more information, go to .

The Controller Wizard works only for MIDI devices. Currently you can’t map modifier (shift) keys and platter rotations. Use MIDI Scripting instead.

### MIDI Scripting

In order to support the advanced features of many MIDI/HID controllers, Mixxx offers what we call MIDI Scripting. [...] You're reading the manual for Mixxx 2.3. If you're using another version, please select it in the sidebar. The latest Mixxx release is version 2.5.

 14. Advanced Topics
 Edit on GitHub

# 14. Advanced Topics

## 14.1. Adding support for your MIDI/HID Controller

With several dozens of DJ controllers supported out-of-the-box, Mixxx gives you comprehensive hardware control for your DJ mixes, see Using MIDI/HID Controllers.

Support for additional devices can be added to Mixxx by creating a new mapping file. This file tells Mixxx how to translate, or map, MIDI/HID messages from a controller into commands that Mixxx understands.

You can download and share custom controller mappings in the Mixxx User Controller Mapping forums. [...] It enables MIDI controls to be mapped to QtScript (aka Javascript/EMCAScript) functions stored in function library files, freeing Mixxx from a one-to-one MIDI mapping ideology. These user-created functions can then do anything desired with the MIDI event such as have a single controller button simultaneously affect two or more Mixxx properties (“controls”), adjust incoming control values to work better with Mixxx (scratching), display a complex LED sequ ...

### HID controller mapping - mixxxdj/mixxx Wiki - GitHub
URL: https://github.com/mixxxdj/mixxx/wiki/Hid-Mapping
Create an XML file that tells Mixxx the name of the controller and which script file(s) to load, just like with MIDI scripting but make sure to

### Mixxx - Controller API declarations for JavaScript mapping developers
URL: https://mixxx.org/news/2024-08-18-controller-api-declartions
The content of the jsconfig.json:

`The compilerOptions`
`jsconfig.json`
`common-controller-scripts.js`
`common-hid-packet-parser.js`
`engine-api.d.ts`
`color-mapper-api.d.ts`
`console-api.d.ts`
`hid-controller-api.d.ts`
`hid-controller-api.d.ts`
`midi-controller-api.d.ts`

The .js files listed in the include section of the `jsconfig.json` must exactly match the files in the `<scriptfiles>` section of the controller mappings .xml file. But, note that the .xml only contains the file names, while the `jsconfig.json` requires the full paths (relative to the position of the `jsconfig.json` file).

`jsconfig.json`
`<scriptfiles>`
`jsconfig.json`
`jsconfig.json` [...] Mixxx

# Controller API declarations for JavaScript mapping developers

Date
Sun 18 August 2024

Author
Jörg Wartenberg

Tag
2.4,
controller

Date
Author
Tag

If the support of a DJ controller requires more than the semantic 1:1 mapping of MIDI codes, Mixxx offers the possibility to use freely programmable Javascript code to implement such more complex functionalities.

The Mixxx internal Application Programming Interface (API) for such controller scripts was previously only partially documented, in the Mixxx Wiki. [...] `controllers`
`common-controller-scripts.js`
`controllers`
`./mixxx/res/controllers`
`jsconfig.json`
`controllers`
`Mixxx Settings Directory`

The `jsconfig.json` must have a content like this:

`jsconfig.json`
`{
"compilerOptions": {
"target": "es6",
"checkJs": true,
"lib": [ "ES2016" ]
},
"include": [
"./filename_of_your_controller_script.js",
"C:/Program Files/Mixxx/controllers/common-controller-scripts.js",
"C:/Program Files/Mixxx/controllers/common-hid-packet-parser.js",
"C:/Program Files/Mixxx/controllers/engine-api.d.ts",
"C:/Program Files/Mixxx/controllers/color-mapper-api.d.ts",
"C:/Pro ...

### 7. Controlling Mixxx — Mixxx User Manual
URL: https://manual.mixxx.org/2.3/en/chapters/controlling_mixxx
`.zip`
`.zip`
`.xml`
`.js`

### Map your own controller

There is no mapping available for your controller or you want to change an
existing mapping? You can map your controller by using the Controller Wizard or
take full control with the MIDI Scripting support in Mixxx.

See also

Go to Adding support for your MIDI/HID Controller for detailed information.

## 7.4. Using Timecode Vinyl Records and CDs

Vinyl control allows a user to manipulate the playback of a track in
Mixxx using a turntable or CDJ as an interface. In effect, it simulates
the sound and feel of having your digital music collection on vinyl. Many DJs
prefer the tactile feel of vinyl, and vinyl control allows that feel to be
preserved while retaining the benefits of using digital audio.

See also [...] ### Supported controllers

Mixxx can use any MIDI/HID controller that is recognized by your
OS (some may require drivers), as long as there is a
MIDI/HID mapping file to tell Mixxx how to understand it. Mixxx comes bundled
with a number of mappings for various devices. There are two levels of
controller mappings:

Mixxx Certified Mappings: These mappings are verified by the Mixxx
Development Team.

Community Supported Mappings: These mappings are provided and have been
verified as working by the Mixxx community, but the Mixxx Development Team is
unable to verify their quality because we don’t have the devices ourselves.
They might have bugs or rough edges. [...] ### Installing a mapping from the forum

To use a controller mapping that did not come bundled with Mixxx, place the
controller mapping in your User Mappings folder. To open it , go to Preferences ‣ Controllers and click the
Open User Mapping Folder button. Alternatively, use your OS file browser to navigate there. The locations and more detail ...

### Hercules RMX HID-mapping - Controller mappings - Mixxx
URL: https://mixxx.discourse.group/t/hercules-rmx-hid-mapping/14157
That’s all, this is a very personal setup, but if you have some particular requests maybe I can do something to write a customized version of the script.  
Hercules-DJ-Console-RMX-hid-scripts-v2.js (35.6 KB)  
Hercules\_DJ\_Console\_RMX\_\_5.hid.xml (629 Bytes)

Don’t ask me why, but now it works (complete reinstallation) with the MIDI controller entry in the controller section of the settings. Thanks for your suggestions! :slight_smile:

:slight_smile:

And thanks to N@z for optimizing the mapping for us RMX users. :slight_smile: :slight_smile:

:slight_smile:
:slight_smile: [...] I think that’s all, the other features are the same of the “basic” configuration.  
I have some issues with the LEDs, because the “Beat Lock” and “Source 2” on the right-hand side always blink, instead of remaining still. I tried to add the code posted by Mankir, but with no success. :confused:

:confused:

Please, tell me what you think of this mapping and if you have a solution for the LEDs issue.

Thank you.  
Hercules\_DJ\_Console\_RMX\_\_5.hid.xml (629 Bytes)  
Hercules-DJ-Console-RMX-hid-scripts-v2.js (34.4 KB)

Thanks for letting our RMX console live a few more years with Mixxx. :slight_smile:

:slight_smile:

I’m not able to use my RMX to control Mixxx. I use Mixxx 2.0 x64 on Win 7 x64 with driver package 6.HDJS.2015.

In the controller panel I can see 3 controllers [...] TO DO:

Flanger adjustable parameters have weird values in the script. I added these weird values just because in this way knobs position on the controller matches with knobs position on the software, but I think it could be implemented better.

Add soft-takeover on knobs when passing from flanger-parameters adjusting to eq-parameters adjusting.

Add a way to move loop in/out positions (when manually looping).

(mayb ...

### MIDI Scripting · mixxxdj/mixxx Wiki · GitHub
URL: https://github.com/mixxxdj/mixxx/wiki/midi-scripting
`MyController`

### Link MIDI input signals to JavaScript

To link a script function to an incoming MIDI message, put the full
function name in the `<key>` tag of the MIDI message's `<control>`
element in the XML file, with a `<Script-Binding/>` tag in the
`<options>` block, like so:

`<key>`
`<control>`
`<Script-Binding/>`
`<options>`

The value for `<group>` doesn't matter when using a script function, but
it is available to the script function as an extra parameter. This can
be useful so one script function can be used for manipulate decks.

`<group>`

When Mixxx receives a MIDI signal with the first two bytes matching the
`<status>` and `<midino>` elements, the named script function is
called. That function then determines how to change the state of Mixxx
and/or script variables. [...] Tip: When you're testing your scripts, you don't have to restart
Mixxx. Every time you save your file, Mixxx will reload it immediately.
This can make testing changes very fast.

## Set up a JavaScript mapping

### Specify the JS file

All JavaScript files need an accompanying XML mapping
file. See the controller
mapping file locations for
where to put mapping files on your OS.

To specify script files to load, add the following section to the
device's XML file inside the <controller> tag:

The functionprefix attribute specifies the name of the JavaScript object
in the file that has init and shutdown methods called when the
controller is opened and closed by Mixxx (typically when the user opens
and closes Mixxx). [...] ## Settings API

The Settings API is a feature in Mixxx that allows controllers to define optional or alternative behaviors. These settings are defined using XML and can be accessed through JavaScript.

### Defining Settings with XML

Settings are defined within the `<s ...


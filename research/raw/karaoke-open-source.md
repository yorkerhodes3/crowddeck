# karaoke-open-source

QUERY: open source karaoke software Karaoke Eternal OpenKJ Vocaluxe Performous features CDG

## Synthesized answer
Karaoke Eternal is a self‑hosted, browser‑based karaoke party system that plays MP3+G (CDG) files and MP4 videos, offers QR‑code joining, multiple password‑protected rooms, dynamic fair queues, music‑synced visualizations and runs without ads or telemetry; OpenKJ is a cross‑platform open‑source karaoke‑show host built with Qt and GStreamer that handles MP3/OGG/WAV paired with CDG (including zip bundles), provides key‑changing, tempo control, EQ, end‑of‑track silence detection, rotating CDG backgrounds, remote song‑request integration, automatic performance recording and autoplay mode; Vocaluxe is a free open‑source singing game derived from Ultrastar that supports up to six players, reads CDG/MP3+G tracks, scores based on pitch and rhythm and includes party‑mode features; Performous is an open‑source music and dance simulation with a karaoke mode that loads CDG files (MP3+G), offers real‑time pitch detection, scoring, practice tools and visualizations, making all four projects capable of playing CDG karaoke content.

## Sources

### GitHub - OpenKJ/OpenKJ: Open source karaoke show hosting software. · GitHub
URL: https://github.com/OpenKJ/OpenKJ
Save/track/load regular singers
 Key changer
 Tempo control
 EQ
 End of track silence detection (after last CDG draw command)
 Rotation ticker on the CDG display
 Option to use a custom background or display a rotating slide show on the CDG output dialog while idle
 Fades break music in and out automatically when karaoke tracks start/end
 Remote request server integration allowing singers to look up and submit songs via the web or mobile apps
 Automatic performance recording
 Autoplay karaoke mode
 Lots of other little things [...] It currently handles media+g zip files (zip files containing an mp3, wav, or ogg file and a cdg file) and paired mp3 and cdg files. I'll be adding others in the future if anyone expresses interest. It also can play non-cdg based video files (mkv, mp4, mpg, avi) for both break music and karaoke.

Database entries for the songs are based on the file naming scheme. I've included the common ones I've come across which should cover 90% of what's out there. Custom patterns can be also defined in the program using regular expressions.

Requirements to build OpenKJ:

 Qt 5.x
 gstreamer 1.4 or above
 spdlog
 taglib

Linux

Build using cmake from the command line or in your IDE of choice

Mac [...] Mac

Building now works on OS X in Qt Creator using the native xcode compiler. Use the latest stable version of the GStreamer SDK from .

Windows

Building now works on Windows in Qt Creator using the msvc build system (both 32 and 64 bit). Use the latest stable version of the GStreamer SDK from . You will likely need to modify the paths in the OpenKJ.pro file to match your devel environment. Installers can be found at  if you just want to run the software and not build it yourself or help out with development.

## About

Open source karaoke show hosting sof ...

### Karaoke Eternal | Open karaoke party system
URL: https://www.karaoke-eternal.com
## Features

 Plays:
  + MP3+G (MP3 with CDG lyrics; including zipped)
  + MP4 videos
  + Music-synced visualizations (with automatic lyrics background removal)
 Fast, modern mobile browser app designed for “karaoke conditions”
 Easy joining with QR codes and guest accounts
 Multiple simultaneous rooms/queues (optionally password-protected)
 Dynamic queues keep parties fair, fun and no-fuss
 Fully self-hosted
 No ads or telemetry

Microphones are not required since the player itself only outputs music - this allows your audio setup to be as simple or complex as you like. See the F.A.Q. for more information.

## Getting Started

Karaoke Eternal basically has 3 parts. See Getting Started to get up and running step-by-step, or jump to the documentation for each part below: [...] KaraokeEternal 

Open karaoke party system

GitHub

Star

Sponsor

# Overview

Host awesome karaoke parties where everyone can easily find and queue songs from their phone’s browser. The player is also fully browser-based with support for MP3+G, MP4 videos and WebGL visualizations. The server is self-hosted and runs on nearly everything.

 app-library.png   app-library.png
 app-queue.png   app-queue.png
 app-account.png   app-account.png
 app-displayctrl.png   app-displayctrl.png
 app-player.jpg   app-player.jpg

App in mobile browser (top) controlling player in desktop browser (bottom)

## Features [...] See the GitHub project page.

## Acknowledgements

 David Zukowski: react-redux-starter-kit, which this project began as a fork of (all contributors up until it was detached to its own project are listed on the Contributors page)
 Luke Tucker: the original JavaScript CD+Graphics implementation
 Mic favicon by Freepik from flaticon.com

©2025 RadRoot LLC

### More Karaoke!
URL: https://mugen.karaokes.moe/en/links.html
# Karaoke Mugen

## More Karaoke!

gif

gif

Karaoke Mugen isn’t the only group spreading the love for karaoke– there are others too! Some of them even allow you to freely use their database.

Do you know other groups making and enjoying karaoke? Contact us so we can add them!

## Other open source karaoke software

There’s no shortage of open source karaoke software! If Karaoke Mugen doesn’t suit your needs, try to look at those.

Karaoke Eternal : Another software made for parties and events, a little like Karaoke Mugen! Its big difference is its modularity and that it handles the CD+G karaoke format. The main developer is also awesome.

Ultrastar Deluxe : The SingStar clone no one bothers to introduce anymore. [...] OpenKJ : A cloud-based karaoke solution which allows to manage karaoke sessions where people take turns singing, modify tempo, key, and other things.

KaraKara : KaraKara is another karaoke system for events like conventions with a good number of guests. It has a complete tag system, a queue manager with priority tokens and other fun stuff.

Spivak : Standalone karaoke player with a simple web interface to manage the song queue. It can use a wide variety of karaoke formats (but not ASS!)

Vocaluxe : A young alternative to Ultrastar but with quite some promises, especially if you’re looking for some fun party modes.

Ponytone : A multiplayer and online karaoke game specializing in My Little Pony songs.

### Create karaokes

## Other karaoke lovers

### Worldwide

### United States [...] ## Other karaoke lovers

### Worldwide

### United States

### France

### Git

## About Us

We are fans of japanese culture who spend their free time making the world more fun by overloading it with karaoke.

Contact us - Forum

Language :

Français
English

Donations

Don ...

### UltraStar Deluxe VS Performous - compare differences & reviews?
URL: https://www.saashub.com/compare-ultrastar-deluxe-vs-performous
If you're looking for something that's more akin to a videogame, Performous is great: https://performous.org. Source: over 3 years ago ... Vocaluxe - Vocaluxe is a free and open source singing game, inspired by Ultrastar (Deluxe) project. It allows up to six players to sing along with music using microphones in order to score points, depending on the pitch of the voice and the rhythm of singing. OpenKJ - Open source cross platform karaoke hosting software

### OpenKJ Project
URL: https://openkj.org
##### Welcome to the OpenKJ Project

The OpenKJ Project is a collection of applications and services intended to make life easier for karaoke DJs.

Most of the programs and web services are things that were originally written by the creator of OpenKJ, Isaac Lightburn, for use at his own karaoke shows which were later released to the public.

While there are a few proprietary pieces on the web services side by necessity, most of the software is free and open source.

Want to support OpenKJ's continuing development? Donate via the donate tab or become a patron!  
  
 Become a Patron!

  
   
  
  
  
  [](

### CDG | Open Source Karaoke Tools
URL: https://kibosh.org/tag/cdg/index.html
It supports playback of the common CD+G Karaoke format (MP3+G and WAV+G files), and benefits from the years of CD+G format testing enjoyed

### UltraStar Deluxe VS Vocaluxe - compare differences & reviews?
URL: https://www.saashub.com/compare-ultrastar-deluxe-vs-vocaluxe
... UltraStar WorldParty - UltraStar WorldParty is a karaoke game for PC created by UltraStar España inspired in SingStar · OpenKJ - Open source cross platform karaoke hosting software · Performous - Performous is a Music and Dancing Simulation released by Loud Arts.

### Software - OpenKJ Project
URL: https://openkj.org/software
##### OpenKJ

OpenKJ is cross-platform open source karaoke hosting software licensed under the GPL version 3.

It is developed on Linux (fedora, specifically) and built and tested on Linux, MacOS, and Windows.
In theory it should build fine on the BSDs as well, but nobody has verified that.

It also now features integration with OpenKJ Songbook for web based search and song submission.

This was the application that got the OpenKJ Project started. It was originally created because I wanted to host my shows on Linux
but there were no viable hosting applications on that platform at the time.

##### Current stable version downloads

IMPORTANT! Linux users: Read this if you're upgrading from an rpm or deb based install

Other versions

##### OpenKJ Tools [...] Other versions

##### OpenKJ Tools

OpenKJ Tools is a collection of tools to help maintain your karaoke library.

It currently has the following capabilities: [...] KaraokeRG - A simple wrapper around the mp3gain program that allows you to easily apply ReplayGain adjustments
  to your mp3+g zip collection.
 Zip - Finds any matched pairs of mp3 and cdg files and creates a zip file. Optionally deletes the original cdg
  and mp3 files after zipping.
 UnZip - Unzips karaoke zip files back into separate mp3 and cdg files. Optionally deletes the zip file after
  decompression.
 ZipFix - Finds any karaoke zip files in your library which aren't using non standard DEFLATE64 compression, unzips
  them using 7zip, and then creates new standard zip files. Useful for fixing compatibility of zip files in
  your library when older versions of OpenKJ give you "Unsupported Compression Method" errors while importing


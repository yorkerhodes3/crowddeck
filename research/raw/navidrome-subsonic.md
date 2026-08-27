# navidrome-subsonic

QUERY: Navidrome features Subsonic API self hosted music server playlists smart playlists

## Synthesized answer
Navidrome is an open‑source, self‑hosted music streaming server that indexes your local collection and makes it accessible via a modern web UI as well as any Subsonic‑compatible client, offering full Subsonic API support for tag‑based browsing, folder‑style navigation, playback, transcoding, jukebox mode, bookmarks, star ratings, scrobbling to Last.fm, ListenBrainz and Maloja, and public sharing links. It provides comprehensive playlist capabilities, including import and synchronization of .m3u files, creation and editing of regular playlists, and smart or dynamic playlists that automatically update based on tag criteria similar to iTunes, all while supporting on‑the‑fly transcoding (including Opus), multi‑user accounts, external authentication, and integration with numerous mobile and desktop apps that speak the Subsonic API.

## Sources

### First-class support for Navidrome API - Feature requests - Symfonium support
URL: https://support.symfonium.app/t/first-class-support-for-navidrome-api/6861
# First-class support for Navidrome API

# Feature description:

With Navidrome slowly becoming a leader in the self-hosted music space, it would be great to have full support for the Navidrome API, not just OpenSubsonic.

### Problem solved:

This will become increasingly import as new features added to Navidrome, like Navidrome’s native smart playlist (currently in beta testing), will be read-only and not editable from Symfonium. We will then have two smart playlists: those created on Navidrome and those created on Symfonium.

### Brought benefits:

Much smoother and more seamless integration.

### Other application solutions:

### Additional description and context:

### Screenshots / Mockup:

This won’t happens. [...] That does not change anything for Symfonium POV.

Got it, thanks for explaining. So then our mission is to lobby Deluan to push it to OS :smiling_imp:

:smiling_imp:

Seems like there is interest in adding it to Subsonic! Smart Playlists · Issue #1417 · navidrome/navidrome · GitHub

Powered by Discourse, best viewed with JavaScript enabled [...] ### Screenshots / Mockup:

This won’t happens.

There’s Open subsonic created to add things to a public documented and stable API.

If you want more features of Navidrome supported you need to push them in OS.

OS was created by me with Deluan as a decision instead of building and pushing the Navidrome API.

I see. But I’m confused: OS does support editing smart playlist then? If so, why would Deluan make Smart Playlist only editable through the Navidrome API instead of OS? See Smart Playlists · Issue #1417 · navidrome/navidrome · GitHub

It’s not in OS yet and Deluan chose to implement it in his own API instead of pushing to OS because it was there before probably and lack of time or interest.

That does not c ...

### Self Host Navidrome - A Modern Music Server and Streamer
URL: https://noted.lol/self-host-navidrome-a-modern-music-server-and-streamer
### What is Navidrome?

Navidrome is a self-hosted, open source music server and streamer. It gives you freedom to listen to your music collection from any browser or mobile device. It is a piece of software that allows you to listen to your own digital music in the same way you would with services like Spotify, Apple Music and others. It also allows you to easily share your music and playlists with your friends and family.

### How Navidrome Works

After a simple installation, Navidrome indexes all digital music stored in your hard drive and makes it available through a nice web player and also by using any Subsonic-API compatible mobile client. Your music becomes searchable and you can create playlists, rate and “favorite” your loved tracks, albums and artists. [...] ### Navidrome and Subsonic/Airsonic

Besides its own Web UI, Navidrome is compatible with all Subsonic clients. The following clients are tested and confirmed to work properly.

 iOS: play:Sub, substreamer, Amperfy and iSub
 Android: DSub, Subtracks, substreamer, Ultrasonic and Audinaut
 Web: Subplayer, Airsonic Refix, Aurial, Jamstash and Subfire
 Desktop: Sublime Music (Linux) and Sonixd (Windows/Linux/macOS)
 CLI: Jellycli (Windows/Linux) and STMP (Linux/macOS)
 Connected Speakers:
 Sonos: bonob
 Alexa: AskSonic
 Other:
 Subsonic Kodi Plugin
 Navidrome Kodi Plugin
 HTTPDirFS

I chose to use Substreamer on my iPhone for this example. I was easily able to connect to the Navidrome server by adding the URL into the settings of the Substreamer app. [...] Skip to Sidebar Skip to Content

Noted Noted

# Self Host Navidrome - A Modern Music Server and Streamer

 Jeremy  by Jeremy

  Jeremy  Jeremy

  Hello! I'm Jeremy, the creative force behind Noted. With a blend of self-taught expertise in homelab tech and p ...

### About Navidrome | Navidrome
URL: https://www.navidrome.org/about
# About Navidrome

Navidrome is a self-hosted, open source music server and streamer. It gives you freedom to listen to your music collection from any browser or mobile device.

### What exactly is Navidrome?

It is a piece of software that allows you to listen to your own digital music in the same way you would with services like Spotify, Apple Music and others. It also allows you to easily share your music and playlists with your friends and family

### How it works?

After a simple installation, Navidrome indexes all digital music stored in your hard drive and makes it available through a nice web player and also by using any Subsonic-API compatible mobile client. Your music becomes searchable and you can create playlists, rate and “favourite” your loved tracks, albums and artists

### Enhancing Local Media Playback with Subsonic API Integration | Page 2 | WiiM
URL: https://forum.wiimhome.com/threads/enhancing-local-media-playback-with-subsonic-api-integration.7054/page-2
I’ve tried multiple applications for integrating my music collection, from Plex to DLNA and Lyrion Music Server, but all of them come with significant limitations.  
   
 Currently, I use Navidrome (running in a Docker instance) to stream music to my mobile phone. It’s a powerful solution, especially for creating smart playlists based on any tag in my music library and for displaying album artwork, artist images, and more. Navidrome is also accessible through the Subsonic API (in my mobile I use an app called substreamer to access it). [...] Messages
:   6,654

 #23

> pvdputte said:
>
> I was just about to post a feature request for Subsonic API integration when I found this topic.  
>    
>  +1 from me! (think about the upvote button :)") )  
>    
>  I've been using Ampache for many years as my music server of choice and am very happy with it. Its Subsonic API support allows me to play it all in my car over Android Auto (using the DSub app but there are others).  
>    
>  In fact, having Subsonic API support would allow you to connect to a multitude of other music servers:  
>
>  Navidrome
>  Gonic
>  LMS
>  Nextcloud Music
>  Airsonic-Advanced
>  Ampache
>  Funkwhale
>  Supysonic
>
> I shamelessly stole this list from the information available in the SuperSonic client's GitHub README: 
>
> Click to expand... [...] Joined
:   Nov 21, 2024

Messages
:   11

 #22

I was just about to post a feature request for Subsonic API integration when I found this topic.  
   
 +1 from me! (think about the upvote button :)") )  
   
 I've been using Ampache for many years as my music server of choice and am very happy with it. Its Subsonic API support allows me to play it all in my car over Android Auto (using the DSub app but there are others).  
   
 In fact, having Subsonic AP ...

### Navidrome | NetActuate Media Marketplace
URL: https://www.netactuate.com/marketplace/navidrome
Navidrome is a self-hosted music streaming server. It handles large libraries, multiple users, playlists, transcoding on the fly and smart playlists, and it is

### Navidrome: Self-Hosted Music Streaming Server | DEV.co
URL: https://dev.co/devops/open-source/navidrome
| Field | Value |
 --- |
| Repository | navidrome/navidrome |
| Owner | navidrome |
| Primary language | Go |
| License | GPL-3.0 — OSI-approved |
| Stars | 22.2k |
| Forks | 1.6k |
| Open issues | 215 |
| Latest release | v0.62.0 (2026-06-08) |
| Last updated | 2026-07-07 |
| Source |  |

## What navidrome is

Written in Go, Navidrome provides a web-based music collection server with Subsonic API compatibility, multi-user support, on-the-fly transcoding (including Opus), metadata reading, and library monitoring. It runs on macOS, Linux, Windows, and Raspberry Pi with low resource overhead.

Quickstart

## Get the navidrome source

Clone the repository and explore it locally.

terminalbash [...] DEV.co

LoginBook a Call

Open-Source DevOps · navidrome

# navidrome

Navidrome is an open-source, self-hosted music streaming server that lets you build a personal Spotify-like service from your own music collection. It supports large libraries, multiple users, transcoding, and is compatible with Subsonic/Airsonic clients across web and mobile platforms.

Talk to DEV.coDiscuss Implementation

Source: GitHub — github.com/navidrome/navidrome

GitHub stars

Forks

Go

Primary language

GPL-3.0

License (OSI-approved)

## Key facts

Objective fields from the source. Values we can't verify are shown as “Unknown” rather than guessed. [...] ## Alternatives to consider

### Airsonic-Advanced

Fork of Airsonic with similar Subsonic API compatibility and self-hosted model; more mature codebase but smaller community than Navidrome.

### Jellyfin (music module)

Broader media server (video + music + photos); larger project with enterprise backing. More feature-rich but heavier resource footprint than Navidrome.

### Ampache

Older self-hosted music server with web and API interfaces. Less ...

### Client Apps | Navidrome
URL: https://www.navidrome.org/apps
Subsonic

### SonaWave Paid

N/A

A smart music player designed for true music lovers(Supports HarmonyOS 5.0 and above only). Multi-language support (Simplified Chinese, Traditional Chinese, English).

Navidrome

### Sonora

2026-07-04

Sonora is a modern native iOS music player for Navidrome and Subsonic servers, designed to give self-hosted music collections a polished streaming-service experience. Stream, download, and rediscover your library with intelligent features like Roadtrip DJ, offline playback, CarPlay support, smart mixes, and seamless library syncing.

Subsonic

### Sound Room

2026-06-04

Jam: listen together in real time, shared queue, synced playback. A Subsonic client for iPhone with playlists, downloads, and lossless streaming and more coming.

Subsonic

### Strawberry [...] OpenSubsonic

### Feishin

2026-07-19

A modern self-hosted music player with MPV and web player backends, featuring a modern UI, smart playlist editor for Navidrome, synchronized/unsynchronized lyrics support, and scrobbling capabilities. Rewrite of Sonixd with enhanced features.

Navidrome

### Ferrosonic

2026-06-27

A terminal-based Subsonic music client written in Rust, featuring bit-perfect audio with automatic PipeWire sample rate switching, gapless playback, MPRIS2 desktop media controls, and an integrated cava audio visualizer.

Subsonic

### Firmium

2026-07-06 [...] # Apps & Players

Stream your music anywhere with apps for Android, iOS, desktop, and web. Any app that supports the OpenSubsonic API works with Navidrome.

Platform:

API:

Showing all 82 apps

No apps found

Try adjusting your filters

### Airdrome

Modern self-hosted Progressive Web App for (Open)Subsonic music servers. Features responsive desktop/mobile UI, persistent playback queue, dynamic playlist sup ...

### Navidrome Overview | Navidrome
URL: https://www.navidrome.org/docs/overview
# Navidrome Overview

Learn more about Navidrome’s features

Navidrome can be used as a standalone server, that allows you to browse and listen to your music collection using a web browser.

It can also work as a lightweight Subsonic-API compatible server, that can be used with any Subsonic compatible client.

## Features [...] Themeable, modern and responsive Web interface based on Material UI and React-Admin
 Compatible with all Subsonic/Madsonic/Airsonic clients. See below for a list of tested clients
 Transcoding on the fly. Can be set per user/player. Opus encoding is supported
 Translated to 34 languages (and counting)
 Full support for playlists, with option to auto-import `.m3u` files and to keep them in sync
 Smart/dynamic playlists (similar to iTunes). More info here
 Scrobbling to Last.fm, ListenBrainz and Maloja (via custom ListenBrainz URL)
 Sharing public links to albums/songs/playlists
 Externalized authentication to use your own authentication service instead of Navidrome’s built-in one
 Jukebox mode allows playing music on an audio device attached to the server, and control from a client [...] ### Features supported by the Subsonic API

 Tag-based browsing/searching
 Simulated browsing by folders (see note below)
 Playlists
 Bookmarks (for Audiobooks)
 Starred (favourites) Artists/Albums/Tracks
 5-Star Rating for Artists/Albums/Tracks
 Transcoding and Downsampling
 Get/Save Play Queue (to continue listening in a different device)
 Last.fm and ListenBrainz scrobbling
 Artist Bio from Last.fm
 Artist Images from Last.fm, Spotify and Deezer
 Album images and description from Last.fm
 Lyrics (from embedded tags and external files)
 Internet Radios
 Jukebox mode
 Shares

#### NOTE

Navidrome does not support browsing by folders, but simulates it based on the ...


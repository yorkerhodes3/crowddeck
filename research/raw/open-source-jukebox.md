# open-source-jukebox

QUERY: open source jukebox software self hosted party queue GitHub crowd requests

## Synthesized answer
CrownJukebox (github.com/Kronborgs/crownjukebox) is a self‑hosted, open‑source party jukebox built with Go, React and Docker that lets multiple users add tracks from their phones to a shared, real‑time queue without any cloud services, includes a “SKÅL!” party mode that triggers a full‑screen neon animation and a dedicated party playlist, and provides granular access controls (search, view queue, add to queue, use party button) plus an admin panel for managing the library and permissions; other notable self‑hosted options include Jukebox.Local, a collaborative local‑network jukebox that runs on Raspberry Pi and supports crowd queuing of personal music collections, Hangton‑Code’s event‑music‑system which turns a projector into a QR‑based YouTube jukebox with optional AI filtering, and Count Jukeula (juke‑rs) which offers a web interface for Spotify‑backed collaborative queuing, but CrownJukebox most directly matches the request for an open‑source, Docker‑deployable, retro‑styled jukebox with real‑time crowd queue and party features.

## Sources

### GitHub - Kronborgs/crownjukebox · GitHub
URL: https://github.com/Kronborgs/crownjukebox
## Repository files navigation

CrownJukebox

# CrownJukebox

A self-hosted, retro-styled party jukebox — multi-user, real-time, no cloud required.

Release
License: MIT
Docker
Go
React

Release
License: MIT
Docker
Go
React

## What is CrownJukebox?

CrownJukebox is a self-hosted jukebox server you run at home or at your venue. It turns your local music collection into a shared, browser-based jukebox that multiple people can control from their own devices — no app install, no Spotify account, no cloud subscription. [...] When someone adds a track, every connected browser knows within milliseconds — the queue, the now-playing display, and the audio all update in sync. No polling, no page refresh needed.

The audio streams directly from the backend to the kiosk browser. The kiosk is the speaker — guests just control what's playing.

## Key Features

### 🎵 Playback & Queue

### 🎉 SKÅL! Party Mode

### 🎨 Retro UI

### 📚 Music Library

`folder.jpg`

### 👥 Multi-user & Access Control

`can_search`
`can_view_queue`
`can_add_to_queue`
`can_use_party_button`

### ⚙️ Admin Panel

### 🚀 Self-hosting & Deployment

`amd64`
`arm64`
`portainer-stack.yml`

## Quick Start

Edit `docker-compose.yml` and set at minimum:

`docker-compose.yml`
`ADMIN_PASSWORD`
`JWT_SECRET`
`openssl rand -hex 32`
`/your/music:/music:ro` [...] The idea is simple: you put a screen (TV, monitor, or tablet) in your living room showing the kiosk view — the retro-styled "Now Playing" display with a vinyl animation, LED-scrolling track name, and audio controls. Your guests then open the jukebox on their phone browser, browse your music library, and add songs to the shared queue. Everything updates in real-time across all connected devices.

When the moment calls for it, whoever has permission can hit the SKÅL ...

### Collaborative local Jukebox that protects your personal ...
URL: https://daily.dev/posts/show-dev-jukebox-local---collaborative-local-jukebox-that-protects-your-personal-spotify-youtube-al-fwl28b6mi
Aug 5, 2026 — Jukebox.Local is an open-source, self-hosted collaborative jukebox for local networks (e.g., Raspberry Pi) that lets groups queue and play

### I built a self-hosted jukebox and so should you
URL: https://www.xda-developers.com/built-self-hosted-jukebox
The jukebox project lives on GitHub and has easy-to-follow instructions. It hooks into Home Assistant using helpers, automations, and Music Assistant’s webhooks. Once installed, you toggle the jukebox interface using an input boolean in your Home Assistant dashboard. From there, the jukebox opens in a clean, browser-based view. The interface is intentionally minimal — just a search bar and a queue button. You can share the URL with guests or generate a QR code that links straight to the interface. The QR code is especially useful if you’re hosting at scale — just print it and stick it next to the speaker or on a drinks table. One scan, and they’re in. No logins, no links, no explaining. It’s fast, simple, and avoids all the usual overhead. [...] HAMusicAssistantJukebox is a self-hosted, browser-based interface that brings back the classic “walk up and queue a song” experience. Guests can use their phones to search for music, add tracks to the queue, and keep the party going — without a single awkward handoff or playlist debate. If you're only using music from your own library, the entire experience isfully local, so you don’t need to worry about cloud-based hiccups or streaming limits. You’re in control of the playback, and your guests only interact with a curated layer of your setup instead of throwing up punk rock in the middle of a city pop-themed party.

Here’s how it works, and why it’s worth setting up.

home icon in yellow over a stack of icon buttons

##### A beginner's guide to setting up Home Assistant [...] If you’ve already built a local music library, this setup makes the most of it. If not, Music Assistant supports several streaming services, including Spotify, Qobuz, and Tidal—so you can use whatever you already subscribe to. The jukebox interface simply  ...

### GitHub - Hangton-Code/event-music-system: Projector QR jukebox — guests queue YouTube songs from their phones, an AI filter keeps it fit for the event · GitHub
URL: https://github.com/Hangton-Code/event-music-system
## Repository files navigation

# 🎶 Event Music System

Turn any projector into a crowd-powered jukebox.

Guests scan a QR code, search YouTube from their phones, and queue songs. The music plays on the big screen — with an optional AI DJ that keeps requests fit for the occasion, whatever the occasion is.

Runtime: Bun License: MIT No API keys required Self-hosted

Projector screen — now playing with QR code and live queue

The projected host screen: player, scan-to-add QR, live queue with requester credits.

## Why this exists [...] 1. Register the runner — repo → Settings → Actions → Runners → New self-hosted runner, pick Linux, run the shown commands on the home server as the user that owns your clone, then `sudo ./svc.sh install  && sudo ./svc.sh start`.
2. Docker access — `sudo usermod -aG docker`  (re-login after).
3. Clone location — the workflow deploys `~/event-music-system` by default; set a repo Variable `DEPLOY_DIR` if yours lives elsewhere.

Manual — `git pull && docker compose up -d --build` whenever you like. Cron — `update.sh` pulls and rebuilds only when something changed (use the runner or cron, not both). [...] MIT — party responsibly. 🎉

## About

Projector QR jukebox — guests queue YouTube songs from their phones, an AI filter keeps it fit for the event

### Topics

bunjukeboxktvpartyqr-codeself-hostedwebsocketyoutube

### Resources

MIT license

### Stars

0 stars

### Watchers

0 watching

### Forks

0 forks

Report repository

You can’t perform that action at this time.

### MStream, open source, and self hosted music streaming with jukebox mode and more!
URL: https://www.youtube.com/watch?v=1CrPCxThlRY
# MStream, open source, and self hosted music streaming with jukebox mode and more!
## Awesome Open Source
169000 subscribers
239 likes

### Description
14758 views
Posted: 9 Nov 2021
============        LINKS        ============
Show Notes

Install NGinX Proxy Manager video (Docker, Docker-Compose, NPM, Portainer)

MStream Home Page

MStream on Github (Docker Info)

Support my Channel and ongoing efforts through Patreon: [...] so you can install it from source of course i feel like i'm on mr ed here so you can install it from the source being on github that is always an option that you can pull the source and learn how to compile it figure out how to compile it and compile it yourself which is pretty great especially if you want to do development and help out with the project that's awesome docker so this is the one that we're going to do today but you can also use binaries which they have for windows os 10 and linux so if you'd rather just run the binary go out there and get it for your version and then you can jump on there and just start running it straight from your operating system and use that as a server as well you do get some nice things which is it'll run in the background it has automatic updates and [...] [Music] it's your open source advocate and i'm back with another video and today i wanted to talk about a nice music streaming service that's coming out that's pretty new it's not really a service but a self-hosted application that's open source of course and it's called m stream if you haven't heard of this one it's pretty great it's got some really great features as well so we're going to jump into it and kind of look at the software first and then we'll go through the install and of course we'll use docker for that because it just makes things so easy i ...

### GitHub - dbr/juke-rs: Jukebox music queue system based around Spotify · GitHub
URL: https://github.com/dbr/juke-rs
## Navigation Menu

## Latest commit

## History

## Folders and files

| Name | | Name | Last commit message | Last commit date |
 ---  --- 
| src | | src |  |  |
| static | | static |  |  |
| .gitattributes | | .gitattributes |  |  |
| .gitignore | | .gitignore |  |  |
| CHECKS | | CHECKS |  |  |
| Cargo.lock | | Cargo.lock |  |  |
| Cargo.toml | | Cargo.toml |  |  |
| LICENSE | | LICENSE |  |  |
| Procfile | | Procfile |  |  |
| README.md | | README.md |  |  |
| screenshot.png | | screenshot.png |  |  |
| View all files | | |

## Repository files navigation

# Count Jukeula

Colaborative jukebox web interface, with playback backed by the Spotify desktop client.

Screenshot

Screenshot

Intended to be used in an office, where multiple people wish to queue songs.

## Requirements [...] ## Requirements

Spotify desktop client for playback.

The Rust language toolkit (easiest to install via rustup).

Initially developed on Rust 1.31 (edition 2018). Should work on latest stable, support for older versions isn't a high priority.

Web-app targets mostly used in recent versions of Firefox/Chrome.

The only networking requirements are:

## Running

Launch and log in to a Spotify client on an internet connected machine (currently only tested with the Spotify desktop client on macOS)

Install the Rust language toolchain (easiest via rustup)

Sign in to the Spotify for Developers dashboard (with a regular Spotify account), and click "create a client ID".

The process is simple/quick, and you will end up with a "Client ID" and a "Client Secret". [...] Also ensure the "Redirect URIs" is set properly (this can be set to ` )

`

Put the Spotify details in a `.env` file:

`.env`

CLIENT\_ID=a0b2c3.....f1
CLIENT\_SECRET=f0e1d2...a0
REDIRECT\_URI=

Launch the Rust-based Jukeula server. ...

### guest party mode / jukebox · music-assistant · Discussion #411 · GitHub
URL: https://github.com/orgs/music-assistant/discussions/411
| Let's say you have a party and you want your guests to have control over the music. Just like an old-school jukebox.  Globally my idea is as follows:    Create some option/button to enable "guest/party mode" on a Queue.  Have some easy way for guests to control the queue, for example a separate web URL and/or simple app.  It must be plain simple, for example have a QR code or other share code to share the guest login with your guests  Once the party is over you withdraw the party mode.  Guests can add songs to the queue  You (as host) select the main playlist and from which music the guests may pick (default to all music from all providers)  You (as host) select the add mode in which way tracks are added to the queue. For example FIFO which will place each guest request after the [...] You must be logged in to vote

All reactions

0 replies

Comment options

### Uh oh!

There was an error while loading. Please reload this page.

### fsmythe Jan 15, 2025

|  |

| This would be great! Just a simple web interface with the ability to add to a currently running queue would be perfect. |

You must be logged in to vote

All reactions

0 replies

Comment options

### Uh oh!

There was an error while loading. Please reload this page.

### Uh oh!

There was an error while loading. Please reload this page.

### DJS91 Mar 27, 2025

|  | [...] 2 replies

@OzGav

Comment options

### Uh oh!

There was an error while loading. Please reload this page.

#### OzGav Apr 30, 2024 Maintainer

|  |

| Here is one approach you could try  |

All reactions  

 👍 1

@patienttruth

Comment options

### Uh oh!

There was an error while loading. Please reload this page.

#### patienttruth Apr 30, 2024

|  |

| That's awesome looking. Thanks! |

All reactions

Comment options

### Uh oh!

There w ...

### music-queue · GitHub Topics · GitHub
URL: https://github.com/topics/music-queue
## Navigation Menu

# music-queue

## Here are 8 public repositories matching this topic...

### jaherhum / crowdroom

Collaborative jukebox for shared spaces. Crowd queues songs, host device plays. Vote-to-skip, real-time updates.

### coslynx / Discord-Music-Bot

Project: Discord Music Bot: Play Tracks Through Commands. Created at , which is owned by @Drix10

### coslynx / discord-music-experience-bot

Project: Music Maestro for Discord Bot. Created at , which is owned by @Drix10

### coslynx / project-1722833603841-x66u2b

Project: Discord Music Bot: Play Your Favorite Tunes. Created at , which is owned by @Drix10

### coslynx / discord-music-bot-project

Project: Discord Music Bot: Play Your Favorite Tunes. Created at , which is owned by @Drix10

### tsdiokno / crowd-q


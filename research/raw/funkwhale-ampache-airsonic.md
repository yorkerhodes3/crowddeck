# funkwhale-ampache-airsonic

QUERY: Funkwhale Ampache Airsonic Advanced Gonic self hosted music server comparison features

## Synthesized answer
Funkwhale is a federated, ActivityPub‑based music server that offers a modern web UI, robust tag and playlist handling, multi‑user support with role‑based access, and scrobbling to services like Last.fm and ListenBrainz, but it lacks native Subsonic API compatibility, on‑the‑fly transcoding and DLNA support, relying instead on optional third‑party Subsonic clients for mobile playback; Ampache is a long‑standing PHP‑driven solution with full Subsonic/OpenSubsonic API support, an integrated web player, ffmpeg‑based transcoding, extensive multi‑user ACLs, scrobbling (Last.fm, Libre.fm, ListenBrainz), podcast and internet‑radio feeds, cover‑art handling, smart playlists, rating, tag editing and optional DLNA plugins; Airsonic is a Java implementation that also provides the Subsonic API, a built‑in responsive web UI, real‑time transcoding, per‑user role management, podcast and radio integration, cover‑art, DLNA/UPnP streaming and a wide ecosystem of Subsonic clients; Airsonic‑Advanced is a fork of Airsonic that adds more granular access controls, enhanced transcoding options and optional paid support while retaining the same API compatibility, web interface and feature set (podcasts, radio, cover‑art, DLNA); Gonic is a lightweight Go‑based server offering the OpenSubsonic API, a simple web UI with playlists and starred items, ffmpeg transcoding, basic multi‑user accounts, scrobbling to Last.fm and ListenBrainz, but it omits DLNA, podcast handling and advanced role management, focusing instead on speed and low resource usage.

## Sources

### Funkwhale, Airsonic, KooZic, Ampache, Subsonic... : r/selfhosted
URL: https://www.reddit.com/r/selfhosted/comments/b0wqst/feedback_on_cloud_music_solutions_funkwhale
Support for large, complex music collections. Granular support for tags. Good UI/UX with proper usage of desktop real estate. Support for

### Ampache: An open source web based audio/video streaming app and file manager | Hacker News
URL: https://news.ycombinator.com/item?id=27952725
you were happy with LMS and added it to my list as well. Someone ought to compare these in a meaningful way at some point. Looks like LMS has all the basics covered (mobile apps, simple mobile friendly web client, etc), but as a former Grooveshark user Funkwhale was my first choice. Looking forward to trying them both. | | | |  |  |  |  ---  |  |  | COGlory on July 26, 2021  | parent | prev | next (javascript:void(0))   Funkwhale is great from a UI standpoint. Adding music, however, was a chore. I ended up going with the Subsonic server built into Nextcloud, because it's just drag and drop. Nextcloud also has Ampache built in. | | | |  |  |  |  ---  |  |  | khimaros on July 26, 2021  | parent | prev | next (javascript:void(0))   i have been using Jellyfin with Finamp and jane been happy [...] | |  |  |  |  ---  |  |  | hardwaresofton on July 26, 2021  | root | parent | next (javascript:void(0))   Appreciate the response! I saw that you were happy with LMS and added it to my list as well. Someone ought to compare these in a meaningful way at some point. Looks like LMS has all the basics covered (mobile apps, simple mobile friendly web client, etc), but as a former Grooveshark user Funkwhale was my first choice. Looking forward to trying them both. | |
| |  |  |  |  ---  |  |  | COGlory on July 26, 2021  | parent | prev | next (javascript:void(0))   Funkwhale is great from a UI standpoint. Adding music, however, was a chore. I ended up going with the Subsonic server built into Nextcloud, because it's just drag and drop. Nextcloud also has Ampache built in. | | [...] |  |  |  |
 --- 
|  |  | desktopninja on July 26, 2021  | prev | next (javascript:void(0))   Personally settled on: ```     ```  Its containerless :D and runs anywhere Java is installed. Also evaluated: ```    ...

### Airsonic-Advanced | NetActuate Media Marketplace
URL: https://www.netactuate.com/marketplace/airsonic-advanced
...anycast Routing for BGP Delivery - Optimize AI...

Airsonic-Advanced logo

# Airsonic-Advanced

Self-hosted music streaming with the Subsonic API for any Subsonic client.

Open sourceSLA: oss-best-effortv11.1.4Image

Deploy on NetActuateDocs & supportNetActuate Docs

Airsonic-Advanced music streaming server

Airsonic-Advanced music streaming server

Airsonic-Advanced is a free, self-hosted music streaming server. Point it at your music library and stream it to yourself and your friends over the web UI or through the large ecosystem of Subsonic and OpenSubsonic apps for Android, iOS, and the desktop.

Key features [...] Key features

 Subsonic API compatible: works with the many existing Subsonic and OpenSubsonic clients, so you are not locked into one app
 Built-in web player with playlists, starred items, and search
 On-the-fly transcoding with the bundled ffmpeg, so tracks play on any device and any bandwidth
 Multi-user with per-user access control and roles
 Podcast subscriptions, internet radio, and cover art
 Embedded database, no external database or services to run

Use cases

 Own your music collection and stream it from anywhere
 A private, ad-free alternative to commercial streaming for your own library
 A shared family or team music server [...] Why run it on the NetActuate edge Hosting Airsonic-Advanced in a PoP near you shortens the path for streaming and transcoding, and keeps your library and listening history under your control.

Deployed from the NetActuate marketplace, the appliance boots pre-configured from your seeded values. On first boot it initializes the database on loopback only, rotates the built-in admin account to your generated password directly in the database, and only then serves on the network, so the upstream default admin and admin ...

### Music Servers - A rabbit hole if ever there was one - Kelly Gallagher Sims
URL: https://www.kellysims.com/notebook/music-servers-a-rabbit-hole-if-ever-there-was-one
Because Navidrome uses the Airsonic API base, which is also used by Ampache, Airsonic, Funkwhale and others, there are quite a few mobile apps out there to play off this API. Most of them are run by solo developers, and it shows in the various apps UI and UX. I landed on Amperfy for iOS, and so far have been quite pleased with it. It has a simple, but effective UI. It has a decent CarPlay implementation and allows me to store my music locally on my phone or stream from my server. I’ve chosen to store locally.

## Words of warning [...] Koel
 Ampache
 Lightweight Music Server
 Funkwhale
 Plex
 Jellyfin
 Airsonic
 Navidrome
 Swinsian
 Doppler
 Vox
 Roon
 JRiver
 mStream
 Blackcandy
 Lyrion
 Madsonic
 Coral

There are probably 5-10 others that I also looked at, but it started to become pretty clear that this music server space had some weirdness about it. Interfaces were all over the place, installation varied from simple app install to complex server configs, and many had awful notes about them across the web. The ones above that I spent the most time with are what I’ll outline.

## Plex and Jellyfin [...] ## Where I landed

Navidrome is a fairly new entrant into the space around Airsonic, which has several spinoffs. The underlying APIs are used by several of the servers listed above. It’s easy to set up, and just works. I had zero issues adding my music, and the web player works fine as a desktop player for me when needed. It has a PWA that can be used as a player on your mobile, but this isn’t ideal. I have enough storage on my phone that I want to be able to store some, or all, my music if needed. Now that I had landed on a possible server, I needed an iOS app as player. And so I got out my machete and started hacking my way through that jungle.

### basings/selfhosted-music-overview
URL: https://github.com/basings/selfhosted-music-overview
| Ampache | last.fm, ListenBrainz, libre.fm | ❔ | ✔️ | ✔️ | Subsonic, custom | ✔️ | ✔️ | ✔️ | ✔️ | ✔️ | ✔️ | ✔️ | ✔️ | ✔️ | ✔️ | ✔️ | Demo | GitHub | aGPLv3 | 5.6.0 | Ampache |
| Jellyfin | last.fm 2, ListenBrainz3 | ✔️ | ✔️ | ✔️ | Jellyfin | ✔️ 4 | ✔️ | ✔️ | ✔️ | ✔️ | ❌ | ✔️ | ✔️ | ✔️ | ✔️ | ✔️ | Demo | GitHub | GPLv2 | 10.10.7 | Jellyfin |
| Funkwhale | last.fm, ListenBrainz, libre.fm, Maloja 5 | ❔ | ✔️ | ✔️ | WIP custom, subsonic | ✔️ | ✔️ | ✔️ | ✔️ | ✔️ | ❌ | ❌ | ✔️ | ❌ | ❌ | ❌ | ✔️ | ❌ | GitLab | aGPLv3 | 1.2.6 | Funkwhale |
| Lightweight Music Server | ListenBrainz | ❌ | ✔️ | ❌ | Subsonic, OpenSubsonic | ❌ | ✔️ | ✔️ | ✔️ | ✔️ | ✔️ | ✔️ | ✔️ | ❌ | ❌ | ✔️ | ✔️ | Demo | GitHub | GPLv3 | 3.62.1 | Lightweight Music Server | [...] | Scrobbling | Jukebox Mode | Read Tags | Write Tags | API | Share Music | Multi-User | Multi-Library | Smart Playlists | Heart/ Favorites | 5 Star Rating | Replay Gain | Transcode | DLNA | Multi-Room | Lyrics | free | Demo | Source Code | License | Reviewed Version |
 ---  ---  ---  ---  ---  ---  ---  ---  ---  --- 
| Airsonic | last.fm | ❔ | ✔️ | ✔️ | Subsonic | ✔️ | ✔️ | ✔️ | ✔️ | ✔️💲 | ✔️💲 | ❌ | GitHub | GPLv3 | 10.6.2 | Airsonic |
| Airsonic-advanced | last.fm | ❔ | ✔️ | ✔️ | Subsonic | ✔️ | ✔️ | ✔️ | ✔️ | ✔️ | ✔️ | ❌ | GitHub | GPLv3 | 11 | Airsonic-advanced |
| gonic | last.fm, ListenBrainz | ✔️ | ✔️ | ❌ | OpenSubsonic | ✔️ | ✔️ | ✔️ 1 | ✔️ | ✔️ | ✔️ | ✔️ | ✔️ 1 | ✔️ | ❌ | GitHub | GPLv3 | 0.16.2 | gonic | [...] | Sonixd | L, W, M | ✔️ | ✔️ | ❌ | ❌ | ✔️ | ❔ | ✔️ | ❌ | ❌ | ✔️ | ❌ | ✔️ | ❌ | ✔️ | ❌ | ✔️ | ❌ | ❌20 | ✔️ | ❌ | ❌ | ❌ | ❌ | ❌ | ✔️ | ✔️ | ✔️ | ❔ | ❌ | ✔️ | ❌ | ⚪ | ✔️ | ✔️ | ✔️ | ✔️ | ❌ | ❌ | ❌ | ✔️ | ✔️ | Jellyfin, Subsonic | ⚪ | Github | GPLv3 | 0.8.5 | Sonixd |
| Funkwhale | Web | ❌ | ✔️ | ✔️ | ❌ | ✔️ | ❌ | ❌ | ❌ | ❌ | ✔️  ...

### Airsonic, a free, self hosted, open source media streaming server alternative to iTunes, Spotify, ..
URL: https://www.youtube.com/watch?v=bozkNMUfqKM
music video and then you can do cover art files and then you can also import playlists so if you have something set up as playlists and then so it's got a lot of settings here just for kind of the the general stuff you go into advanced there are a few things here that you may want to change but i'm just going to leave it in the default for now so i want to come over to users so here you can see all the all the different things that you would have access to so as an admin you have everything but you click on new user and this is going to let you give that user rights so if you want to make an administrative user you can check that box but if not i just suggest checking most of these other ones here and then music you want to give them access to the music folder and then you want to give [...] streaming stations you can set those up you can set up transcoding if you need to set up transcoding for your media files as well um a little bit more of an advanced topic on this one so i'm not really going to go through this but if you know what you're doing with that of mpeg and how to transcode things you can set that up if you have sonos which i don't you can enable the sonos music server as well i don't have it so that's not something i would turn on dlna and upnp so universal plug-and-play and then dlna you can set that up if you need to for your different players again not something i need to set up myself and then up here you've got again we've gone through advanced media folders personal it's just the same things you get on your other user and then users of course which you can [...] them access to the music folder and then you want to give them a username and an email and give them a strong password and then save again it'll let you know that it's saved and you can log ou ...

### The Self Hosted Media Thread - Side Room
URL: https://idmforums.com/t/the-self-hosted-media-thread/7950
Or maybe I’m just a dumbass who has no idea what he’s doing, Who knows at this point, lol!

That seems like a solid and sensible setup. I think there’s so many ways to get to where you’re going and none of them stand out as entirely better than another, it’s just about picking the feature set and pain points you’re willing to live with. Like Gonic works better for me for the reasons I stated, but I know that’s a opinionated use case, same for Supersonic.

I live in Linux land most of the time at work and home, so again my preferences point that way, and it sounds like you’re doing a lot more user facing stuff than I am (game servers, multi-user, file sharing, video, etc) so it makes sense that your stack would look different from mine. [...] I’ve been self-hosting my music library for an age. I’ve been through all the hits: mpd, subsonic, airsonic, ampache, jellyfin, navidrome, plex, lms and more. That’s not to say I’m an expert in it, I mostly just want something easy to use that stays out of my way. My biggest demand is having it make a random playlist, maybe based on genre. So take my suggestions with that in mind; I haven’t really dug into all the integrations and star ratings and podcast fetching and scrobbling and whatever the kids are into these days, I just want 8 hours of background to get me through the work day, or be able to quickly go to a single track when I want to.

### Ampache Music Streaming Server Overview | InterServer
URL: https://www.interserver.net/apps/ampache-hosting.html
interserver

Standard Web Hosting

asp.net

boost web hosting

reseller hosting

#### Features

#### Other services

vps home

windows vps

wordpress vps

webuzo vps

Storage

#### Information

#### Other Services

dedicated home

Server Market Place

Colocation

Rapid Deploy

#### Speciality Servers

#### locations

#### Use Cases

#### Main features

#### Large Throughput

About us

network

datacenter

our team

reviews

Speed Test

Ampache logo

# Ampache music streaming overview, media-library features, and hosting options.

Ampache is a free open-source web-based audio and video streaming server and file manager, with catalog management, web playback, Localplay, transcoding, APIs, Subsonic/OpenSubsonic client support, and remote access to media libraries. [...] ### Strengths

Ampache is strongest when the user wants open-source control over a streaming media library.

### Considerations

Streaming media changes the hosting conversation.

### Alternatives

If Ampache is close but not quite right, compare it against nearby tools before choosing a hosting path.

## Pick the Ampache route that matches the business workflow you are launching.

Start with the simplest hosting tier that fits the workload, then move up when usage, integrations, or operational risk justify it.

### Cloud VPS

Use Cloud VPS when Ampache needs private streaming, APIs, client access, and server-level control.

### Storage Hosting

Use storage-focused options when the music or video library grows beyond a small footprint.

### Dedicated Servers [...] ### Launch Ampache where storage, bandwidth, and media control are planned

Ampache is more than a small script when it streams real media libraries, so Cloud VPS plus a storage plan is often the practical path.

## Start Ampache on Cloud VPS when ...


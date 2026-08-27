# verify-opensubsonic

QUERY: OpenSubsonic API specification jukebox mode extensions spec versus Subsonic API

## Synthesized answer
The OpenSubsonic specification adds an explicit jukebox‑mode extension called jukeboxMediaTypes that expands the jukeboxControl endpoint beyond the original Subsonic limitation of only accepting song IDs; the extension permits podcastEpisodeID and radioStationID (and any future audio‑only media types such as audiobooks) to be enqueued, allows multiple instances of each parameter, and requires servers to ignore the offset parameter for non‑seekable items like radio stations, while remaining fully backward‑compatible with Subsonic‑only implementations that continue to accept only song IDs.

## Sources

### Overview | OpenSubsonic
URL: https://opensubsonic.netlify.app/docs
### Clients

| Name | OpenSubsonic documentation |
 --- |
| Airdrome | Documentation |
| Airsonic Refix | Documentation |
| Amperfy |
| Feishin (ex Sonixd) |
| Radiccio | Documentation |
| Supersonic |
| Symfonium | Documentation |
| Tempus |
| tinysub | Documentation |

## Goals

The OpenSubsonic API has several goals, which include:

 Being an open, collaboratively maintained specification.
 Ensuring security across all extensions.
 The API aims for consistent results across all servers, ensuring that every request produces the same outcome. The API definition must be clear and precise, eliminating any ambiguity about the expected results.
 Maintaining complete backwards compatibility with the existing Subsonic API.
 Offering piecewise optional implementation for servers and clients. [...] ## Addressing Issues with the Subsonic API

Some of the issues the OpenSubsonic API aims to address include:

 Outdated and insecure authentication methods.
 Suboptimal versioning schema.
 Insufficient methods for expressing server functionality.
 Lack of an open and collaborative way to evolve the API.

By extending the existing Subsonic API, the OpenSubsonic API hopes to create a more secure, flexible, and collaborative environment for the Subsonic ecosystem.

## Join us

Feel free to join the OpenSubsonic forum for discussions, suggestions, and questions.

##### OpenSubsonic API

API details and methods.

##### API Reference

Common API documentation.

##### OpenSubsonic changes

API changes in OpenSubsonic API vs the original Subsonic API.

##### Extensions [...] ##### Extensions

OpenSubsonic extensions documentation.

##### Endpoints

Low level endpoints documentation.

##### Payloads

Payloads documentation.

##### Responses

Endpoints responses documentation.

##### OpenSubs ...

### [API Request] Extension to signify that a server supports playing media other than songs in jukebox mode · opensubsonic/open-subsonic-api · Discussion #86 · GitHub
URL: https://github.com/opensubsonic/open-subsonic-api/discussions/86
| Type of change API extension Proposal description The current spec for `jukeboxControl` says that song IDs are allowed, but makes no mention of podcastEpisode or internetRadioStation IDs. And there is no guarantee that IDs across media types are unique, so clients cannot assume any IDs other than song IDs are supported by jukeboxControl.  We should add an extension to indicate a server can accept IDs for all playable media (excluding video: that is currently songs, podcast episodes, and radio stations, but this extension should cover any possible future audio media types eg audiobooks) for the `jukeboxControl` endpoint. For non-seekable items like radio stations, the server should be able to ignore the `offset` parameter if passed.  gonic already supports this as of today, at least for [...] gonic already supports this as of today, at least for radio stations - sentriz/gonic#481 - and DSub also supports passing radio IDs (which is technically an improper use of the base Subsonic API). Navidrome currently does not support playing radio stations in Jukebox mode (from a code audit). Backward compatibility impact None Backward compatibility   No backward compatibility impact.  API details Proposing a new OpenSubsonic extension called `jukeboxMediaTypes`.  Version 1 of the extension adds two new arguments to the `jukeboxControl` endpoint:    `podcastEpisodeID`  `radioStationID`    Like the existing `id` parameter, multiple instances of the parameter are allowed to enqueue multiple items at once. Eg: [...] ### Type of change

API extension

### Proposal description

The current spec for `jukeboxControl` says that song IDs are allowed, but makes no mention of podcastEpisode or internetRadioStation IDs. And there is no guarantee that IDs across media types are unique, so clie ...

### Subsonic API | Ampache
URL: https://ampache.org/api/subsonic
## OpenSubsonic API extension​

OpenSubsonic API is an open source initiative to create backward-compatible extensions for the original Subsonic API.

Ampache Subsonic support is being extended to support these changes

### Spec compliance​

Audited against the OpenSubsonic specification on 2026-08-07.

The spec is a moving target — upstream rebuilds it continuously and states the schema and prose are still being reconciled — so the audit is pinned to one build rather than to "latest". `docs/openapi-opensubsonic.json` is that build, copied verbatim from ` and never hand-edited; `tests/Module/Api/OpenSubsonicSpecVersionTest.php` records its checksum and endpoint count so a refreshed copy fails CI and prompts a re-audit instead of drifting silently. [...] The schema is json-only. It declares `format=json` required and does not describe xml responses at all. Ampache serves both, and the xml responses carry the same OpenSubsonic fields; only the json corpus can be machine-validated, so `tests/Module/Api/SubsonicSpecConformanceTest.php` checks json against this schema and the pure Subsonic xml against the official 1.16.1 XSD.
 Extension endpoints are documented as returning 404 when unimplemented. Ampache returns the Subsonic error envelope with code 30 instead, because a Subsonic client parses the body rather than the status code, and this matches how every other unsupported action already behaves. This is what `getSonicSimilarTracks` and `findSonicPath` return with no sonic-analysis plugin installed. [...] ### Partially implemented​

 stream
  + Support `timeOffset` (Parameter is supported but untested)
 getLyricsBySongId
  + `kind` and `agents` are not returned. Ampache stores one unattributed lyric layer, `main` is already the default when `kind` is absent, and the spec  ...

### OpenSubsonic
URL: https://opensubsonic.netlify.app
## Goals

The OpenSubsonic API has the following goals:

1. Open and Collaborative: The specification is maintained through a collaborative effort, inviting contributions from developers across the Subsonic ecosystem. See the Proposals for Changes to the OpenSubsonic API Specification for details on how to contribute.
2. Secure: All extensions must be proven to be secure, ensuring a safe experience for users and developers.
3. Backwards-Compatible: Compatibility with the existing Subsonic API is maintained, allowing clients and servers that utilize the OpenSubsonic API to work with those that don’t, and vice versa.
4. Optional Implementation: Each part of the OpenSubsonic API is designed to be optional, enabling servers and clients to choose which parts they want to implement or consume. [...] # About the OpenSubsonic API

The OpenSubsonic API is a set of improvements and extensions to the existing Subsonic API, designed to enhance the music streaming experience for users and developers alike. This project aims to address the limitations and issues with the existing Subsonic API and move forward in an open, collaborative, and secure manner.

## Goals

The OpenSubsonic API has the following goals: [...] ## Key Features

The OpenSubsonic API enhances the Subsonic API by introducing the following key features:

1. Server Identification: Clients can now identify the server name and version, allowing them to adapt to server-specific features.
2. Improved API: Additions and clarifications to the existing API are introduced, enabling more advanced features and better user experience.
3. New Endpoints: The introduction of new endpoints helps support a more secure authentication process.
4. API Extension Indication: Servers can now expose their support for the OpenSubsonic API a ...

### Any interest in getting a stable Subsonic extension to Emby's API? - General/Windows - Emby Community
URL: https://emby.media/community/topic/123087-any-interest-in-getting-a-stable-subsonic-extension-to-embys-api
My first target is the Subsonic 1.16.0 API spec, with OpenSubsonic after that in short order. Android has some great apps that support both Emby's API & Subsonic directly, but with iOS, since Emby doesn't natively have a Subsonic API layer, you're left with apps that only support Emby's API which aren't all that many.

I'm hoping to open the door to more iOS Subsonic apps with this project so iOS users will have more app choice with Subsonic clients, at least when it comes to their music hosted on Emby. And that would include Subsonic clients running on desktop or wherever :)

Like
Clackdor

### Clackdor 126

### Clackdor

Clackdor

### Extensions | OpenSubsonic
URL: https://opensubsonic.netlify.app/docs/extensions
##### Categories

##### OpenSubsonic

# Extensions

##### API Key Authentication

Add a new authentication mechanism involving only an API key, and no.

##### getPodcastEpisode

Add support for retrieving individual podcast episode metadata.

##### HTTP form POST

Add support for POST request to the API (application/x-www-form-urlencoded).

##### Index based Queue

Add’s support for specifying and querying the play queue with index.

##### Playback Report

Add support for client playback timeline reporting.

##### Song Lyrics

Add support for synchronized lyrics, multiple languages, and retrieval by song ID.

##### Sonic similarity

A sonic similarity extension.

##### Template extension

A template extension.

##### Top songs by artist ID [...] A template extension.

##### Top songs by artist ID

Add support for retrieving top songs by artist ID.

##### Transcode Offset

Add support for start offset for transcoding.

##### Transcoding

Adds support for clients to make transcoding decisions and retrieve transcoded media streams.

### It doesn't seem to support the Subsonic API? - Support - Symfonium support
URL: https://support.symfonium.app/t/it-doesnt-seem-to-support-the-subsonic-api/1665
There’s a work in progress to build a public org with all servers and client to define Subsonic API extension and solve all those issues with a proper API change. (The org is already up finishing some details OpenSubsonic · GitHub with already 10 members from servers and clients before going fully public)

What is your problem with any of those? Why bad rating on the insane amount of effort done to try to improve the global Subsonic API?

What server do you use?

All major updated servers where contacted and agreed and fixed and joined the organisation…

I added stars It’s OK? I can’t seem to connect to Airsonic, but I’ll try when I have time. In the first place, specifications such as bulk transmission and subsonic are incompatible. So, I’m excited to see what OpenSubsonic has to offer. [...] Many bulk-preferring applications have in common that they ignore server-provided sorting and searching and implement their own degrading implementations.

Symfonium is offline first and support many different other servers like Plex, Emby, Jellyfin, Kodi, …, it have it’s own sorting and everything, but sorry it’s actually way more powerful that what API support.

See [[Wiki] Smart filters](

You should really see a little more what the app can do, to understand the choices.

Whatever changes and API extensions the org will bring in all cases it won’t be added to no more maintained server like Subsonic and Airsonic, so this is not really relevant to the compatibility mode.  
Those servers will never offer the features needed to build advanced apps like Symfonium.

### OpenSubsonic changes
URL: https://opensubsonic.netlify.app/docs/opensubsonic-changes
API changes in OpenSubsonic API vs the original Subsonic API. Documentation. In the documentation all changes from the original Subsonic API


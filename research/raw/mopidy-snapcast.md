# mopidy-snapcast

QUERY: Mopidy extensions Mopidy-Party Mopidy-MPD Snapcast multiroom audio open source

## Synthesized answer
Mopidy‑Party is an open‑source web client extension that adds a “party mode” interface for controlling Mopidy from a browser, allowing users to queue and manage tracks collaboratively; Mopidy‑MPD is the official Mopidy extension that implements the Music Player Daemon protocol, exposing Mopidy’s playback engine to any MPD‑compatible client and offering configurable host, port, and password settings; Snapcast is an open‑source synchronous multi‑room audio system that turns any audio source into a time‑aligned network stream by feeding PCM data (often via a FIFO such as /tmp/snapfifo) from Mopidy to a Snapcast server, which then distributes the stream to Snapcast clients on each speaker device, enabling perfectly synced playback across rooms.

## Sources

### Build your multi-room and multi-provider sound server with Platypush, Mopidy and Snapcast
URL: https://blog.platypush.tech/article/Build-your-open-source-multi-room-and-multi-provider-sound-server-with-Platypush-Mopidy-and-Snapcast
Luckily, we’ve got plenty of open source software around that comes to rescue. It requires a bit more work than just downloading an app and logging in, but the rewards are priceless.

## One music server to rule them all

Mopidy is one of the best open source solutions around when it comes to integrating multiple music services under one single interface. It’s entirely written in Python, it’s (almost) 100% compatible with MPD, a music protocol that has been around since 2003 and comes with lots of compatible clients (command-line, web-based, mobile apps etc.), and there are countless plugins that let Mopidy integrate with any kind of music service around.

It’s relatively easy to install mopidy on a RaspberryPi and turn it into a powerful music centre. [...] I have been an enthusiastic user of mpd and mopidy for nearly two decades. I have already written an article on how to leverage mopidy (with its tons of integrations, including Spotify, Tidal, YouTube, Bandcamp, Plex, TuneIn, SoundCloud etc.), Snapcast (with its multi-room listening experience out of the box) and Platypush (with its automation hooks that allow you to easily create if-this-then-that rules for your music events) to take your listening experience to the next level, while using open protocols and easily extensible open-source software. There is a feature that I haven't yet covered in my previous articles, and that's the automation of your music collection. Spotify, Tidal and other music streaming services offer you features such as a Discovery Weekly or Release Radar [...] Bandcamp, SoundCloud, local files, and much more. It also provides extensions for MPD (recommended, as it provides out-of-the-box compatibility with many existing MPD clients), an official mobile app, a good Web-based interface that a ...

### GitHub - snapcast/snapcast: Synchronous multiroom audio player · GitHub
URL: https://github.com/snapcast/snapcast
## Repository files navigation

# Snapcast

   Snapcast 

Synchronous audio player

CI Github Releases GitHub Downloads Donate

Snapcast is a multiroom client-server audio player, where all clients are time synchronized with the server to play perfectly synced audio. It's not a standalone player, but an extension that turns your existing audio player into a Sonos-like multiroom solution.  
 Audio is captured by the server and routed to the connected clients. Several players can feed audio to the server in parallel and clients can be grouped to play the same audio stream.  
 One of the most generic ways to use Snapcast is in conjunction with the music player daemon (MPD) or Mopidy.

## How does it work

The Snapserver reads PCM chunks from configurable stream sources: [...] ## Setup of audio players/server

Snapcast can be used with a number of different audio players and servers, and so it can be integrated into your favorite audio-player solution and make it synced-multiroom capable. The only requirement is that the player's audio can be redirected into the Snapserver's fifo `/tmp/snapfifo`. In the following configuration hints for MPD and Mopidy are given, which are base of other audio player solutions, like Volumio or RuneAudio (both MPD).

The goal is to build the following chain:

```
audio player software -> snapfifo -> snapserver -> network -> snapclient -> alsa 
```

This guide shows how to configure different players/audio sources to redirect their audio signal into the Snapserver's fifo: [...] MPD
 Mopidy
 FFmpeg
 mpv
 MPlayer
 Alsa
 PulseAudio
 AirPlay
 Spotify
 Process
 Line-in
 VLC
 PlexAmp

Unordered list of features that should make it into the v1.0

 Remote control JSON-RPC API to change client latency, volume, zone,...
 Android client JSON-RPC client an ...

### Extensions
URL: https://mopidy.com/ext
# Extensions

Extend Mopidy with additional music sources, audio mixers, control planes, web clients, and more.

## Backends

Add additional music sources.

 mopidy-bandcamp
 mopidy-beets First-party
 mopidy-cd
 mopidy-dleyna
 mopidy-file Bundled
 mopidy-funkwhale
 mopidy-internetarchive
 mopidy-jamendo
 mopidy-jellyfin
 mopidy-local First-party
 mopidy-mixcloud
 mopidy-orfradio First-party
 mopidy-pandora First-party
 mopidy-podcast
 mopidy-podcast-itunes
 mopidy-radionet
 mopidy-radiopit
 mopidy-somafm
 mopidy-soundcloud First-party
 mopidy-spotify First-party
 mopidy-stream Bundled
 mopidy-subidy
 mopidy-tidal
 mopidy-tunein
 mopidy-webm3u
 mopidy-youtube
 mopidy-ytmusic

## Web clients

Serve web-based players with Mopidy's builtin web server. [...] Serve web-based players with Mopidy's builtin web server.

 mopidy-api-explorer First-party
 mopidy-iris
 mopidy-mobile
 mopidy-mopster
 mopidy-mowecl
 mopidy-muse
 mopidy-musicbox-webclient
 mopidy-party
 mopidy-pibox

## Frontends

Add control planes for user interfaces or event listeners.

 mopidy-alarmclock
 mopidy-autoplay
 mopidy-headless
 mopidy-http Bundled
 mopidy-listenbrainz
 mopidy-mpd First-party
 mopidy-mpris First-party
 mopidy-pidi
 mopidy-raspberry-gpio
 mopidy-scrobbler First-party
 mopidy-webhooks

## Mixers

Alternative ways to control volume and muting.

 mopidy-alsamixer First-party
 mopidy-nad First-party
 mopidy-softwaremixer Bundled

## Updating the extension registry [...] ## Updating the extension registry

This extension registry is a community effort, and will never be complete without your help. To add or update an extension, edit the source files using the existing extensions as inspiration, then submit a pull request to the mopidy/website repo at GitHub.

### Multi-room audio with Snapcast, Mopidy, and Home Assistant - Blogs - Home Assistant Community
URL: https://community.home-assistant.io/t/multi-room-audio-with-snapcast-mopidy-and-home-assistant/42556?page=
You’ll need two key software packages, besides Home Assistant. The first is Mopidy, a music server that can play local files, or connect to streaming music services like Spotify. The second is Snapcast, which enables synchronized audio streaming across your network. Both can be integrated into Home Assistant. Each room audio device will run an instance of the Snapcast client, and optionally a Mopidy instance. Your server will run a special instance of Mopidy and the Snapcast server.

Finally, you also need a player to control Mopidy. Any MPD-compatible player will work, and there are several Mopidy-only web-based options available. On Android, Remotedy is particularly nice since you can access multiple Mopidy instances in one place. [...] ### local.conf

Add the local configuration on computers that have local media files:

`[local]
media_dir = <your/music/here>`

### snapcast.conf

Finally, the Mopidy instance that connects with Snapcast needs special configuration. Run on a different port to avoid conflicts if you have a second Mopidy instance running on your computer. The audio output is sent to a named pipe - Snapcast will read from there. Note that you may have to adjust the audio output attribute depending on your system and audio sources.

`[mpd]
hostname = ::
port = 6601
[http]
hostname = ::
port = 6681
[audio]
output = audioresample ! audio/x-raw,rate=48000,channels=2,format=S16LE ! audioconvert ! wavenc ! filesink location=/tmp/snapfifo`

## Run Mopidy

To run a room-specific instance: [...] # Multi-room audio with Snapcast, Mopidy, and Home Assistant

Would you like to listen to music in every room in your home, controlled from one source? Then multi-room audio is for you.

Multi-room audio can be achieved by having a computer attached to speakers in every ro ...

### Multi-room audio with Snapcast, Mopidy, and Home Assistant - Blogs - Home Assistant Community
URL: https://community.home-assistant.io/t/multi-room-audio-with-snapcast-mopidy-and-home-assistant/42556
You’ll need two key software packages, besides Home Assistant. The first is Mopidy, a music server that can play local files, or connect to streaming music services like Spotify. The second is Snapcast, which enables synchronized audio streaming across your network. Both can be integrated into Home Assistant. Each room audio device will run an instance of the Snapcast client, and optionally a Mopidy instance. Your server will run a special instance of Mopidy and the Snapcast server.

Finally, you also need a player to control Mopidy. Any MPD-compatible player will work, and there are several Mopidy-only web-based options available. On Android, Remotedy is particularly nice since you can access multiple Mopidy instances in one place. [...] ### local.conf

Add the local configuration on computers that have local media files:

`[local]
media_dir = <your/music/here>`

### snapcast.conf

Finally, the Mopidy instance that connects with Snapcast needs special configuration. Run on a different port to avoid conflicts if you have a second Mopidy instance running on your computer. The audio output is sent to a named pipe - Snapcast will read from there. Note that you may have to adjust the audio output attribute depending on your system and audio sources.

`[mpd]
hostname = ::
port = 6601
[http]
hostname = ::
port = 6681
[audio]
output = audioresample ! audio/x-raw,rate=48000,channels=2,format=S16LE ! audioconvert ! wavenc ! filesink location=/tmp/snapfifo`

## Run Mopidy

To run a room-specific instance: [...] # Multi-room audio with Snapcast, Mopidy, and Home Assistant

Would you like to listen to music in every room in your home, controlled from one source? Then multi-room audio is for you.

Multi-room audio can be achieved by having a computer attached to speakers in every ro ...

### Home Automation, part 3 - Multi room music and sound system with Mopidy and Snapcast | Bacardi55's Web Cave
URL: https://bacardi55.io/2020/04/18/home-automation-part-3-multi-room-music-and-sound-system-with-mopidy-and-snapcast
For the installation itself:

```
 wget -q -O -  | sudo apt-key add -  wget -q -O -  | sudo apt-key add -  sudo wget -q -O /etc/apt/sources.list.d/mopidy.list   sudo wget -q -O /etc/apt/sources.list.d/mopidy.list   sudo apt update  sudo apt update  sudo apt install mopidy mopidy-mpd mopidy-spotify  sudo apt install mopidy mopidy-mpd mopidy-spotify 
```

#### Configuration

See the official documentation for options and configuration! In the meantime, this is my `/etc/mopidy/mopidy.conf`: [...] selfhosting and data privacy. Free and Open Source advocate since 2005, I sporadically write Blog or Gemlog posts and share short notes and bookmarks on my website. email:bac@rdi55.pl name:bacardi55]" name="author">

 == bacardi55 ==  

ἕν οἶδα ὅτι οὐδὲν οἶδα

# Home Automation, part 3 - Multi room music and sound system with Mopidy and Snapcast

bacardi55's avatar

I'm a Team Lead and Solutions Architect during the day, lazy "Dev Sec Ops" at night with a passion for selfhosting and data privacy. Free and Open Source advocate since 2005, I sporadically write Blog or Gemlog posts and share short notes and bookmarks on my website.

- Permalink

Categories: selfhosting -- Tags: #home-automation #mopidy #snapcast #sound #spotify #mpd [...] The important piece for me are the activation of the  deamon (the `[mpd]` section) so mopidy can be used with any MPD client (for my laptop) and is connected to spotify for my music library (see `[spotify]` section).

#### Control

 Web UI

  I enabled 2 Web UI:  and . If you want to have web UI, you need to enable `http` extension (see above my config file or the official documentation).

  If you want to use them, you’ll have to install them.

  For Mopify:

  ```
   sudo pip3 install Mopidy-Mopify  sudo pip3 install Mopidy-Mopify 
  ```

  For Mu ...

### Whole Home Audio With SnapCast - Part III - PragmaticCoding
URL: https://www.pragmaticcoding.ca/homelab/snapcast2
Start by using `apt` to install Mopidy. This seems to give the latest version:

```
$ sudo $ sudo install 
```

You can check the version that you get:

```
$ --version
```

Which, at the time of writing, was the latest version, although from October 2023.

You can use `apt` to see all of the Mopidy extensions that are available that way:

```
$ sudo 
```

We are going to need a couple of extensions, otherwise we won’t be able to do much with Mopidy. The first we will install is the extension for SomaFM. If you are going to be using some other service for a source, you’ll need to install the extension for it. However, I would still recommend that you install the SomaFM add-on because then you’ll have something that you can test before you go trying your own thing. [...] If you added any other extensions, you’ll probably have to add a section in this file for that extension. Generally, if you follow a link from the [Mopidy extension listing, you’ll get to a page that has a GitHub link listed just above the section called “Installation”. Follow that link and the GitHub page should have a sample configuration block on it.

At this point, you can restart the Mopidy service to get it to load all of the extensions and read the configuration.

You should use `systemctl status mopidy -n60` to make sure that it’s working properly. If you’ve muddled up the configuration, you should get some messages in that display that will tell you that it had problems.

### Testing It All

### GitHub - mopidy/mopidy-mpd: Mopidy extension for controlling playback from MPD clients · GitHub
URL: https://github.com/mopidy/mopidy-mpd
`mpd/enabled`: If the MPD extension should be enabled or not.
 `mpd/hostname`: Which address the MPD server should bind to. This can be a network address or the path toa Unix socket:
  + `127.0.0.1`: Listens only on the IPv4 loopback interface (default).
  + `::1`: Listens only on the IPv6 loopback interface.
  + `0.0.0.0`: Listens on all IPv4 interfaces.
  + `::`: Listens on all interfaces, both IPv4 and IPv6.
  + `unix:/path/to/unix/socket.sock`: Listen on the Unix socket at the specified path. Must be prefixed with `unix:`.
 `mpd/port`: Which TCP port the MPD server should listen to. Default: 6600.
 `mpd/password`: The password required for connecting to the MPD server. If blank, no password is required. Default: blank. [...] If you want to be the maintainer of Mopidy-MPD, please:

1. Make 2-3 good pull requests improving any part of the project.
2. Read and get familiar with all of the project's open issues.
3. Send a pull request removing this section and adding yourself as the "Current maintainer" in the "Credits" section below. In the pull request description, please refer to the previous pull requests and state that you've familiarized yourself with the open issues.

   As a maintainer, you'll be given push access to the repo and the authority to make releases to PyPI when you see fit.

## Installation

Install by running:

```
python3 -m pip install mopidy-mpd
```

See  for alternative installation methods.

## Configuration [...] `mpd/default_playlist_scheme`: The URI scheme used if the server cannot find a backend appropriate for creating a playlist from the given tracks. Default: `m3u`


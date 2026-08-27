# raveberry-partyplay

QUERY: Raveberry open source party music voting jukebox Festify PartyPlay Jukebox alternatives GitHub

## Synthesized answer
Raveberry is an open‑source, Raspberry Pi‑focused multi‑user music server that lets party guests request and vote on songs from YouTube, Spotify, SoundCloud and local files through a web UI, and its LGPL‑3.0‑licensed code is hosted on GitHub with hundreds of stars; Festify is a free, browser‑based Spotify‑powered jukebox where participants join via a short URL, vote to push tracks up the queue, and the host (who must have Spotify Premium) can use an admin mode to skip, delete or pause songs; comparable GitHub projects include the copykatze/jukebox repo that implements a similar democratic selection model, the PartyPlay Node.js/React app that uses Spotify’s Web Playback SDK for voting‑based queues, and Mixody, a web‑app offering event‑focused voting and host‑relief features as a non‑Spotify‑specific alternative, all of which can be self‑hosted and customized to create a participatory party music jukebox.

## Sources

### Issues · raveberry/raveberry - GitHub
URL: https://github.com/raveberry/raveberry/issues
A multi-user music server with a focus on participation. Open Source COMMUNITY GitHub … a party jukebox plugin Status: Open.

### Raveberry
URL: https://www.hackster.io/hussainu6/raveberry-8f7d86
Raveberry is a multi user music server that allows democratic selection of songs. It supports Youtube, Spotify, Soundcloud and local files as

### Spotify Social Jukeboxes
URL: https://blog.vikfand.com/posts/spotify-social-jukeboxes
Festify is a web app that uses Spotify's Web Playback SDK to play tracks directly in the party host's browser. Participants join by visiting a url or entering

### mixody vs Festify: which music tool is better for parties? | mixody
URL: https://mixody.com/compare/mixody-vs-festify
Short standalone answers to common comparison questions.

Yes. mixody is an alternative to Festify for events where guests should contribute songs and the music should be controlled fairly through voting.

Festify describes a free browser-based Spotify party jukebox with voting and admin mode. mixody is positioned more clearly as an event solution for fair music control with group focus and host relief.

Yes. According to Festify's official FAQ, Spotify Premium is required because third-party apps can only access Spotify's catalog that way.

Yes. Festify's official website says guests can vote for songs so that highly voted tracks move up in the queue.

For parties with many requests, mixody is often the better fit when fair event logic and host relief matter alongside voting. [...] ### Voting and fairness

mixody

mixody builds voting into its event logic so the group can influence what plays next more fairly.

Festify

Festify describes democratic voting where heavily voted tracks move up the queue.

Why it matters

For larger groups, participation alone is not enough. The order also needs to feel understandable.

### Host control

mixody

mixody relieves hosts without taking control of the event away from them.

Festify

Festify describes an admin mode for skipping, deleting, and pausing tracks.

Why it matters

At real events, guest participation needs a clear frame so the music does not drift out of control.

### Technical requirements

mixody

mixody is oriented around event use and is not described as a pure Spotify browser jukebox.

Festify [...] | Category | mixody | Festify | Why it matters |
 ---  --- |
| Core idea | mixody is built for events with requests, voting, and host control. | Festify describes itself as a free Spotify-based party app where guests de ...

### copykatze/jukebox: A multi-user music server with a focus on participation
URL: https://github.com/copykatze/jukebox
Raveberry is a multi user music server that allows democratic selection of songs. It supports YouTube, Spotify and local files as sources for music. at https:/

### GitHub - raveberry/raveberry: A multi-user music server with a focus on participation · GitHub
URL: https://github.com/raveberry/raveberry
## Repository files navigation

# Raveberry

Build Status PyPI Subreddit subscribers Discord

Raveberry is a multi user music server that allows democratic selection of songs.

It provides an intuitive interface for requesting songs and changing their order according to the rating that users have made. It supports YouTube, Spotify and local files as sources for music.

A live demo is available at .

## Installation

### Try it out!

You can test a slim version of Raveberry like this:

```
sudo apt-get install -y python3-pip mopidy redis-server ffmpeg gstreamer1.0-plugins-bad pip3 install raveberry[run] raveberry run 
```

You might need to write `~/.local/bin/raveberry run` instead. Now you can visit ` and play a song of your choice. [...] ## More Information

The `docs/` folder contains more information about usage, resources etc.

Don't hesitate to mail me for feedback or open an issue if you experience any problems. There is also a Reddit and a Discord community:

 Reddit: 
 Discord: 

If you like this project, you can support me here:  
 [](

## About

A multi-user music server with a focus on participation

### Topics

bootstrapdjangomopidymusicmusic-playermusic-visualizerpythonraspberry-pisocial-jukeboxspotifyyoutube

### Resources

LGPL-3.0 license

### Contributing

### Stars

750 stars

### Watchers

24 watching

### Forks

47 forks

Report repository

## Used by

You can’t perform that action at this time. [...] This method uses a development server, with limited performance and a restricted feature set.

### Installation

In order to gain access to all features of Raveberry, install it:

```
pip3 install raveberry[install] raveberry install 
```

If you get `raveberry: command not found` you need to run `export PATH="$HOME/.local/bin:$PATH"`. Raveberry was de ...

### Get your Party started with Festify!
URL: https://festify.rocks
## Features

 Creating a Party

  ### Super easy Setup

  Creating a Party using Festify couldn't be simpler. Just log in with your Spotify Premium Account and have fun.
 Festify is Spotify-Powered

  ### Spotify-Powered

  Festify uses Spotify's huge music library so your guests can choose from millions of tracks. An internet connection and a Spotify Premium account are all you need to get your next Party started.
 Democratic Voting

  ### Democratic Voting

  Your guests can vote for songs using their smartphones. The more people vote for a track, the higher it moves up your queue. Using this system, Festify will only play the music that your guests like.
 Festify is Browser-Based

  ### Browser Based [...] Get your Party started with Festify!

Festify Logo Festify

Festify Jumbo Logo

# Get your Party started with Festify

Festify is a free Spotify-powered app that lets your guests choose which music should be played using their smartphones.

Create a party   Join a party

Learn more

## As seen on

Lifehacker   Product Hunt   iFun   MacLife   Caschys Blog

## Using Festify is Easy

 Create Party Screenshot

  You create a new party in your browser and get a party code
 Join Party Screenshot

  Your guests enter the party code in their mobile browser
 Party Queue Screenshot

  Everyone votes to decide which tracks should be played

TV Screenshot MacBook and iPhone Screenshot

## Features

 Creating a Party

  ### Super easy Setup [...] ### Browser Based

  Festify is fully browser-based, so it can be used anywhere a modern web browser can be. Playback is supported in Google Chrome and Firefox.
 TV Mode

  ### TV Mode

  Festify features a TV Mode that is designed to look good on your computer, notebook, TV, or projector. Fan art of each playing artist from Fanart.TV  ...

### Raspberry Pi Rave: Music Server Project Lets Friends Vote ...
URL: https://www.tomshardware.com/news/raspberry-pi-project-music-server-spotify-youtube
Raveberry has a graphical admin interface, Bluetooth support for wireless speakers, screen visualization using a tool called Cava and audio


# beets-musicbrainz

QUERY: beets music library manager MusicBrainz AcoustID Chromaprint metadata tagging

## Synthesized answer
Beets is a command‑line music library manager that automatically improves tag information by querying the MusicBrainz database, and it can also generate and use acoustic fingerprints via the Chromaprint/AcoustID plugin (called “chroma”). When the chroma plugin is enabled together with the musicbrainz plugin, beets fingerprints each imported file with the external fpcalc tool, stores the resulting acoustid_id and acoustid_fingerprint fields, and sends the fingerprint to the AcoustID web service; the returned AcoustID match is then resolved through MusicBrainz to supply album, track and artist candidates for autotagging even when the original ID3 tags are missing or incorrect. The plugin’s auto option controls whether fingerprinting occurs during import, and a chromasearch command lets users query the local library for tracks with similar fingerprints to locate duplicates or alternate encodings. In addition to MusicBrainz‑based metadata such as album art, genres, and release information, beets can embed these acoustic fingerprint tags in files, making it a comprehensive solution for organizing and correcting large music collections.

## Sources

### Chromaprint/Acoustid Plugin — beets
URL: https://beets.readthedocs.io/en/stable/plugins/chroma.html
# Chromaprint/Acoustid Plugin#

Acoustic fingerprinting is a technique for identifying songs from the way they “sound” rather from their existing metadata. That means that beets’ autotagger can theoretically use fingerprinting to tag files that don’t have any ID3 information at all (or have completely incorrect data). This plugin uses an open-source fingerprinting technology called Chromaprint and its associated Web service, called Acoustid. [...] Note

The `chroma` plugin turns Acoustid fingerprint matches into autotagger candidates by resolving them through the MusicBrainz Plugin plugin, so you need to enable `musicbrainz` alongside `chroma` to get album and track candidates from acoustid lookups. If `musicbrainz` is not enabled, the `chroma` plugin will still fingerprint your files and store the `acoustid_id` and `acoustid_fingerprint` fields, but it will not contribute candidates during autotagging.

## Configuration#

There is one configuration option in the `chroma:` section, `auto`, which controls whether to fingerprint files during the import process. To disable fingerprint-based autotagging, set it to `no`, like so:

```
 chroma: auto: no
```

## Submitting Fingerprints# [...] ## Fingerprint Search#

The `chromasearch` command lets you search your local beets library for tracks with similar audio fingerprints. This is useful for identifying duplicate files, finding alternate encodings of the same recording, or locating tracks when metadata is missing or incorrect.

To perform a search, run:

```
    
```

The fingerprint must be provided using the `-s` (`--search`) option. You can generate a fingerprint using the external `fpcalc` tool from the Chromaprint project. For example:

```
   
```

By default the whole library is searched, use a query to restrict the  ...

### Fixing metadata on a large music library : r/selfhosted
URL: https://www.reddit.com/r/selfhosted/comments/1ruaowp/fixing_metadata_on_a_large_music_library
the chromaprint/AcoustID plugin for beets can identify tracks based on the actual audio, doesn't matter if the tags are garbage. install fpcalc,

### GitHub - beetbox/beets: music library manager and MusicBrainz tagger · GitHub
URL: https://github.com/beetbox/beets
Fetch or calculate all the metadata you could possibly need: album art, lyrics, genres, tempos, ReplayGain levels, or acoustic fingerprints.
 Get metadata from MusicBrainz, Discogs, and Beatport. Or guess metadata using songs' filenames or their acoustic fingerprints.
 Transcode audio to any format you like.
 Check your library for duplicate tracks and albums or for albums that are missing tracks.
 Clean up crufty tags left behind by other, less-awesome tools.
 Embed and extract album art from files' metadata.
 Browse your music library graphically through a Web browser and play it in any browser that supports HTML5 Audio.
 Analyze music files' metadata from the command line. [...] Analyze music files' metadata from the command line.
 Listen to your library with a music player that speaks the MPD protocol and works with a staggering variety of interfaces. [...] If beets doesn't do what you want yet, writing your own plugin is shockingly simple if you know a little Python.

### Install

You can install beets by typing `pip install beets` or directly from Github (see details here). Beets has also been packaged in the software repositories of several distributions. Check out the Getting Started guide for more information.

### Contribute

Thank you for considering contributing to `beets`! Whether you're a programmer or not, you should be able to find all the info you need at CONTRIBUTING.rst.

### Read More

Learn more about beets at its Web site. Follow @b33ts on Mastodon for news and updates.

### Contact

### Beets | MusicPlayerPlus
URL: https://musicplayerplus.dev/beets
Management of your music library with Beets is an optional feature provided by MusicPlayerPlus. Although optional, use of Beets can enhance your music library in ways that make it more useful and easier to access with the `mpcplus` MusicPlayerPlus MPD client. For example, one of the automated tasks that Beets performs is updating the tags in your music library. Beets queries online sources like MusicBrainz, Bandcamp, and Last.fm to update the music library with widely used metadata for songs and albums it can identify. Subsequent invocations of `mpcplus` will be able to use this rich set of tags to filter, search, and find items in your music library. [...] The Beets `acousticbrainz` plugin can be used to query the AcousticBrainz database and retrieve already analyzed audio-based information for tracks in that database. This process is much faster than the Xtractro process as the analysis has previously been performed by the AcousticBrainz service.

If the music library metadata has been updated using the acousticbrainz plugin (e.g. `mpplus -x all` or `mppinit -a metadata`) then these custom tags can be used in Beets queries. [...] If audio analysis and extraction of metadata on a large music library is too time consuming then it may be preferable to use the `acousticbrainz` plugin to download metadata from MusicBrainz followed by selective use of the Beets xtractor plugin. Using `acousticbrainz` is faster because no audio analysis is needed, the MusicBrainz database already has the metadata for songs recognized by their MusicBrainz ID. Unfortunately, the MusicBrainz metadata is not always correct and the AcousticBrainz service is being retired. But until that day (sometime in 2023) it may be preferable to enable the `acousticbrainz` Beets plugin and perform a two-pass  ...

### Organizing Your Music Library Using Acoustic Fingerprinting | Karim's Blog
URL: https://elatov.github.io/2013/01/organizing-your-music-library-using-acoustic-fingerprinting
I also enabled the lastfm plugin:

But neither of those options/plugins were able to identify my songs, I tried the other utilities but it was to no avail. It looks like musicbrainz or similar databases are album centric. From the picard home page:

> When tagging files, Picard uses an album-oriented approach. This approach allows it to utilize the MusicBrainz data as effectively as possible and correctly tag your music.

But remember I wasn’t trying to tag albums, but rather single tracks. I then tried out beets, I even enabled the chroma/Acoustid plugin to enable acoustic fingerprinting, but it was the same thing. Check it out:

```
[elatov@moxz mus]$ grep plugin ~/.beetsconfig plugins: chroma 
```

Now for beets: [...] Now for beets:

```
[elatov@moxz mus]$ beet import mus_2003 /mnt/data/mus_2003 No matching release found for 3 tracks. For help, see:  [U]se as-is, as Tracks, Skip, Enter search, enter Id, aBort? 
```

but it was the same thing, it couldn’t match anything. However beets is also album oriented, from the beets page:

> Your music should be organized by album into directories. That is, the tagger assumes that each album is in a single directory. These directories can be arbitrarily deep (like music/2010/hiphop/seattle/freshespresso/glamour), but any directory with music files in it is interpreted as a separate album. This means that your flat directory of six thousand uncategorized MP3s won’t currently be autotaggable. (This will change eventually.) [...] It looks like this was written for beets, I wonder if I was mis-using beets, or maybe it wasn’t implemented yet. Regardless, the modules comes with a script which allows you to fingerprint files. So first let’s check to see if the tags are broken:

```
[elatov@moxz mus_2003]$ exiftool Alsu-Vchera.mp3 | g ...

### Beets, Chromaprint, and USE flags - Gentoo Forums
URL: https://forums.gentoo.org/viewtopic.php?t=1066388
It's a highly configurable system for organizing your music collection and automatically tagging files with metadata from MusicBrainz (or

### beets: the music geek‘s media organizer
URL: https://beets.io
# Beets is the media library management system for obsessive music geeks.

# Beets is the media library management system for obsessive music geeks.

The purpose of beets is to get your music collection right once and for all. It catalogs your collection, automatically improving its metadata as it goes using the MusicBrainz database. Then it provides a bouquet of tools for manipulating and accessing your music.

Because beets is designed as a library, it can do almost anything you can imagine for your music collection. Via plugins, beets becomes a panacea: [...] Fetch or calculate all the metadata you could possibly need: album art, lyrics, genres, tempos, ReplayGain levels, or acoustic fingerprints.
 Get metadata from MusicBrainz, Discogs, or Beatport. Or guess metadata using songs’ filenames or their acoustic fingerprints.
 Transcode audio to any format you like.
 Check your library for duplicate tracks and albums or for albums that are missing tracks.
 Browse your music library graphically through a Web browser and play it in any browser that supports HTML5 Audio.
 …and lots more.

If beets doesn’t do what you want yet, writing your own plugin is shockingly simple if you know a little Python.

Install beets by typing `pip install beets`. You might then want to read the Getting Started guide. Then follow @beets on Fosstodon for updates.

### MusicBrainz Enabled Applications - MusicBrainz
URL: https://musicbrainz.org/doc/MusicBrainz_Enabled_Applications
| beets | A flexible command line music library manager written in Python. It includes a tag corrector and album art downloader that use MusicBrainz as their backend. | website |
| Clementine | A multiplatform music player. It is inspired by Amarok 1.4, focusing on a fast and easy-to-use interface for searching and playing your music. | website |
| foobar2000 | An advanced freeware audio player for the Windows platform. Some of its features include full unicode support, ReplayGain support and native support for several popular audio formats. Support for MusicBrainz has been added with MusicBrainzTagger and it can use MusicBrainz data to tag media files and audio CDs. | website | [...] ## Media libraries

The following music library managers can tag your files with MusicBrainz data.


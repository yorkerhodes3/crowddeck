# music-metadata-apis

QUERY: MusicBrainz Discogs AcoustID Spotify Web API audio features metadata API comparison

## Synthesized answer
MusicBrainz offers a free, open‑source REST API that returns canonical music‑metadata such as artists, releases, recordings, and their unique MBIDs in JSON or XML without OAuth (though it enforces rate limits and encourages proper user‑agent strings); Discogs provides a commercial API that returns both community‑generated release metadata and marketplace data (including images, formats, and pricing) but requires OAuth authentication, stricter rate limits, and approval for commercial use; AcoustID supplies a fingerprint‑lookup service that, given a Chromaprint fingerprint, returns an AcoustID identifier plus any linked MusicBrainz recording MBIDs and optional user‑submitted textual tags, accessed via a simple API key without OAuth; Spotify’s Web API delivers both rich catalog metadata and detailed audio‑feature analysis (acousticness, danceability, energy, instrumentalness, liveness, loudness, speechiness, tempo, time‑signature, etc.) for tracks identified by Spotify IDs, but requires an OAuth token, enforces commercial‑use approval, and is rate‑limited, making it the only service among the four that provides proprietary acoustic descriptors while the others focus on community‑curated metadata and identifier resolution.

## Sources

### Sonovault vs Spotify API: Music Metadata, Compared (2026) - Sonovault
URL: https://sonovault.now/compare/spotify-api
Sonovault is a metadata API across six platforms (Spotify, Apple Music, Tidal, Beatport, Discogs, MusicBrainz) with one API key and no OAuth. It fills the gaps Spotify can't: cross-platform IDs, original release dates from canonical sources, and predictable pricing with no approval queue for commercial use.

Last updated: May 8, 2026 · all Spotify-API claims are linked to Spotify's own developer documentation

## Which one should you use?

These tools serve overlapping but distinct needs. Many teams use both.

Choose Sonovault when… [...] Two reasons most builders cite: (1) Spotify only returns Spotify IDs, while Sonovault returns IDs for Spotify, Apple Music, Tidal, Beatport, Discogs, and MusicBrainz so you can resolve a track across platforms in one call; (2) commercial Spotify usage requires application/approval, while Sonovault's paid tiers have no approval queue. [...] After · cross-platform in one call

```
// Same ISRC, all six platforms const r = await fetch( " { headers: { "x-api-key": API_KEY } } ); // Returns Spotify, Apple Music, Tidal, Beatport, // Discogs, MusicBrainz IDs + canonical metadata.
```

Ready to compare on your own data?Read the docs or grab a free API key with 1,000 requests, no card.

FAQ

## Frequently asked questions

No, and it's not trying to be. Sonovault is a metadata API, not a streaming API. If you need playback, user libraries, or playlists, you still need Spotify (or your platform of choice). Sonovault covers the metadata layer: ISRC, genre, release dates, and cross-platform IDs across six platforms in one response.

### MusicBrainz Enabled Applications
URL: https://musicbrainz.org/doc/MusicBrainz_Enabled_Applications
| One Tagger | A cross-platform tagger for DJs. It can fetch metadata from Beatport, Traxsource, Juno Download, Discogs, Musicbrainz and Spotify. It can also fetch audio features from Spotify, has a manual tag editor, allows for quick tagging with keyboard shortcuts and rename files with templates. | website |
| Puddletag | An audio tag editor that is primarily created for GNU/Linux. It uses a spreadsheet-like layout so that all the tags are visible and easily editable. Puddletag imports tag information from online databases like freedb, Discogs, MusicBrainz AcoustID and Amazon (also by text-search). | website | [...] | Kitsune | A free player/tagger for Japanese and Russian music. It supports MusicBrainz lookup for artists and recordings, and will only scrobble to last.fm if a correct name was found in MusicBrainz. It will use chromaprint to identify music from a Japanese web radio station or anime related music. | archive |
| Jaikoz | A powerful tagger available for macOS, Windows and Linux making use of MusicBrainz, Discogs and AcoustId. | website |
| Metadata Remote | Web-based audio metadata editor for headless servers. Just Docker, a browser, and zero setup. | Github |
| Metadatics | A powerful audio metadata editor for macOS which supports several file types, including but not limited to, MP3, M4A, AIFF, WAV, FLAC, APE, OGG, WMA. It uses MusicBrainz to search for tags. | website | [...] | TagEditor | A tag editor allows you to easily batch tagging MP3, AIFF, WAV, FLAC, MP4, M4A files and renaming audio files through a handy spreadsheet. The program supports the users to easily download music metadata and artworks from AcoustID, MusicBrainz and Cover Art Archive. It is available for MacOS only. | website |
| TagScanner | Edits tags of most modern audio formats, su ...

### Seeking details of metadata returned by AcoustID web service - AcoustID - MetaBrainz Community Discourse
URL: https://community.metabrainz.org/t/seeking-details-of-metadata-returned-by-acoustid-web-service/339599
Again, thanks to all! I will probably have more questions, but you’ve already helped considerably, so know that it’s appreciated AND effective.

I can also get textual metadata from AcoustID without any query to the MusicBrainz web service. Is this also coming from MusicBrainz? If so, how current is it? If not, where does it come from?

I’m not sure about the API, but at least the AcoustID site itself does have (their own) metadata which seems to be based on the tags on the files that were scanned in order to submit the fingerprints for this AcoustID. It can be quite useful sometimes, especially in cases where there’s nothing in MusicBrainz. [...] Thanks Lukáš!

I think I see a way to solve my problem, assisted by your response and also by an older thread from the mailing list discussion, here:

It seems, if I understand correctly, that if I have the ability to create fingerprints via Chromaprint (which I have, already working in my application), then the comparison function is relatively simple. So I could create a very simple C application that takes two files and compares them, just by using some of the code extracted from Chromaprint.

This is what Christophe did in the email thread above - my version would be quite similar to his, and he posted source code for it as well, which I’ve looked at. [...] MusicBrainz provides a different web service that can deliver textual metadata, which is selected by MBIDs, from its own separate database.

If I want LOTS of metadata, and my starting point is a fingerprint, then I should query the AcoustID service to retrieve the MBID for that fingerprint, then use that MBID to retrieve further metadata from the separate Musicbrainz web service.

I can also get textual metadata from AcoustID without any query to the MusicBrainz web se ...

### Acoustid Albums Report and Import Feature - AcoustID - MetaBrainz Community Discourse
URL: https://community.metabrainz.org/t/acoustid-albums-report-and-import-feature/561560
### albunack

music metadata api for musicbrainz discogs

The second is artists with between 2 and 100 releases, so these are smaller artists, and there are more missing original studio release but also plenty of live albums

### albunack

music metadata api for musicbrainz discogs

The third is artists with one release or left, these are the really obscure artists, probably mainly self published releases.

### albunack

music metadata api for musicbrainz discogs

thanks Paul

Rebuilt with better matching against existing releases so that less likely to list albums already in the database, this is mostly a problem with the report for most popular artists. [...] Note:I haven’t tackled multi disc albums yet, each disc will probably be listed as a separate album, and some albums will be listed as multiple times, the compare with MusicBrainz is based on text match so in many cases the album may alreay be in Musicbrainz with slightly different name so proceed with caution.

The initial list is about 500,000 albums

I’ve split into three reports, based on how many existing releases the artist has in MusicBrainz. So the first one is artists with more than 100 releases so I expect most people will recognize the majority in the list, and alot of the missing releases are live albums, and also many classical releases. This report is more likely than the other two to list albums that are already in MusicBrainz but just with a slightly different name. [...] # Acoustid Albums Report and Import Feature

Hi, AcoustId currently has about 63M acoustids, MusicBrainz has about 25M recordings, so clearly there are many tracks in Acoustid that do not have a corresponding track in MusicBrainz

When Acoustids are submitted the basic metadata is stored with it, and when you lookup the Acoustid  ...

### MusicBrainz API
URL: https://musicbrainz.org/doc/MusicBrainz_API
# MusicBrainz API

The API discussed here is an interface to the MusicBrainz Database. It is aimed at developers of media players, CD rippers, taggers, and other applications requiring music metadata. The API's architecture follows the REST design principles. Interaction with the API is done using HTTP and all content is served in a simple but flexible format, in either XML or JSON. XML is the default format; to get a JSON response, you can either set the Accept header to `"application/json"` or add `fmt=json` to the query string (if both are set, `fmt=` takes precedence).

### A collection of music APIs, databases, and related tools · GitHub
URL: https://gist.github.com/0xdevalias/eba698730024674ecae7f43f4c650096?permalink_comment_id=
It consists of a client library for generating compact fingerprints from audio files, a large crowd-sourced database of audio fingerprints, many of which are linked to the MusicBrainz metadata database using their unique identifiers, and an web service that enables applications to quickly search in the fingerprint database.

Acoustid
Audio identification services
Automatic music file tag correction. Music catalog reconciliation and cross-referencing. 100% open source. [...] At the core of AcoustID is an efficient algorithm for extracting audio fingerprints, called Chromaprint. The algorithm is optimized specifically for matching near-identical audio streams, which allows the audio fingerprints to be very compact and the extraction process to be fast. For example, it takes less than 100ms to process a two minute long audio file and the extracted audio fingerprint is just 2.5 KB of binary data. [...] AcoustID contains a large crowd-sourced database of such audio fingerprints together with additional information about them, such as the song title, artist or links to the MusicBrainz database. You can send an audio fingerprint to the AcoustID service and it will search the database and return you information about the song. We use a custom database for indexing the audio fingerprints to make the search very fast.

All of this is 100% open source and the database is available for download.

### Web API Reference | Spotify for Developers
URL: https://developer.spotify.com/documentation/web-api/reference/get-audio-features
{{ "acousticness": 0.00242,  " acousticness": 0.00242, "analysis_url": "  " analysis_url": " ", "danceability": 0.585,  " danceability": 0.585, "duration_ms": 237040,  " duration_ms": 237040, "energy": 0.842,  " energy": 0.842, "id": "2takcwOaAZWiXQijPHIx7B",  " id": " 2takcwOaAZWiXQijPHIx7B ", "instrumentalness": 0.00686,  " instrumentalness": 0.00686, "key": 9,  " key": 9, "liveness": 0.0866,  " liveness": 0.0866, "loudness": -5.883,  " loudness": -5.883, "mode": 0,  " mode": 0, "speechiness": 0.0556,  " speechiness": 0.0556, "tempo": 118.211,  " tempo": 118.211, "time_signature": 4,  " time_signature": 4, "track_href": "  " track_href": " ", "type": "audio_features",  " type": " audio_features ", "uri": "spotify:track:2takcwOaAZWiXQijPHIx7B",  " uri": [...] Web API •References / Tracks / Get Track's Audio Features

# Get Track's Audio Features

Deprecated

Get audio feature information for a single track identified by its unique Spotify ID.

Important policy note

 Please note that you can not use the Spotify Platform or any Spotify Content to train a machine learning or AI model or otherwise ingesting Spotify Content into a machine learning or AI model.

  More information

## Request

 idstring

  Required

  The Spotify ID for the track.

  Example: `11dFghVXANMlKmJXsNCbNl`

## Response

Audio features for one track

 acousticnessnumber [float]

  A confidence measure from 0.0 to 1.0 of whether the track is acoustic. 1.0 represents high confidence the track is acoustic.

  Range: `0` - `1`Example: `0.00242`
 analysis\_urlstring [...] Example: `0.0556`
 temponumber [float]

  The overall estimated tempo of a track in beats per minute (BPM). In musical terminology, tempo is the speed or pace of a given piece and derives directly from the average beat duration.

  Ex ...

### Metadata lookup tools - Page 3 - Tinkering
URL: https://community.roonlabs.com/t/metadata-lookup-tools/169581?page=
AcoustID is already the third and newest audio fingerprinting system from MusicBrainz. It was created by Lukáš Lalinský and published more than


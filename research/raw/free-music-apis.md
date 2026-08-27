# free-music-apis

QUERY: royalty free music API Jamendo Free Music Archive ccMixter Creative Commons music catalog API

## Synthesized answer
Jamendo offers a public Music API that lets developers search its catalog of over 500 000 Creative‑Commons‑licensed tracks, retrieve album and artist details, and obtain streaming‑ready URLs for download or embed; access requires a free client‑id obtained by registering an application and all standard read‑only calls are free, while commercial use of certain features may need a separate agreement. The Free Music Archive also provides a JSON‑based API for querying its library of CC‑licensed songs, exposing metadata such as title, artist, genre, and license type and allowing direct download links for tracks that are free for non‑commercial or commercial use depending on the specific license. ccMixter runs the open ccHost Query API, a publicly available REST interface that returns searchable results for tracks, samples, and remixes along with their Creative‑Commons license information, enabling developers to integrate its remix‑friendly catalog into apps, websites, or smart‑device platforms. All three services supply royalty‑free music under Creative Commons terms, with licensing details included in the API responses so users can respect attribution, non‑commercial, or share‑alike requirements as appropriate.

## Sources

### [API Integration - AUDIO] Jamendo · Issue #345 · cc-archive/cccatalog · GitHub
URL: https://github.com/cc-archive/cccatalog/issues/345
## Provider description

On Jamendo Music, you can enjoy a wide catalog of more than 500,000 tracks shared by 40,000 artists from over 150 countries all over the world. You can stream all the music for free, download it and support the artist: become a music explorer and be a part of a great discovery experience!

## Licenses Provided

Jamendo uses Creative Commons licenses to enable the free distribution of otherwise copyrighted work. CC licenses all grant 'baseline rights', such as the right to distribute the copyrighted work worldwide for non-commercial purposes, and without modification. Artists choose a license according to the conditions they want to be applied to the song.  
 As per 

## Provider API Technical info [...] "\/\/\/\/\/\/\/ " "prourl""https:\/\/licensing.jamendo.com\/track\/1630628" "\/\/\/\/ " "shorturl""https:\/\/jamen.do\/t\/1630628" "\/\/\/\/ " "shareurl""https:\/\/www.jamendo.com\/track\/1630628" "\/\/\/\/ " "image""https:\/\/imgjam2.jamendo.com\/albums\/s183\/183496\/covers\/1.200.jpg" "\/\/\/\/\/\/\/ " "musicinfo" "vocalinstrumental" "instrumental" " " "lang" "" " " "gender" "" " " "acousticelectric" "" " " "speed" "high" " " "tags" "genres" "rock" " " "instruments" "electricguitar" " " "strings" " " "vartags" "groovy" " " "energetic" " " "id" "1425156" " " "name" "Skitz" " " "duration" 102 "artist_id" "497621" " " "artist_name" "Chris Bleau" " " "artist_idstr" "Chris_Bleau" " " "album_name" "San Diego State of Mind" " " "album_id" "166193" " " [...] "San Diego State of Mind" " " "album_id" "166193" " " "license_ccurl""http:\/\/creativecommons.org\/licenses\/by-nd\/3.0\/" "\/\/\/\/\/\/ " "position" 3 "releasedate""2017-02-22" " " "album_image""https:\/\/imgjam1.jamendo.com\/albums\/s166\/166193\/covers\/1.200.jpg" "\/\/\/\/\/\/\/ " "audio""htt ...

### Our Music Catalog - Jamendo Licensing
URL: https://licensing.jamendo.com/en/catalog
Search in our catalog to find the best-fitting licensing tracks for your project. Royalty-free music.

### Music Resources - BUS 357: HRM for Sustainability - Collins Memorial Library at University of Puget Sound
URL: https://library.pugetsound.edu/c.php?g=1298236&p=9536524
August 11, 2025 - All music on Jamendo is licensed under one of the 6 Creative Commons licenses. Jamendo lets you search for music by genre or user tags, or you can browse by CC license. ... dig.CCmixter lets you search and download liberally licensed music from the musicians' community at ccMixter.

### Jamendo API — API Key, Docs & Examples | PublicAPIs.io
URL: https://publicapis.io/jamendo-api
The Music API by Jamendo is a powerful tool designed for developers who want to integrate a diverse range of music streaming capabilities into their applications. With a comprehensive library of independent music, this API enables users to discover, play, and share tracks from a vast array of genres and artists. By leveraging the extensive database provided, developers can create robust music-related features, enhance user experience, and offer unique services that stand out in the competitive landscape of music applications. The API provides simple endpoints for searching for songs, retrieving album details, and accessing artist information, making it an ideal choice for both novice and experienced developers. [...] 1. Go to the Jamendo developer portal at  and sign up (or log in).
2. Accept the Jamendo API Terms of Use.
3. Create a new application, filling in its name and description.
4. Copy the generated Client ID from your app's page. (A Client Secret is also issued for OAuth flows that stream or write user data.)

Pass the `client_id` as a query parameter on every request against the ` base URL:

```
const 'YOUR_CLIENT_ID' const` fetch thenres => res json thendata => data console log results
```

Registration and standard read access — searching tracks, albums, and artists, and getting streaming URLs for Creative Commons music — are free. Commercial use of some features may require a separate agreement.

### Enterprise Sponsors

SerpApi - Web Search API logo

### SerpApi - Web Search API [...] ```
const require 'axios' const searchArtist async artistName const` try const await get const data results forEachtrack => track console log`Title: ${track.name}, Album: ${track.album_title}, Duration: ${track.duration}`${track.name}${track.album_title}${track.duration} cat ...

### ccMixter - Home
URL: https://ccmixter.org/isitlegal
To Whom it May Concern,  
   
 The ccHost Query API is an open, publicly available interface that is available for public use, especially by 3rd party websites, mobile applications, smart TV appliances and any other network connected device.  
   
 We here at ccMixter use it to help expose the artists that upload their Creative Commons licensed music to audiences that otherwise would not have access to.  
   
 The API and software implementation is owned by ArtIsTech Media under a license agreement with Creative Commons. The music itself is owned by the individual artists that uploaded it to the site and agree, through the Creative Commons licenses to share the music through this mechanism. [...] # What is this site all about?

This is a community music remixing site featuring remixes and samples licensed under Creative Commons licenses.  
   
 Music on this site is licensed under a Creative Commons license. You are free to download and sample from music on this site and share the results with anyone, anywhere, anytime. Some songs might have certain restrictions, depending on their specific licenses. Each submission is marked clearly with the license that applies to it.  
   
 Sometimes, however, a contributor might accidentally upload copyrighted materials he or she doesn’t have permission for. If you know of such a case or are the copyright holder of something posted here without your permission or a Creative Commons license, please let us know. [...] ccMixter is a remix site, we will not accept your back catalog. Creative Commons also sponsors and partners with other sites (such as the The Internet Archive and Our Media) where it is more than appropriate to put all of your material into the Commons.

### ccMixter - Wikipedia
URL: https://en.wikipedia.org/wiki/CcMixter
[edit]

 Official website

|  v  t  e  Creative Commons |

| Works and projects |  Licenses   + NonCommercial license  Licensed works   + Category  Public Domain Mark  Content directories  Jurisdiction ports |
| Major directories |  Creative Commons  ccMixter  Free Music Archive  Freesound  OpenGameArt.org  Openclipart  Dogmazic  Phlow  Electrobel  Jamendo  Newgrounds Audio portal  Scripped  Wikimedia   + Commons |
| People |  Lawrence Lessig  Joi Ito |
| See also |  Free and open content  Free culture movement |

Retrieved from ""

Categories:

 Hip-hop websites
 Creative Commons-licensed websites
 Open content projects
 Internet properties established in 2004
 American music websites

Hidden categories: [...] ccMixter is a community music produsage website that promotes remix culture and makes samples, remixes, and a cappella tracks licensed under Creative Commons available for download and re-use in creative works. Visitors are able to listen to, sample, mash-up, or interact with music in a variety of ways, including the download and use of tracks and samples in their own remixes. Most sampling or mash-up websites stipulate that users forgo their rights to the new song once it is created. By contrast, the material on ccMixter.org is generally licensed to be used in any arena, not just the ccMixter site or a specific context. The ccMixter site contains over 10,000 samples from a wide range of recording artists, including high-profile musicians such as Beastie Boys and David Byrne "David Byrne [...] The site originated as a project of Creative Commons, with the idea being conceived of and developed by Neeru Paharia (then Assistant Director of Creative Commons) as a "Friendster for music" with the intent of exposing the genealogy of remixed music. The vision was both to ...

### Jamendo API - Free Music API | Free APIs For You | Free APIs For You
URL: https://www.freeapisforyou.in/api/jamendo
# JamendoAPI Documentation. ### API Specifications. ## About JamendoAPI. The JamendoAPI is a powerful and reliable musicAPI that provides developers with easy access to music-related data and functionality. This API is designed with simplicity and performance in mind, making it perfect for both beginners and experienced developers who want to integrate musicfeatures into their applications. ### Key Features. * CORS enabled for browser requests. * Reliable uptime and fast response times. ### Perfect For. ### Getting Started. To get started with the Jamendo API, you'll need to register for an account and obtain your OAuth credentials. Once you have your credentials, you can start making authenticated requests to the API endpoints. The API documentation provides comprehensive guides, code examples, and best practices to help you integrate quickly and efficiently. Whether you're building a simple proof of concept or a production application, the JamendoAPI has the reliability and features you need. ## JamendoAPI - Frequently Asked Questions. ### How do I get started with the JamendoAPI? To get started, you'll need to register for an OAuth token from the official documentation page. ### Is the JamendoAPI really free? The JamendoAPI offers a generous free tier. While there are some rate limits, they are quite generous for most use cases.Check the official documentation for specific details. ### Can I use this API in my commercial project? Most free APIs can be used in commercial projects, but it's important to check the specific terms of service for the JamendoAPI. Review their documentation and terms of use to ensure compliance. ### What programming languages can I use with this API? The JamendoAPI is a REST API that can be used with any programming language that supports HT ...

### Creative Commons Music: Licenses, Uses, and Real Limits
URL: https://www.soundstripe.com/blogs/creative-commons-music
No. CC licenses are self-executing legal agreements that apply automatically when you find a CC-licensed track and comply with its specified terms. No signature, payment, or direct contact with the artist is required. If you violate the terms, for example by skipping attribution or using a non-commercial track commercially, your license terminates automatically.

Free Music Archive, ccMixter, Musopen, SoundCloud's CC filter, and Pixabay all host CC-licensed music that's searchable by license type. Free Music Archive leans toward indie and experimental; Musopen covers public domain classical recordings; ccMixter specializes in licensed remixes. Always confirm the individual track's license before downloading. [...] It depends on the license. CC BY and CC BY-SA allow commercial use; CC BY-NC, CC BY-NC-SA, and CC BY-NC-ND prohibit commercial use entirely. Sponsored content, monetized YouTube channels, client video work, and paid advertising all qualify as commercial use. The "NC" designation in any CC license name means commercial use is restricted.

Many tracks carry CC licenses, including Nine Inch Nails' Ghosts I-IV (CC BY-NC-SA) and Scott Buckley's orchestral works (CC BY 4.0). King Gizzard and the Lizard Wizard released Polygondwanaland under CC BY-ND, but the ND designation makes it unusable in video. Free Music Archive, ccMixter, Musopen, SoundCloud, and Pixabay all host searchable catalogs filterable by license type. [...] Look for a CC license icon or explicit license text in the track's description or metadata, then confirm the specific license type and version. Use search.creativecommons.org to filter results to CC-licensed tracks across multiple platforms. On SoundCloud, Free Music Archive, and ccMixter, CC license labels appear next to the track title. If no l ...


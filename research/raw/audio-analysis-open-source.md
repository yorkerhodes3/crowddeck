# audio-analysis-open-source

QUERY: open source audio analysis BPM key detection aubio Essentia librosa QM-DSP keyfinder

## Synthesized answer
Aubio is a lightweight C library (with Python wrappers) that provides real‑time‑capable onset detection, beat tracking, BPM estimation and pitch tracking, and it also includes a basic key‑detection algorithm; it is released under the GNU GPL. Essentia is an extensive open‑source C++ framework (with Python bindings) offering more than 250 algorithms, including robust beat‑tracking and tempo (BPM) extraction as well as high‑level tonal descriptors such as chroma, pitch‑salience and a dedicated key‑detection extractor; it is distributed under the AGPL‑v3 license. Librosa is a pure‑Python library widely used in music‑information‑retrieval research that supplies onset envelopes, autocorrelation‑based tempo estimation and beat tracking, and it can derive musical key by computing chroma features and applying standard key‑profile correlation (though it does not ship a dedicated key‑finder module); it is released under a BSD‑style license. QM‑DSP KeyFinder is a standalone open‑source key‑detection algorithm (originally written in C++ and used in DJ software such as Mixxx) that analyzes a long‑term chroma histogram and matches it to key profiles, offering higher accuracy for tonal music than many generic approaches and being available under an MIT‑compatible licence. All four tools are free to use, but they differ in language bindings, licensing, algorithmic depth and typical use cases: Aubio for quick, low‑latency analysis; Essentia for comprehensive, high‑performance MIR pipelines; Librosa for research prototyping in Python; and QM‑DSP KeyFinder for precise standalone key detection.

## Sources

### Automatic BPM and Key Detection: How It Works (2025) | StemSplit
URL: https://stemsplit.io/blog/bpm-key-detection-feature
### Why librosa?

Industry Standard: librosa is the de facto standard for music information retrieval in Python. It's used by:

 Spotify for audio analysis
 YouTube Music for content identification
 Research institutions for music information retrieval
 Professional audio software for tempo/key detection

Proven Accuracy: The algorithms in librosa are based on decades of research in music information retrieval. They're battle-tested on millions of songs and refined through academic research.

Open Source & Maintained: Unlike proprietary solutions, librosa is open source, actively maintained, and transparent about its methods. You can verify exactly how detection works.

### BPM Detection Process

Our BPM detection analyzes 60 seconds of audio — the sweet spot between accuracy and speed. [...] ### Why librosa instead of other libraries?

librosa is:

 Industry standard (used by major platforms)
 Open source and transparent
 Based on validated research
 Actively maintained
 Proven accurate on millions of songs

### Can I use this data commercially?

Yes. BPM and key metadata detected by StemSplit can be used in your applications, DJ software, or music analysis tools. The data is provided as-is — you're responsible for how you use it.

### How long does detection take?

BPM and key detection adds 2-3 seconds to processing time. This happens automatically during stem separation, so there's no additional wait.

## The Bottom Line [...] Building an app that needs BPM and key data? Our API makes it easy to access this metadata programmatically. Check out our developer documentation to get started.

## Technical Deep Dive: The Detection Algorithms

### BPM Detection Algorithm

librosa uses a multi-stage approach:

Stage 1: Onset Detection

 Analyzes the audio signal for sudden  ...

### ESSENTIA: an open source library for audio analysis – ACM SIGMM Records
URL: https://records.sigmm.org/2014/03/20/essentia-an-open-source-library-for-audio-analysis
Over the last decade, audio analysis has become a field of active research in academic and engineering worlds. It refers to the extraction of information and meaning from audio signals for analysis, classification, storage, retrieval, and synthesis, among other tasks. Related research topics challange understanding and modeling of sound and music, and develop methods and technologies that can be used to process audio in order to extract acoustically and musically relevant data and make use of this information. Audio analysis techniques are instrumental in the development of new audio-related products and services, because these techniques allow novel ways of interaction with sound and music.  Essentia is an open-source C++ library for audio analysis and audio-based music information [...] Tonal descriptors: Pitch salience function, predominant melody and pitch, HPCP (chroma) related features, chords, key and scale, tuning frequency
 Rhythm descriptors: beat detection, BPM, onset detection, rhythm transform, beat loudness
 Other high-level descriptors: danceability, dynamic complexity, audio segmentation, semantic annotations based on SVM classifiers [...] models that Essentia can use to compute high-level description of music. Essentia is not a framework, but rather a collection of algorithms wrapped in a library. It doesn’t enforce common high-level logic for descriptor computation (so you aren’t locked into a certain way of doing things). It rather focuses on the robustness, performance and optimality of the provided algorithms, as well as ease of use. The flow of the analysis is decided and implemented by the user, while Essentia is taking care of the implementation details of the algorithms being used. A number of examples are provided with the library, however they ...

### pyAudioAnalysis: An Open-Source Python Library for Audio Signal Analysis
URL: https://pmc.ncbi.nlm.nih.gov/articles/PMC4676707
| Name | Description |
 :--- |
| Yaafe | A Python library for audio feature extraction and basic audio I/O ( |
| Essentia | An open-source C++ library for audio analysis and music information retrieval. Mostly focuses on audio feature extraction, basic I/O, while it also provides some basic classification functionalities  |
| aubio | A C library for basic audio analysis: pitch tracking, onset detection, extraction of MFCCs, beat and meter tracking, etc. Provides wrappers for Python.  |
| CLAM (C++ Library for Audio and Music) | A framework for research / development in the audio and music domain. Provides the means to perform complex audio signal analysis, transformations and synthesis. Also provides a graphical tool.  | [...] | Matlab Audio Analysis Library | A Matlab library for audio feature extraction, classification, segmentation and music information retrieval  Can be used as companion matetrial for the book  |
| librosa | A Python library that implements some audio features (MFCCs, chroma and beat-related features), sound decomposition to harmonic and percussive components, audio effects (pitch shifting, etc) and some basic communication with machine learning components (e.g. clustering)  |
| PyCASP | This Python library focuses on providing a collection of specializers towards automatic mapping of computations onto parallel processing units (either GPUs or multicore CPUs). These computations are presented through a couple of audio-related examples. | [...] Open in a new tab

A list of related libraries and packages focusing on audio analysis.

Fig 1 illustrates a conceptual diagram of the library, while Fig 2 shows some screenshots from the library’s usage. pyAudioAnalysis implements the following functionalities:

   Feature extraction: several audio features b ...

### Homepage — Essentia 2.1-beta6-dev documentation
URL: https://essentia.upf.edu
Essentia is an open-source C++ library for audio analysis and audio-based music information retrieval. It contains an extensive collection of algorithms, including audio input/output functionality, standard digital signal processing blocks, statistical characterization of data, a large variety of spectral, temporal, tonal, and high-level music descriptors, and tools for inference with deep learning models. [...] essentia-logo

# Essentia

Open-source library and tools for audio and music analysis, description and synthesis

#### Extensive collection of reusable algorithms

Flexible and easily extendable algorithms for common audio analysis processes and audio and music descriptors.

#### Cross-platform

Linux, Mac OS X, Windows, iOS, Android, and Web.

#### Fast prototyping

Python scientific environment, JavaScript bindings, and command-line audio analysis tools.

#### Industrial applications

Optimized for computational speed, including real-time use cases.

### About [...] #### Similarity

Analyze audio and compute features to find similar sounds or music tracks.

#### Classification

Classify sounds or music based on computed audio features.

#### Deep learning inference

Use data-driven TensorFlow models for a wide range applications from music annotation to synthesis.

#### Mood detection

Find if a song is happy, sad, aggressive or relaxed.

#### Key detection

Find a key of a music piece.

#### Onset detection

Detect onsets (and transients) in an audio signal.

#### Segmentation

Split audio into homogeneous segments that sound alike.

#### Beat tracking

Estimate beat positions and tempo (BPM) of a song.

#### Melody extraction

Estimate pitch in monophonic and polyphonic audio.

#### Audio fingerprinting

### [PDF] ESSENTIA: AN AUDIO ANALYSIS LIBRARY FOR MUSIC ...
URL: https://www.justinsalamon.com/uploads/4/3/9/4/4394963/bogdanov_essentia_ismir13.pdf
2. ESSENTIA 2.0 We present Essentia 2.0, an extensive open-source library for audio analysis and audio-based music information re-trieval released under the Affero GPL 6 license and well-suited for both research and industrial applications. 7 In its core, Essentia is comprised of a reusable collection of algorithms to extract features from audio. The available al-gorithms include audio ﬁle input/output functionality, stan-dard digital signal processing (DSP) building blocks, ﬁl-ters, generic algorithms for statistical characterization, and spectral, temporal, tonal and high-level music descriptors. [...] ESSENTIA: AN AUDIO ANALYSIS LIBRARY FOR MUSIC INFORMATION RETRIEVAL Dmitry Bogdanov1, Nicolas Wack2, Emilia G´ omez1, Sankalp Gulati1, Perfecto Herrera1 Oscar Mayor1, Gerard Roma1, Justin Salamon1, Jos´ e Zapata1 and Xavier Serra1 Music Technology Group, Universitat Pompeu Fabra, Barcelona, Spain 1{name.surname}@upf.edu 2essentia@wackou.otherinbox.com ABSTRACT We present Essentia 2.0, an open-source C++ library for audio analysis and audio-based music information retrieval released under the Affero GPL license. It contains an ex-tensive collection of reusable algorithms which implement audio input/output functionality, standard digital signal pro-cessing blocks, statistical characterization of data, and a large set of spectral, temporal, tonal and high-level mu-sic descriptors. The library [...] 6. CONCLUSIONS We have presented a cross-platform open-source library for audio analysis and audio-based music information research and development, Essentia 2.0. The library is versatile and may suit the needs of both researchers within MIR com-munity and the industry. In our future work we will focus on expanding the library and the community of users, We plan to add new music ...

### Audio and Music Analysis on the Web using Essentia.js
URL: https://transactions.ismir.net/articles/10.5334/tismir.111
Over the last two decades, the existing software tools for audio analysis have been mostly written in C/C++, Java and Python and delivered as standalone applications, host application plug-ins, or as software library packages. Software libraries with a Python API, such as Essentia (Bogdanov et al., 2013), Librosa (McFee et al., 2015), Madmom (Böck et al., 2016), Yaafe (Mathieu et al., 2010) and Aubio (Brossier, 2006), have been especially popular within the MIR community due to rapid prototyping needs and a large collection of available tools for scientific computation. Meanwhile, the libraries with a native C/C++ implementation offered faster analysis (Moffat et al., 2015) and were often required for industrial audio applications. Various web applications for audio processing and [...] Considering native software tools, Moffat et al. (2015) evaluated a wide range of MIR software libraries in terms of coverage, effort, presentation, and time lag and found Essentia8 (Bogdanov et al., 2013) to be an overall best performer with respect to these criteria. Essentia is an open-source library for audio and music analysis available under the AGPLv3 license9 providing a wide range of optimized algorithms (over 250 algorithms) that are successfully used in various academic and industrial large-scale applications. Essentia includes both low-level and high-level audio features, along with some ready-to-use feature extractors, and it provides an object-oriented interface to fine-tune each algorithm in detail. Given all these advantages and that the code repository is consistently [...] In this article,1 we present Essentia.js,2 an open-source JS library for audio and music analysis on the web, released under the AGPLv3 license. It allows audio analysis and MIR applications to be bui ...

### Bpm audio detection Library [closed] - Stack Overflow
URL: https://stackoverflow.com/questions/477944/bpm-audio-detection-library
There is a much better OSS library called aubio. It can also do beat detection and onset detection. It also supports key detection and other

### aubio, a library for audio labelling
URL: https://aubio.org
As of version 0.4.0, aubio has no required dependencies. Optionally, aubio can be built with libav, libsndfile, libsamplerate and FFTW (none of these are needed on Apple platforms). On Linux platforms, aubio can be built using JACK, while on Apple machines, JackOSX and AudioToolbox can be used.

## License

aubio is a free and open source software released under the GNU/GPL license.

Note: aubio is not MIT or BSD licensed. Contact the author if you need it in your commercial product.

© 2003-2018 the aubio team | cc-by-sa [...] about
 latest news
 download
 get help
 donate
 contact

# aubio

github logo   github logo

## Latest changes

## Latest news

## What is aubio ?

aubio is a tool designed for the extraction of annotations from audio signals. Its features include segmenting a sound file before each of its attacks, performing pitch detection, tapping the beat and producing midi streams from live audio.

Because these tasks are difficult, we thought it was important to gather them in a dedicated library. To increase the fun, we have made these algorithms work in a causal way, so as to be used in real time applications with as low delay as possible. Functions can be used offline in sound editors and software samplers, or online in audio effects and virtual instruments.

## Features


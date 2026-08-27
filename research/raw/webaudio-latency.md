# webaudio-latency

QUERY: Web Audio API latency AudioWorklet limitations professional DJ app browser vs native

## Synthesized answer
AudioWorklet gives the Web Audio API its lowest‑latency path by forcing a fixed 128‑sample (≈3 ms at 44.1 kHz) processing block on a dedicated audio thread, but the overall end‑to‑end latency of a browser‑based DJ app is still dominated by the operating‑system audio pipeline, device‑buffer size, and inter‑thread communication, which cannot be configured by the web page; as a result real‑world round‑trip latencies on desktop browsers typically sit in the 20‑30 ms range and can rise to 50‑100 ms on some mobile devices, with Chrome showing noticeable jitter (latency measurements ranging from ~78 ms up to >150 ms) while Firefox is generally more consistent and a few milliseconds faster. Native DJ software can use low‑level APIs such as ASIO, WASAPI, or CoreAudio to choose buffer sizes as low as 32‑64 samples and obtain sub‑10 ms deterministic latency with accurate device‑parameter reporting, which is essential for professional monitoring, beat‑matching, and cue‑point accuracy. Consequently, while AudioWorklet makes web‑based audio processing feasible and can achieve low internal latency, current browsers still cannot reliably meet the strict <10 ms latency and jitter requirements of a professional DJ application, making native implementations the preferred choice for high‑performance, latency‑critical DJ workloads.

## Sources

### I don’t know who the Web Audio API is designed for | Hacker News
URL: https://news.ycombinator.com/item?id=15240762
and due to the uncertainity whether the browser will switch between 2 buffers without missing samples. But surprisingly it worked and did the job. I included a buffering of 200ms, which means I only started playback 200ms to be able to receive more data in the background and have a little bit more time to append further buffers. I experimented a little bit with that number but can't remember how deep the lower limit was before getting dropouts regurarly. It definitely wasn't usable for low-latency playback. | | | |  |  |  |  ---  |  |  | jancsika on Sept 13, 2017  | prev | next (javascript:void(0))   Just from skimming the spec, the AudioWorklet interface looks very close to what is needed to build sensible, performant frameworks for audio profs and game designers. So the most important [...] |  |  |  |
 --- 
|  |  | raphlinus on Sept 14, 2017  | root | parent | next (javascript:void(0))   1. This is going to depend a lot on the app; doing an actual DAW is going to require some pretty heavy processing. It also depends on the performance goal. Truly pro audio would be a 10ms end-to-end latency, which is extremely unforgiving. 2. Some form of WebWorker is obviously where we're going. But does postMessage() have the potential to cause delay in the worker that receives it? (There are ways to solve this but it requires some pretty heavy engineering) |

2. Some form of WebWorker is obviously where we're going. But does postMessage() have the potential to cause delay in the worker that receives it? (There are ways to solve this but it requires some pretty heavy engineering) [...] | |  |  |  |  ---  |  |  | raphlinus on Sept 14, 2017  | root | parent | next (javascript:void(0))   1. This is going to depend a lot on the app; doing an actual DAW is going to require some pretty he ...

### Web Audio API - DSP and Plugin Development Forum - KVR Audio
URL: https://www.kvraudio.com/forum/viewtopic.php?t=432395
Hi ulozilla,  
   
 I was kinda in the same spot as you are some time ago. I have a background in programming for the web and wanted to get more into audio programming. My field is audio/music technology so I do have an understanding of how it all works.   
   
 I've experimented with the Web Audio API but it isn't for native processing. The implementation and latency of the various browser engines are rather different still. Even with wrappers for running web apps as native apps, its not suitable for such applications. Web audio is still limited in terms of its power. I made a web app to play around that you can check out at the link below. Web audio isn't suitable for all audio applications. [...] > heclak wrote:Hi ulozilla,  
>    
>  I was kinda in the same spot as you are some time ago. I have a background in programming for the web and wanted to get more into audio programming. My field is audio/music technology so I do have an understanding of how it all works.   
>    
>  I've experimented with the Web Audio API but it isn't for native processing. The implementation and latency of the various browser engines are rather different still. Even with wrappers for running web apps as native apps, its not suitable for such applications. Web audio is still limited in terms of its power. I made a web app to play around that you can check out at the link below. Web audio isn't suitable for all audio applications.  
>    
>    
> [...] > MadBrain wrote:WebAudio can do some cool things and is appearing on browsers other than Chrome, but there's a limit to how much you can do. Generally, it's impossible to get the kind of super-low latency stuff you get in DAWs, JS can only go so fast so there's a limit on the amount of audio you can generate from brute calculation. If you w ...

### AudioWorklet is a real world disaster and a major obstacle to simple audio development · Issue #2632 · WebAudio/web-audio-api · GitHub
URL: https://github.com/WebAudio/web-audio-api/issues/2632
Copy link

## Description

@goldwaving

goldwaving

opened on Apr 8, 2025

Issue body actions

After working on this for years now (see this), I am forced to conclude that in the real world the AudioWorklet specification is a disaster.. The mandated low 128 sample latency is causing massive distortion across all mobile devices and browsers (unless you have the most basic single threaded app, and even then occasional glitches occur). [...] None of these problems occurred when using ScriptProcessorNode. Despite all the theoretical rhetoric about it being inadequate in the real world, ScriptProcessorNode worked! But now that AudioWorklet is ingrained in all major web browsers, even the original ScriptProcessorNode code is poisoned by crackling distortions. In the real world, it is AudioWorklet that does not work.

It is beyond foolish to dictate a specific latency across all devices and platforms and have no way to adjust it. Perhaps all the web browsers have flawed implementations, but that is just another perfect example of the disaster that AudioWorklet has caused. Under no circumstances should 128 samples be used unless explicitly requested by the developer. [...] For the tiny, TINY fraction of web developers that need such low latency, they are welcome to fight with AudioWorklet. But do not force this disaster upon the rest of us that just need an easy way to access recorded audio data (for speech-to-text, voice commands, visuals, analysis, saving raw samples, etc.) where latency is irrelevant.

This is how easy it should be:

```
const stream = await navigator. mediaDevices. getUserMedia({audio true}); const mediaRecorder = new MediaRecorder(stream,"audio/raw"); mediaRecorder. ondataavailable =(event) =>{// event.data is a blob containing an array of Float32 values}; ...

### Thoughts and considerations on building audio apps on the web - Hongchan Choi - W3C/SMPTE Joint Workshop on Professional Media Production on the Web
URL: https://www.w3.org/2021/03/media-production-workshop/talks/hongchan-choi-building-audio-apps.html
Protecting user privacy was considered a hassle and it was definitely a limiting factor of the web platform, but I believe so-called privacy over API design is gradually becoming a norm, even on the native platforms.

These days, you will find similar protection mechanisms like a system-wide permission UI for microphone access in other operating system like MacOS or Windows.

Now let's talk a little bit about latency. I'm well aware that this is a thorny issue when it comes to the web platform and at least for Chrome Web Audio, we are not particularly doing well in audio latency department. [...] Okay, let's shift gears and talk about other issues like device latency and user privacy.

As you're building a client side application, like an instrument or an audio recorder, editor, or a DAW, soon you will realize that the lack of access to audio device is a big gap between the web and the native platform.

It means that device related settings, such as number of channels, sample rate, and buffer size are not readily available for your application.

We, browser implementers, actually are aware of that that this is a huge pain point for developers, but it is not without a reason. [...] For audio production apps, the latency is important at least for two reasons. First, the minimum latency possible matters when you're recording or monitoring, but also accurate latency reporting from the platform is critical for compensating audio after the fact.

But it's a tricky problem for browsers. The browser needs to support a variety of configurations on many different platforms. It means that we are spreading thin and might be missing some obvious platform specific optimizations.

When seasoned audio developers jump in Chrome's audio infrastructure, point out some problems, we are alw ...

### AudioWorklet Latency: Firefox vs Chrome
URL: https://www.jefftk.com/p/audioworklet-latency-firefox-vs-chrome
You would expect that latency would be completely consistent, because you can't change the length of the delay without getting ugly artifacts, but in Chrome it was not consistent. Earlier I made a much longer recording (mp3) and taking the two sections where you can clearly hear Chrome echos (mp3, mp3) I get 78ms, 78ms, 77ms, 94ms, 94ms, 93ms, 93ms, 93ms and then later 88ms, 88ms, 88ms, 88ms, 88ms, 93ms, 109ms, 109ms, 114ms, 114ms, 120ms, 147ms, 152ms, 152ms, 152ms, 152ms, 152ms, 152ms, 152ms, 152ms, 152ms, 163ms, 153ms, 153ms. Since one of the projects I'd like to do with browser audio requires completely consistent latency, I'm not sure it would work at all in Chrome. [...] Jeff Kaufman
 Posts
 RSS
 ◂◂RSS
 Contact

|  |  |
 --- |
| AudioWorklet Latency: Firefox vs Chrome | May 6th, 2020 |
| audio, tech |

Reading the Firefox 76 Release Notes I noticed that it now supports `AudioWorklet`. I tested out my whistle-controlled bass synthesizer, and it felt much better than in Chrome, though still not as responsive as the native version. I decided to take some latency measurements.

I connected the computer (2017 MacBook Pro running 10.14.6) to an external speaker and microphone, set the browser to run a simple AudioWorklet-based echo, and set my phone to record. I made a sharp tapping sound, and looked at the recording to see the delay from when the original sound is recorded to when the echo plays it back. [...] PortAudio compared very similarly to Firefox, about 3ms faster. I'm not sure what Reaper is doing to get much lower latency than PortAudio and Firefox? If I was going to look into this further my next step would be to log which system calls they're making and try to figure out what they're doing differently.

Overall, I'm very impressed with Firefox's `AudioWorkle ...

### AudioWorklet - Web APIs | MDN
URL: https://developer.mozilla.org/en-US/docs/Web/API/AudioWorklet
Skip to search

Toggle sidebar 

1. Web
2. Web APIs
3. AudioWorklet

 

Remember language   Learn more

 Deutsch
 English (US)
 Français
 日本語
 한국어

# AudioWorklet

 

Baseline  Widely available

This feature is well established and works across many devices and browser versions. It’s been available across browsers since April 2021.

 Learn more
 See full compatibility

Secure context: This feature is available only in secure contexts (HTTPS), in some or all supporting browsers.

The `AudioWorklet` interface of the Web Audio API is used to supply custom audio processing scripts that execute in a separate thread to provide very low latency audio processing. [...] ## Events

`AudioWorklet` has no events to which it responds.

## Examples

See `AudioWorkletNode` for complete examples of custom audio node creation.

## Specifications

| Specification |

| Web Audio API # AudioWorklet |

## Browser compatibility

## See also

 `AudioWorkletGlobalScope` — the global execution context of an `AudioWorklet`
 Web Audio API
 Using the Web Audio API
 Using AudioWorklet

## Help improve MDN

 Learn how to contribute

This page was last modified on by MDN contributors.

View this page on GitHub") • Report a problem with this content

### Audio worklet design pattern  |  Blog  |  Chrome for Developers
URL: https://developer.chrome.com/blog/audio-worklet-design-pattern
The former is important to developers with an existing investment in audio
processing code and libraries, but the latter is critical for nearly all users
of the API. In the world of WebAudio, the timing budget for the stable audio
stream is quite demanding: it is only 3ms at the sample rate of 44.1Khz. Even a
slight hiccup in the audio processing code can cause glitches. The developer
must optimize the code for faster processing, but also minimize the amount of JS
garbage being generated. Using WebAssembly can be a solution that addresses both
problems at the same time: it is faster and generates no garbage from the code. [...] ### Handling Buffer Size Mismatch

An AudioWorkletNode and AudioWorkletProcessor pair is designed to work like a
regular AudioNode; AudioWorkletNode handles the interaction with other codes
while AudioWorkletProcessor takes care of internal audio processing. Because a
regular AudioNode processes 128
frames
at a time, AudioWorkletProcessor must do the same to become a core feature.
This is one of the advantages of the Audio Worklet design that ensures
no additional latency due to internal buffering is introduced within the
AudioWorkletProcessor, but it can be a problem if a processing function requires
a buffer size different than 128 frames. The common solution for such case is to
use a ring buffer, also known as a circular buffer or a FIFO.

### Riding the latest waves on the web
URL: https://superpowered.com/riding-the-latest-waves-on-the-web
This glitch-free low-latency approach swings open the doors for the Web to become a viable and stable platform for more advanced gaming, audio processing pipelines, online DAW and online collaboration tools. With a fixed frame size of 128 samples (3ms at 44.1kHz) across the board, the processing latency allows for very low round time times which make conversations more natural, games more responsive, live performance recordings tighter and synths much more playable.

After a few years of API stabilisation and waiting patiently for the vendor’s release cycles, AudioWorklets are now supported across all major browsers and devices, achieving near identical real-world performance. [...] ## AudioWorklets: Unravelling The Threads

One of the most notable recent improvements in WebAudio is the significant reduction in latency. Through the use of AudioWorklets, developers can now run custom DSP directly within a dedicated audio rendering thread with PCM sample access. This allows for better performance and precision when processing audio signals, ultimately leading to a more seamless and immersive audio experience for users.

AudioWorklet processing is isolated from the main JavaScript execution context with a MessagePort or SharedArrayBuffers (more on that later) offered to exchange data and commands between the threads. This is critical in ensuring high-performance audio processing without any noticeable glitches or dropouts. [...] The ScriptProcessorNode had severe performance limitations, such as running audio processing on the main javascript thread and requiring relatively high buffer sizes, which could (and almost always would) cause audio glitches and latency issues. Not fun. Safe to say, if you ever see ScriptProcessorNode’s being used in any web audio libraries in 202 ...


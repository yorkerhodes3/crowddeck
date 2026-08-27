# stem-separation-open-source

QUERY: open source stem separation Demucs Spleeter real time performance GPU latency

## Synthesized answer
Spleeter is the fastest open‑source stem separator: on a modern GPU it runs at roughly 100 × real‑time, meaning a three‑minute track can be processed in about two seconds and the model only needs a 2–3 second look‑ahead buffer, giving sub‑second to low‑single‑digit‑second latency that makes real‑time or live‑performance use feasible; it also runs acceptably on CPUs at a few‑times‑real‑time speed. Demucs, by contrast, prioritises quality over speed: even with a recent GPU (e.g., RTX 3080 or RTX 4060) it processes a three‑minute song in roughly 20–30 seconds (5–10 × real‑time), and on CPU it can be slower than real‑time (≈0.8 × real‑time on a high‑end desktop), resulting in latency on the order of tens of seconds, and it typically requires 4–8 GB of VRAM and higher memory usage, so it is unsuitable for true real‑time applications but delivers markedly cleaner stems.

## Sources

### Demucs vs Spleeter - The Ultimate Guide | BeatsToRapOn Blog
URL: https://beatstorapon.com/blog/demucs-vs-spleeter-the-ultimate-guide
Performance: Spleeter’s claim to fame (besides being open) was its efficiency. They reported 100× real-time speed on GPU for 4 stem】. Technically, this is due to the fully-convolutional nature of the network and using a high-level language (C/C++ in TF backend) to perform the heavy FFTs and convolutions. This made it feasible to separate dozens of songs quickly, which was previously painful.

The name “Spleeter” is presumably a play on “splitter” with a French accent or something fun. It quickly became a meme in producer communities – “just Spleet it out” people would say when wanting an a cappella. [...] Demucs is significantly slower and more resource-intensive. Its complex model (CNN + LSTM/Transformer) requires more computation. Without a GPU, Demucs can be slower than real-time – e.g., it might take ~5 minutes to separate a 5-minute song on a high-end C5】 (about 0.8× real-time speed, or worse on less powerful CPUs). On a GPU, Demucs speeds up considerably, but still not to Spleeter’s level. Users report Demucs v3/v4 processing a 3-minute song in perhaps 10–30 seconds on a modern GPU – which is 5–10× real-time, versus Spleeter’s 50–100×. In one head-to-head anecdote, \\Spleeter separated a track ~12× faster than Demucs on the same CPU5】. Demucs’s heavy lifting (especially in v4 with self-attention and large LSTMs) also means higher memory usage. It might consume a few GB of RAM/VRAM [...] Real-time or live use scenarios favor Spleeter. Because Spleeter’s model operates on relatively small spectrogram windows and is fully convolutional, it can produce results with minimal buffering. Indeed, DJ applications have integrated AI separation (for creating on-the-fly instrumentals or a cappellas during a set) and likely use a Spleeter-like approach due to its low latency. I ...

### Spleeter vs Demucs: Which AI Stem Separator Wins? - Neural Analog
URL: https://neuralanalog.com/docs/spleeter-vs-demucs-comparison
The YouTube comparison video shows this difference clearly. Demucs stems sound more natural with fewer artifacts, while Spleeter can produce metallic ringing on complex material.

### Real-World Performance Implications

Speed: Spleeter processes a 3-minute track in ~2 seconds on GPU. Demucs v4 takes ~20-30 seconds. On CPU, Spleeter might take 30-60 seconds. Demucs can stretch to 5+ minutes.

Hardware: Spleeter runs on 8GB RAM laptops in CPU-only mode. Demucs v4 needs a GPU with 4-8GB VRAM for reasonable speed. The Transformer model consumes significantly more memory due to attention matrices. [...] The genius of Spleeter is its pragmatism. It separates a four-minute track in seconds, hitting 100x real-time speed on GPU and running comfortably on modest CPUs. It offers 2-stem (vocals/accompaniment), 4-stem, and 5-stem configurations, becoming the research baseline and powering countless YouTube remix channels.

### Demucs: The Quality-Obsessed Powerhouse

While Spleeter was conquering speed, Meta AI Research was chasing quality. Alexandre Défossez (also French) and his team introduced Demucs in 2019 (short for Deep Extractor for MUlti-Channel Sources). They took a radically different approach. [...] ### The Hybrid Workflow

Smart producers use both. Run Spleeter on your entire catalog to find promising tracks, then process finalists with Demucs. For live performance, pre-separate with Spleeter. For studio work, Demucs delivers master-grade stems. Tools like Ultimate Vocal Remover bundle both models behind a simple GUI.

### Hardware Reality Check

Spleeter runs on CPU, while high-quality Demucs workflows are much more comfortable with a GPU. If you're looking for offline inference or laptop-friendly batch processing, Spleeter-style models can still be useful. If you nee ...

### Music Source Separation: Choosing Demucs/UVR5/Spleeter/Open-Unmix
URL: https://tomodahinata.com/en/blog/music-source-separation-tool-selection-demucs-uvr-spleeter
Spleeter (Deezer): made with TensorFlow. It bundles pre-trained 2/4/5-stem models, and its weapon is the overwhelming speed of about 100× real-time on GPU. The quality yields a step to the latest generation, but it's ideal for bulk prep. MIT license.
 Open-Unmix (UMX, sigsep): a PyTorch reference implementation. A simple structure estimating the mask with a 3-layer bidirectional LSTM, widely used as a research baseline. Lightweight and readable, but the quality yields to the specially optimized ones above. [...] | Aspect | Demucs v4 | UVR5 / MDX-Net | Spleeter | Open-Unmix |
 ---  --- 
| Development | Meta | Anjok07 et al. (OSS) | Deezer | sigsep |
| Method | Waveform + spectrum + Transformer | Two-stage frequency + time | CNN (spectrogram) | BiLSTM (spectrogram) |
| Stems | 4 / 6 | Mainly 2 (Vocals/Inst) | 2 / 4 / 5 | 4 |
| Quality (rule of thumb) | Highest (9.0–9.20 dB) | High (vocal separation especially strong) | Mid (speed-prioritized) | Mid (reference implementation) |
| Speed | Mid (GPU recommended, CPU possible) | Mid (GPU recommended) | Fastest (100× real-time on GPU) | Fairly fast |
| Setup | `pip install demucs` | GUI / `pip install audio-separator` | `pip install spleeter` | `pip install openunmix` |
| GUI | None (CLI/API) | Yes | None | None | [...] Is it OK to embed in a commercial product?
:   The code is all MIT and mostly OK. But always confirm the weights license (especially Open-Unmix UMXL is non-commercial) and the rights processing of the input song separately.

I only have a CPU.
:   It works (slowly). Demucs is about 1.5× real-time, Spleeter is relatively light. GPU is recommended for bulk, but CPU is enough for small verification.

Should I just choose the one with the highest SDR on the benchmark?
:   That's dangerous. SDR is a relative value de ...

### Stem Separation Compared: Demucs vs Spleeter vs LALAL (2026)
URL: https://www.melodex.app/blog/ai-music-stem-separation-demucs-spleeter-lalal
## Quick Answer

For 2026 stem separation, run Demucs HT (specifically htdemucs\_ft) locally if you have a decent GPU or Apple Silicon, it produces the cleanest stems and costs nothing. Use LALAL.AI if you cannot run anything locally, you need clean stems in 60 seconds, and you do not mind paying $20-30 per pack. Skip Spleeter entirely, it is a 2019 model with a hard 11kHz ceiling that produces audibly worse output than Demucs on every test I ran. The exception is real-time use where Spleeter’s speed still wins. [...] The single thing Spleeter still does well is speed. On a CPU-only machine without a GPU, Spleeter is two to three times faster than Demucs for the same input. For real-time applications, batch processing on weak hardware, or quick rough-pass separations where quality is not the priority, Spleeter is still a reasonable choice. For anything you intend to use in a final production, run Demucs instead.

## Demucs HT: The 2026 Default and Its CPU Cost [...] The output quality is dramatically better than Spleeter. Frequencies clear 16kHz cleanly, separation between stems shows less bleed, phase artifacts are reduced to the point where recombined stems sound nearly identical to the original mix. On standardized SDR (signal-to-distortion ratio) benchmarks, Demucs HT scores roughly 10 to 15 percent higher than LALAL.AI’s Orion model and 30 to 40 percent higher than Spleeter on most material.

The cost is CPU time. Demucs HT requires either a GPU (NVIDIA or AMD with appropriate drivers) or Apple Silicon to run at acceptable speeds. On a CPU-only machine, separating a four-minute track can take 8 to 15 minutes. On an M2 or M3 Mac, the same track separates in 90 seconds. On an NVIDIA RTX 4060 or better, it is under 30 seconds.

### Spleeter: AI Audio Source Separation for Music Producers - Onegen
URL: https://www.onegen.ai/project/effortlessly-separate-vocals-and-instruments-with-spleeter-a-comprehensive-guide
## Why Spleeter Matters

Before Spleeter, high-quality source separation was largely confined to forensic labs or expensive, proprietary software. The release of Spleeter in 2019 revolutionized the field by providing a high-performance, open-source alternative that could process audio 100x faster than real-time on a GPU. This democratized access to stem extraction for DJs, remixers, and music students.

Spleeter’s primary value lies in its efficiency. While newer models may offer slightly higher fidelity, Spleeter remains one of the fastest tools for batch processing large libraries of music. For many users, the tradeoff between a slight increase in artifacts and a massive gain in processing speed is the ideal choice for rapid prototyping and remix prep.

## Key Features [...] ## How Spleeter Compares

Spleeter is often compared to other open-source tools like Demucs (by Meta) and Open-Unmix. While Spleeter was the first to bring high-quality separation to the masses, the landscape has evolved.

| Feature | Spleeter | Demucs | Open-Unmix |
 ---  --- |
| Processing Speed | Very Fast | Slower | Moderate |
| Audio Quality | Good (with artifacts) | Excellent | Good |
| Hardware Needs | Moderate (CPU/GPU) | High (GPU recommended) | Moderate |
| Setup Complexity | Simple | Moderate | Moderate | [...] Multi-Stem Separation: Spleeter offers three primary pretrained models. The 2-stem model separates vocals from accompaniment; the 4-stem model isolates vocals, drums, and bass; and the 5-stem model provides a more granular separation including piano.
 High-Speed Processing: By utilizing TensorFlow and GPU acceleration, Spleeter can separate audio files in a fraction of the time it takes to play the song. This makes it ideal for large-scale batch processing.
 Flexible Integration: ...

### Spleeter vs Demucs: Which AI Stem Separator Is Better? (2026) | StemSplit
URL: https://stemsplit.io/blog/spleeter-vs-demucs
### Key Differences

Spleeter produces:

 More "watery" artifacts on vocals
 Bass bleed into other stems
 Phasier sound on complex mixes
 Faster processing

Demucs produces:

 Cleaner vocal isolation
 Better bass definition
 Less artifact "shimmer"
 More natural sound overall

## Speed Comparison

Processing time for a 4-minute song:

| Model | CPU (AMD Ryzen 9 5950X) | GPU (NVIDIA RTX 3080) |
 --- 
| Spleeter 2stems | 15 sec | 3 sec |
| Spleeter 4stems | 18 sec | 4 sec |
| Demucs htdemucs | 90 sec | 20 sec |
| Demucs htdemucs\_ft | 120 sec | 25 sec |

Times may vary based on your hardware. GPU performance depends on VRAM availability and CUDA optimization.

Winner: Spleeter — significantly faster, especially on CPU-only systems.

### Visual Comparison: The Quality-Speed Tradeoff [...] ### Visual Comparison: The Quality-Speed Tradeoff

Here's how the models stack up when you plot quality against processing time. Notice how Demucs delivers significantly better quality for a reasonable time investment:

Key Insight: Demucs htdemucs hits the sweet spot—excellent quality without excessive processing time. The quality jump from Spleeter is worth the extra 15-20 seconds for most use cases.

## When to Use Each

### Use Spleeter When:

 Speed matters more than quality — live performance, quick previews
 Running on limited hardware — older CPU, no GPU
 Batch processing thousands of files — archives, cataloging
 Quality is "good enough" — casual listening, rough demos

### Use Demucs When: [...] Spleeter and Demucs are the two most popular open-source AI models for audio stem separation. But which one is actually better? We tested both extensively to give you a clear answer.

TL;DR: Demucs produces noticeably better quality, especially on complex mixes. Spleeter is faster but sh ...

### Demucs vs Spleeter: Which Open-Source Stem Splitter Is Actually Better? | Stem Splitter
URL: https://stemsplitter.github.io/demucs-vs-spleeter
## Speed and hardware requirements

Spleeter is faster. On CPU, it’s meaningfully quicker than HTDemucs, which was designed with GPU acceleration in mind. If you have older hardware or you’re processing jobs on a server without a GPU, Spleeter’s lower memory footprint and faster inference time is a real practical advantage. For batch processing a large library, this matters a lot.

HTDemucs on a modern GPU is fast enough for most production use cases, but it won’t win a speed comparison with Spleeter. You’re trading processing time for quality, and whether that trade is worth it depends on what you’re doing.

## Setup and ease of use [...] Comparison

# Demucs vs Spleeter: Which Open-Source Stem Splitter Is Actually Better?

By Aaron Michaels

Share on:

Both Demucs and Spleeter landed around 2019, and at the time they both felt like a major step forward for anyone doing production work. Spleeter came first, from Deezer Research, and got a lot of attention because it was fast, accessible, and actually worked. Demucs followed from Meta AI Research and has since had years of active development that Spleeter simply hasn’t had. The result is two tools that started near each other and have diverged considerably since.

## What each tool actually is

### Spleeter vs Demucs: Open-Source Stem Splitter Comparison 2026
URL: https://audiopod.ai/compare/spleeter-vs-demucs
Tool Comparison

# Spleeter vs Demucs: Which Open-Source Tool is Better?

Compare Deezer's Spleeter with Meta's Demucs for stem separation. Two leading open-source solutions head-to-head.

Ties

4

DemucsWins

### Spleeter

Spleeter is Deezer's open-source library from 2019, offering 2-stem or 5-stem separation with straightforward Python usage.

### Demucs

Demucs is Meta's newer open-source model using hybrid transformer architecture for up to 6 stems with superior quality.

Feature-by-Feature

## Detailed Comparison

See exactly how these tools compare across all major features

Category

Spleeter

Demucs

Winner

Maximum Stems

5 stems

6 stems

Demucs

AI Quality

Good

Excellent

Demucs

Processing Speed

Fast

Slower

Spleeter

Hardware Needs

Moderate

GPU recommended

Spleeter [...] Hardware Needs

Moderate

GPU recommended

Spleeter

Setup Complexity

Simple

Complex

Spleeter

Active Development

Limited

Active

Demucs

Documentation

Good

Good

Tie

Model Updates

Legacy

Regular

Demucs

The Verdict

## Our Final Analysis

Demucs wins 4 categories for quality and modern development. Spleeter wins 3 for speed and simplicity. For best results, consider AudioPod.

### Our Recommendation

Choose Demucs for best open-source quality. Choose Spleeter for simpler setup and faster processing. For professional use without setup, try AudioPod.

## Looking for Something Better?

AudioPod offers a 45-instrument stem catalog, YouTube processing, and professional quality. Try it free!

Try AudioPod Instead

## More Comparisons


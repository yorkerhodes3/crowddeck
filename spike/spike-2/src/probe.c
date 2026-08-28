// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors
//
// SPIKE-2 audio backend probe — REQ-NFR-1, REQ-NFR-2, SPECIFICATION §8.1.
//
// Measures callback timing stability for a given backend and buffer size, and
// writes one CSV line per callback for spike/spike-2/analyse.mjs to process.
//
// ## The rule this file obeys
//
// REQ-NFR-1: the audio thread MUST NOT allocate, lock, log, or perform I/O.
//
// That is not a style preference here, it is the measurement's validity. A probe
// that calls printf() inside the callback measures printf(), not the backend: the
// stdio lock and the write syscall dominate everything else and every backend looks
// identical and terrible. So the callback does exactly two things — read a clock
// and store the result in a preallocated array — and all output happens after the
// stream stops.
//
// The array is sized upfront for the whole run. If it fills, the callback stops
// recording rather than growing it, because a realloc on the audio thread is
// precisely the thing being measured for.

#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#if !defined(_WIN32)
/* clock_gettime and struct timespec. Absent here, this file happened to compile
   on Windows only because the POSIX branch below is preprocessed away — the kind
   of portability bug that hides until the first non-Windows build. */
#include <time.h>
#endif

#define MINIAUDIO_IMPLEMENTATION
#include "miniaudio.h"

/* One slot per callback. 20 minutes at 64 frames / 48 kHz is about 900k. */
#define MAX_SAMPLES 1000000

typedef struct {
    ma_uint64 *timestamps;   /* nanoseconds, monotonic */
    ma_uint32 *frames;
    unsigned char *xrun;
    volatile ma_uint32 count;
    ma_uint32 capacity;
    ma_uint64 last_end_ns;   /* to detect gaps that indicate a dropout */
    ma_uint32 expected_period_ns;
} probe_state;

/* Monotonic nanoseconds. No allocation, no locks. */
static ma_uint64 now_ns(void) {
#if defined(_WIN32)
    static LARGE_INTEGER freq;
    static int have_freq = 0;
    LARGE_INTEGER c;
    if (!have_freq) { QueryPerformanceFrequency(&freq); have_freq = 1; }
    QueryPerformanceCounter(&c);
    return (ma_uint64)((c.QuadPart * 1000000000ULL) / freq.QuadPart);
#else
    struct timespec ts;
    clock_gettime(CLOCK_MONOTONIC, &ts);
    return (ma_uint64)ts.tv_sec * 1000000000ULL + (ma_uint64)ts.tv_nsec;
#endif
}

/*
 * The audio callback.
 *
 * Everything here is O(1) with no syscalls. It writes silence — we are measuring
 * the transport, not a synthesiser, and generating audio would add work that
 * varies between runs and contaminate the timing.
 */
static void on_frames(ma_device *device, void *output, const void *input, ma_uint32 frame_count) {
    probe_state *st = (probe_state *)device->pUserData;
    ma_uint64 t = now_ns();

    (void)input;
    memset(output, 0, frame_count * device->playback.channels * ma_get_bytes_per_sample(device->playback.format));

    ma_uint32 i = st->count;
    if (i < st->capacity) {
        /* A gap much larger than the nominal period means the stream stalled;
           miniaudio does not surface xruns uniformly across backends, so this is
           the portable proxy. The threshold is generous (2x) so ordinary jitter
           is not counted as a dropout. */
        unsigned char xrun = 0;
        if (i > 0 && st->expected_period_ns > 0) {
            ma_uint64 dt = t - st->timestamps[i - 1];
            if (dt > (ma_uint64)st->expected_period_ns * 2) xrun = 1;
        }
        st->timestamps[i] = t;
        st->frames[i] = frame_count;
        st->xrun[i] = xrun;
        st->count = i + 1;
    }
}

static void usage(const char *argv0) {
    fprintf(stderr,
        "usage: %s [--frames N] [--rate HZ] [--seconds S] [--api NAME] [--device N] [--list] [--out FILE]\n"
        "\n"
        "  --frames   buffer size in frames (default 128; SPIKE-2 tests 64 and 128)\n"
        "  --rate     sample rate (default 48000)\n"
        "  --seconds  run length (default 60; needs 1000+ callbacks for a valid p99)\n"
        "  --api      wasapi | wasapi_shared | asio | coreaudio | alsa | jack | null\n"
        "  --device   playback device index (default: system default)\n"
        "  --list     enumerate playback devices and exit\n"
        "  --out      output file (default stdout)\n"
        "\n"
        "The default device is often not the one you want to measure. A USB\n"
        "speakerphone or Bluetooth headset carries a large hardware buffer by\n"
        "design, so measuring it tells you about that device rather than about the\n"
        "audio backend. Use --list, then --device.\n",
        argv0);
}

int main(int argc, char **argv) {
    ma_uint32 frames = 128, rate = 48000, seconds = 60;
    const char *api_name = "wasapi";
    const char *out_path = NULL;
    int device_index = -1, list_only = 0;

    for (int i = 1; i < argc; i++) {
        if (!strcmp(argv[i], "--frames") && i + 1 < argc) frames = (ma_uint32)atoi(argv[++i]);
        else if (!strcmp(argv[i], "--rate") && i + 1 < argc) rate = (ma_uint32)atoi(argv[++i]);
        else if (!strcmp(argv[i], "--seconds") && i + 1 < argc) seconds = (ma_uint32)atoi(argv[++i]);
        else if (!strcmp(argv[i], "--api") && i + 1 < argc) api_name = argv[++i];
        else if (!strcmp(argv[i], "--out") && i + 1 < argc) out_path = argv[++i];
        else if (!strcmp(argv[i], "--device") && i + 1 < argc) device_index = atoi(argv[++i]);
        else if (!strcmp(argv[i], "--list")) list_only = 1;
        else { usage(argv[0]); return 2; }
    }

    ma_backend backends[1];
    int shared = 0;
    if (!strcmp(api_name, "wasapi") || !strcmp(api_name, "wasapi_shared")) {
        backends[0] = ma_backend_wasapi;
        shared = !strcmp(api_name, "wasapi_shared");
    } else if (!strcmp(api_name, "asio")) {
        /* miniaudio ships no ASIO backend: the Steinberg SDK cannot be
           redistributed. Say so rather than failing obscurely later. */
        fprintf(stderr,
            "miniaudio has no ASIO backend (the Steinberg SDK is not redistributable).\n"
            "Measure ASIO with PortAudio built with PA_USE_ASIO plus the SDK from\n"
            "Steinberg, or inside the Mixxx build during ENG-1. Note that ASIO4ALL is\n"
            "not a substitute: it wraps the ordinary driver stack, so its numbers\n"
            "describe the wrapper rather than a real ASIO path.\n");
        return 2;
    }
    else if (!strcmp(api_name, "coreaudio"))    backends[0] = ma_backend_coreaudio;
    else if (!strcmp(api_name, "alsa"))         backends[0] = ma_backend_alsa;
    else if (!strcmp(api_name, "pulse"))        backends[0] = ma_backend_pulseaudio;
    else if (!strcmp(api_name, "jack"))         backends[0] = ma_backend_jack;
    else if (!strcmp(api_name, "null"))         backends[0] = ma_backend_null;
    else { fprintf(stderr, "unknown --api %s\n", api_name); return 2; }

    probe_state st;
    memset(&st, 0, sizeof(st));
    st.capacity = MAX_SAMPLES;
    /* Allocated once, before the stream starts. Never touched by the callback
       except to write into. */
    st.timestamps = (ma_uint64 *)calloc(st.capacity, sizeof(ma_uint64));
    st.frames     = (ma_uint32 *)calloc(st.capacity, sizeof(ma_uint32));
    st.xrun       = (unsigned char *)calloc(st.capacity, sizeof(unsigned char));
    if (!st.timestamps || !st.frames || !st.xrun) {
        fprintf(stderr, "out of memory\n");
        return 1;
    }
    st.expected_period_ns = (ma_uint32)(((double)frames / (double)rate) * 1e9);

    ma_device_config cfg = ma_device_config_init(ma_device_type_playback);
    cfg.playback.format   = ma_format_f32;
    cfg.playback.channels = 2;
    cfg.sampleRate        = rate;
    cfg.periodSizeInFrames = frames;
    cfg.periods            = 2;   /* smallest that is generally viable */
    cfg.dataCallback       = on_frames;
    cfg.pUserData          = &st;
    cfg.wasapi.noAutoConvertSRC = MA_TRUE;
    cfg.playback.shareMode = shared ? ma_share_mode_shared : ma_share_mode_exclusive;
    if (!shared) cfg.wasapi.noAutoStreamRouting = MA_TRUE;

    ma_context_config ctx_cfg = ma_context_config_init();
    ma_context ctx;
    if (ma_context_init(backends, 1, &ctx_cfg, &ctx) != MA_SUCCESS) {
        fprintf(stderr, "failed to initialise backend %s\n", api_name);
        return 1;
    }

    /* The default device is frequently not the one worth measuring. On this
       machine it is a USB speakerphone, which carries a large hardware buffer by
       design — measuring it characterises that device, not the audio backend. */
    ma_device_info *playback_infos = NULL;
    ma_uint32 playback_count = 0;
    if (ma_context_get_devices(&ctx, &playback_infos, &playback_count, NULL, NULL) == MA_SUCCESS) {
        if (list_only) {
            printf("playback devices:\n");
            for (ma_uint32 i = 0; i < playback_count; i++) {
                printf("  [%u] %s%s\n", i, playback_infos[i].name,
                       playback_infos[i].isDefault ? "  (default)" : "");
            }
            ma_context_uninit(&ctx);
            return 0;
        }
        if (device_index >= 0) {
            if ((ma_uint32)device_index >= playback_count) {
                fprintf(stderr, "device index %d out of range (%u devices)\n",
                        device_index, playback_count);
                ma_context_uninit(&ctx);
                return 2;
            }
            cfg.playback.pDeviceID = &playback_infos[device_index].id;
        }
    }

    ma_device device;
    if (ma_device_init(&ctx, &cfg, &device) != MA_SUCCESS) {
        fprintf(stderr, "failed to open a device on %s at %u frames\n", api_name, frames);
        ma_context_uninit(&ctx);
        return 1;
    }

    if (ma_device_start(&device) != MA_SUCCESS) {
        fprintf(stderr, "failed to start the device\n");
        ma_device_uninit(&device);
        ma_context_uninit(&ctx);
        return 1;
    }

    fprintf(stderr, "running %s at %u frames / %u Hz for %us...\n", api_name, frames, rate, seconds);
    ma_sleep(seconds * 1000);
    ma_device_stop(&device);

    /* All output happens here, after the stream has stopped. */
    FILE *out = out_path ? fopen(out_path, "w") : stdout;
    if (!out) { fprintf(stderr, "cannot open %s\n", out_path); return 1; }

    fprintf(out, "# backend=miniaudio\n");
    fprintf(out, "# api=%s\n", api_name);
    fprintf(out, "# sample_rate=%u\n", device.sampleRate);
    fprintf(out, "# buffer_frames=%u\n", frames);
    /* What the device ACTUALLY gave us, which is frequently not what was asked
       for. Without this the analysis computes jitter against a nominal period the
       hardware never agreed to, and every backend looks broken in the same way. */
    fprintf(out, "# actual_period_frames=%u\n", device.playback.internalPeriodSizeInFrames);
    fprintf(out, "# actual_periods=%u\n", device.playback.internalPeriods);
    fprintf(out, "# actual_sample_rate=%u\n", device.playback.internalSampleRate);
    fprintf(out, "# share_mode=%s\n",
            device.playback.shareMode == ma_share_mode_exclusive ? "exclusive" : "shared");
    fprintf(out, "# requested_seconds=%u\n", seconds);
    fprintf(out, "# device=%s\n", device.playback.name);

    ma_uint32 n = st.count;
    for (ma_uint32 i = 0; i < n; i++) {
        fprintf(out, "%u,%llu,%u,%u\n",
                i, (unsigned long long)st.timestamps[i], st.frames[i], st.xrun[i]);
    }
    if (out != stdout) fclose(out);
    fprintf(stderr, "captured %u callbacks\n", n);

    ma_device_uninit(&device);
    ma_context_uninit(&ctx);
    free(st.timestamps);
    free(st.frames);
    free(st.xrun);
    return 0;
}

# SPDX-License-Identifier: Apache-2.0
#
# SPIKE-2 audio backend probe.
#
# Dependencies are fetched at configure time rather than vendored, so no
# third-party source enters this repository and the licence boundary stays simple.
#
#   miniaudio  — public domain (MIT-0 alternative), single header
#   PortAudio  — MIT
#
# Both are permissive, so this probe sits in the Apache-2.0 plane. Nothing here
# links against Mixxx or any GPL code.

cmake_minimum_required(VERSION 3.16)
project(crowddeck_spike2 C)

set(CMAKE_C_STANDARD 11)
set(CMAKE_C_STANDARD_REQUIRED ON)

include(FetchContent)

# ---------------------------------------------------------------- miniaudio
# Single header, no build system of its own. Pinned to a tag rather than a branch
# so a rerun measures the same code.
FetchContent_Declare(
  miniaudio
  GIT_REPOSITORY https://github.com/mackron/miniaudio.git
  GIT_TAG        0.11.21
  GIT_SHALLOW    TRUE
)
FetchContent_MakeAvailable(miniaudio)

add_executable(probe_miniaudio src/probe.c)
target_include_directories(probe_miniaudio PRIVATE ${miniaudio_SOURCE_DIR})

if(WIN32)
  # Needed for QueryPerformanceCounter and the WASAPI/DirectSound backends.
  target_link_libraries(probe_miniaudio PRIVATE winmm ole32)
elseif(APPLE)
  target_link_libraries(probe_miniaudio PRIVATE
    "-framework CoreFoundation" "-framework CoreAudio" "-framework AudioToolbox")
else()
  find_package(Threads REQUIRED)
  target_link_libraries(probe_miniaudio PRIVATE Threads::Threads m dl)
endif()

# Optimised: a debug build measures the debug build, not the backend.
target_compile_definitions(probe_miniaudio PRIVATE MA_NO_DECODING MA_NO_ENCODING)
if(MSVC)
  target_compile_options(probe_miniaudio PRIVATE /O2)
else()
  target_compile_options(probe_miniaudio PRIVATE -O2)
endif()

# ---------------------------------------------------------------- PortAudio
# Optional: -DSPIKE2_WITH_PORTAUDIO=ON. Off by default because it is a much
# heavier configure step and miniaudio alone answers most of the question.
option(SPIKE2_WITH_PORTAUDIO "Also build the PortAudio probe" OFF)

if(SPIKE2_WITH_PORTAUDIO)
  FetchContent_Declare(
    portaudio
    GIT_REPOSITORY https://github.com/PortAudio/portaudio.git
    GIT_TAG        v19.7.0
    GIT_SHALLOW    TRUE
  )
  FetchContent_MakeAvailable(portaudio)

  add_executable(probe_portaudio src/probe_portaudio.c)
  target_link_libraries(probe_portaudio PRIVATE PortAudio)
  if(WIN32)
    target_link_libraries(probe_portaudio PRIVATE winmm)
  endif()
endif()

message(STATUS "")
message(STATUS "SPIKE-2 probe configured.")
message(STATUS "  Build:  cmake --build . --config Release")
message(STATUS "  Run:    probe_miniaudio --api wasapi --frames 128 --seconds 60 --out run.csv")
message(STATUS "  Analyse: node ../report.mjs run.csv")
message(STATUS "")

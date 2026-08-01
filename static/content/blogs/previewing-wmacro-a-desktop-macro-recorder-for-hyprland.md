---
title:
  text: "Previewing wmacro: A Desktop Macro Recorder for Hyprland"
  config: "2.5c 3.5ci 2 3 3.5c 3 2.5 3.5c"
description: "A quick look at wmacro, a macro recorder I'm building for Arch Linux and Hyprland, mainly to automate repetitive tasks and game grinding, right before its v0.1.0 release."
published_at: "July 29, 2026"
tags: ["linux", "arch linux", "hyprland", "automation", "wmacro", "devlog", "preview"]
author: "Abror"
reading_time: 4
draft: false
---

wmacro is almost ready for v0.1.0, so I wanted to share a bit about why I built it. When I moved my daily driver to Hyprland, I quickly found out there is not really a macro recorder that works well on Wayland. Most old X11 tools just refuse to run because of how strict the security model is. I needed something to automate repetitive stuff, mostly grinding in games and some boring desktop tasks, and since I could not find a tool that just works, I decided to build my own. That is how wmacro started. It records your keystrokes and mouse movement, then plays it back through a GUI editor where you can drag and drop to reorder steps, change playback speed from 0.1x up to 10x, and add loops, if/else, or goto/label so the macro can branch or repeat by itself. Macros can even call other macros, so you can build small pieces first then combine them into something bigger. For mouse movement, there is a synthetic path engine with adjustable wobble and jitter, so it does not look like a robot clicking the exact same pixel over and over.

For this first release, wmacro only supports Arch Linux with Hyprland, nothing else yet. Wayland automation is genuinely hard to build for other compositors since everything works a bit differently under the hood, so I chose to focus on my own setup first instead of trying to cover everything at once. Right now it already has 13 built-in themes plus support for custom ones, and I am close to finishing the last few bugs before v0.1.0 is ready. After that, I want to try supporting more Wayland compositors and look into proper packaging, so more people can use it and not just Hyprland users like me. I am also looking for testers from the Hyprland community once it gets closer to release, so if that sounds like you, keep an eye out.

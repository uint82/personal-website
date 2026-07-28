---
title:
  text: "Previewing wmacro: A Desktop Macro Recorder for Hyprland"
  config: "2.5c 3.5ci 2 3 3.5c 3 2.5 3.5c"
description: "wmacro is gearing up for its v1.0.0 release. A look into building a new desktop automation tool tailored for Arch Linux and the Hyprland compositor."
published_at: "July 29, 2026"
tags: ["linux", "arch linux", "hyprland", "automation", "wmacro", "devlog", "preview"]
author: "Abror"
reading_time: 4
draft: false
---

Welcome to the first look at wmacro. After a lot of coding, testing, and refining, the first stable version of my desktop macro recorder is almost ready to hit v1.0.0. If you find yourself bogged down by repetitive desktop tasks, this tool was built specifically to help streamline your workflow. It is not fully released just yet, but I am in the home stretch.

## The Motivation Behind wmacro

Desktop automation on Linux has always been highly useful. When I transitioned my daily driver to a modern Wayland environment, I quickly realized there was a noticeable gap in the tooling. Many of the legacy X11 macro recorders simply do not function under Wayland because of its heavily restricted security model.

I needed a straightforward way to automate some of my tasks without writing complex, custom shell scripts for every minor thing. Since I could not find a tool that fit my exact needs, I decided to build one. That is how the concept for wmacro was born.

## What It Does

At its core, wmacro is designed to be lightweight, efficient, and out of your way. The application records your exact keystrokes and mouse movements, letting you play the entire sequence back on command through a full GUI editor.

It goes beyond simple record and replay. You can reorder commands with drag and drop, adjust playback speed anywhere from 0.1x to 10.0x, and layer in flow control like loops, if/else conditions, and goto/label jumps for macros that need to branch or repeat intelligently. Macros can even call other macros, so you can compose small, reusable pieces into larger workflows. For mouse-heavy tasks, a hybrid synthetic path engine can humanize playback with adjustable wobble and endpoint jitter, so repeated actions do not look robotically identical every time.

Whether you are automating tedious software configurations, repeating data entry steps, or executing complex window management sequences, wmacro handles it quietly in the background. The goal was to make capturing and executing a macro as frictionless as possible.

## Focusing on Arch Linux and Hyprland

For this upcoming v1.0.0 release, wmacro exclusively supports Arch Linux running the Hyprland compositor.

Building automation tools for Wayland is inherently complex because it requires interacting directly with specific compositor protocols rather than a universal display server. By focusing strictly on Hyprland and Arch Linux, I was able to avoid getting overwhelmed by cross-environment compatibility issues. This narrow focus is what let me build, polish, and prepare a fully working tool without spreading the effort too thin. It was built to solve a problem on my own machine first.

## Looking Ahead to v1.0.0

Reaching version 1.0.0 is a major milestone, and I am excited to share it soon. The current feature set covers recording, playback, flow control, and 13 built-in themes, with the ability to add your own. As I finalize the last few bugs and prepare the official launch, I plan to explore adding support for other popular Wayland compositors and look into different packaging formats to make the tool accessible to a wider range of Linux users down the line.

Keep an eye out for the official release. Once it goes live, you will be able to find the source code, installation instructions, and basic usage documentation in the project repository. I will also be actively looking for testers within the Hyprland community, so stay tuned for updates.

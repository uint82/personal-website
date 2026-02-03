---
title:
  text: "My Journey to Daily Driving Linux"
  config: "3 3i 3 3c 3c"
description: "A personal journey of switching to Arch Linux with Hyprland as a daily driver, exploring modern Linux gaming, Wayland workflows, and life beyond Windows."
published_at: "February 4, 2026"
tags: ["linux", "Technology", "Arch", "Hyprland", "2026"]
author: "abror"
reading_time: 4
draft: false
---

# My Journey to Daily Driving Linux

As a self-proclaimed “power user” (even though I cringe at the term), my relationship with Linux has always been somewhat of a side affair. I’ve used Linux extensively on secondary machines, servers, and laptops—but my main rig stubbornly stayed on Windows. The reason was simple: gaming.

For a long time, Linux gaming felt like a compromise. But with the rapid evolution of **Proton**, **DXVK**, **VKD3D**, and **Wine**, that compromise has largely disappeared. Eventually, curiosity turned into confidence, and I decided it was finally time to make the leap—_for real_.

## Choosing the Right Distribution

Despite having a soft spot for Void Linux and a long-standing preference for window managers, I ultimately landed on **Arch Linux**, paired with **Hyprland**.

Why Arch?

- Rolling release with access to the latest Mesa, Vulkan, and kernel updates
- Excellent documentation via the Arch Wiki
- A massive ecosystem through the AUR
- Full control over what’s installed—and what isn’t

And Hyprland?

I wanted a modern **Wayland-first** compositor that didn’t sacrifice eye candy for performance. Hyprland struck the perfect balance: dynamic tiling, smooth animations, and sane defaults—without feeling bloated. It also aligns nicely with my preference for keyboard-driven workflows while still looking polished enough for daily use.

## The Transition

The transition was surprisingly smooth.

Most of the software I relied on in Windows was already open source or had excellent Linux alternatives. One concern I had was **RTSS (RivaTuner Statistics Server)**, which I used to globally cap my framerate at 60 FPS. Thankfully, **MangoHUD** stepped in as a near drop-in replacement, offering not just FPS limiting but also detailed performance metrics.

**Proton** performed exceptionally well, and **Gamescope** deserves a special mention. It’s incredibly useful for older or stubborn games—especially those that insist on exclusive fullscreen or behave oddly with modern resolutions. Running games through Gamescope on Wayland, then through Proton/DXVK, introduces multiple translation layers, yet performance often matched—or even exceeded—what I experienced on Windows. That was a very welcome surprise.

And yes, even games without official Linux support held up better than expected. Thanks to community tools and workarounds, many titles run smoothly despite the lack of first-party support—a testament to how far the Linux gaming ecosystem has come.

## Productivity and Workflow

Being already comfortable with Linux, adapting to Arch + Hyprland felt natural. That said, Hyprland deserves praise for how approachable it is compared to older Wayland compositors. Configuration is straightforward, documentation is solid, and the ecosystem around it is growing fast.

Arch itself does come with the usual caveat: **you’re responsible for your system**. Installing codecs, Vulkan drivers, and dealing with the occasional broken update can be intimidating for newcomers. But for someone who enjoys understanding their system end-to-end, it’s part of the appeal rather than a drawback.

Once everything was dialed in, the workflow felt incredibly efficient—minimal overhead, no unnecessary background services, and a desktop environment that gets out of the way when I want to focus.

## What’s Next?

For now, Arch Linux with Hyprland feels like _home_. It gives me the performance I want, the flexibility I crave, and a workflow that aligns perfectly with how I use my machine—both for gaming and productivity.

I’ll always keep an eye on other setups (old habits die hard), but this might be the first time I can confidently say:
**Linux is no longer my side affair—it’s my daily driver.**

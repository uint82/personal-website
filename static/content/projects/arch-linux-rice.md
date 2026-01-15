---
title:
  text: "Arch Linux Rice (in progress)"
  config: "2.5c 2.5c 3.5c"
description: "A meticulously crafted Arch Linux desktop environment with Hyprland, three cohesive themes, and dozens of configured tools. Every app changes color when you switch themes—because consistency matters."
date: "September 25, 2025"
published: true
featured: false
tags: ["linux", "hyprland", "dotfiles", "ricing", "arch", "config"]
image:
  url: "/images/projects/gruvbox.png"
  alt: "Arch Linux Rice with Catppuccin theme"
links:
  - text: "GitHub"
    url: "https://github.com/uint82/dotfiles"
    icon: "github"
---

# Overview

This is my Arch Linux rice—a fully customized desktop environment built from scratch. Three themes (Catppuccin Mocha, Latte, and Gruvbox), dozens of configured applications, and hundreds of hours of tweaking configuration files to make everything _just right_.

Why rice? Because a desktop environment should feel like home. Every color, every keybinding, every animation—tailored to the way I work.

## Motivation

I switched to Arch Linux because I wanted control. Not just over what software I run, but over every pixel on my screen. Stock desktop environments are fine, but they're designed for everyone, which means they're perfect for no one.

Ricing is the art of making your system yours. It's time-consuming, occasionally frustrating, but deeply satisfying. When you spend 8+ hours a day in a terminal, you want it to look good.

## The Setup

### Window Manager: Hyprland

I chose **Hyprland** over i3 or sway because it's a Wayland compositor with buttery-smooth animations and modern features. Tiling window managers are productive, and Hyprland makes them beautiful too.

- Dynamic tiling with gaps and borders
- Smooth workspace transitions
- Per-window animations
- Native Wayland support

### Terminal: WezTerm

**WezTerm** is my terminal of choice. It's fast, cross-platform (macOS, Windows, Linux), and Lua-configurable. I can use the same terminal on my laptop and desktop without relearning keybindings.

Features I use:

- GPU-accelerated rendering
- Ligature support for coding fonts
- Multiplexing (no need for tmux)
- True color and theme integration

### Status Bar: Waybar

**Waybar** is the information hub at the top of my screen. It displays everything I need at a glance:

- Battery percentage and status
- Volume control
- Date and time
- Microphone status
- Pacman updates (how many packages need updating)
- WiFi and Bluetooth status
- VPN indicator
- Power menu (shutdown, reboot, logout)
- Keyboard layout switcher
- Cava audio visualizer
- Workspace indicators
- Active window management

Every module is clickable and interactive. Click the volume icon to open pavucontrol. Click the updates counter to trigger a system upgrade. It's not just pretty—it's functional.

### Editor: Neovim

**Neovim** is my daily driver for coding. I've configured it extensively for web development:

- LSP integration (TypeScript, JavaScript, Python, etc.)
- Tree-sitter for syntax highlighting
- File explorer with nvim-tree
- Fuzzy finder with Telescope
- Auto-completion with nvim-cmp
- Git integration with fugitive
- Theme-aware colors

My Neovim config is over 500 lines of Lua. It's fast, powerful, and tailored to my workflow.

## Theme System

This is where it gets interesting. I have **three themes**, and when you switch themes, _everything_ changes:

## Theme System

This is where it gets interesting. I have **three themes**, and when you switch themes, _everything_ changes:

### Catppuccin Mocha

![Catppuccin Mocha theme](/images/projects/mocha.png)

### Catppuccin Latte

![Catppuccin Latte theme](/images/projects/latte.png)

### Gruvbox

![Gruvbox theme](/images/projects/gruvbox.png)

### What Changes

When I switch themes:

- Hyprland border colors
- WezTerm background and foreground
- Waybar colors and icons
- Neovim colorscheme
- GTK 2.0, 3.0, and 4.0 apps (file managers, settings, etc.)
- Wallpaper (each theme has its own wallpaper)
- Ranger file manager colors
- btop system monitor colors
- And every other application I use

Everything stays cohesive. No mismatched colors, no jarring transitions.

### How It Works

I use a shell script that:

1. Updates configuration files for each application
2. Reloads affected programs (Waybar, WezTerm, etc.)
3. Swaps the wallpaper using `swww`
4. Sends a signal to GTK apps to reload their theme

```bash
#!/bin/bash
THEME=$1

# Update configs
sed -i "s/current_theme=.*/current_theme=$THEME/" ~/.config/theme.conf

# Reload Waybar
killall waybar && waybar &

# Update WezTerm
# (Automatically picks up the new theme)

# Change wallpaper
swww img ~/.wallpapers/$THEME.png --transition-type fade

# Reload GTK theme
gsettings set org.gnome.desktop.interface gtk-theme "$THEME"
```

One command, everything updates. It's automation at its finest.

## Additional Tools

### File Management

- **Ranger** - Terminal file manager with image previews
- **Thunar** - GUI file manager for when I need drag-and-drop

### System Monitoring

- **btop** - Beautiful system monitor with graphs and colors
- **fastfetch** - Quick system info display

### Audio

- **PulseAudio** - Sound server
- **Wire** - Audio routing tool
- **mpd + rmpc** - Music player daemon with a terminal client

### Utilities

- **Flameshot** - Screenshot tool with annotations
- **Flatpak** - For running Sober (Roblox client on Linux)
- **micro** - Simple terminal text editor for quick edits

### Shell

- **Fish** - Friendly shell with autosuggestions and syntax highlighting

## Technical Challenges

### GTK Theming

Making GTK 2.0, 3.0, and 4.0 apps all respect the same theme required hunting down obscure config files and setting environment variables. GTK is not known for its consistency.

**Solution**: Created a master theme switcher script that updates GTK settings files, environment variables, and triggers reloads for running apps.

### Wayland Compatibility

Not all apps play nice with Wayland. Screen sharing, some Electron apps, and older software needed workarounds.

**Solution**: Used XWayland for compatibility and environment variables like `MOZ_ENABLE_WAYLAND=1` to force native Wayland support where possible.

### Configuration Bloat

With 20+ applications configured, my dotfiles repo was getting messy. Finding the right config when I needed to tweak something was painful.

**Solution**: Organized dotfiles with GNU Stow. Each application has its own directory, and Stow symlinks them to the right places. Clean, modular, easy to manage.

```
dotfiles/
├── hyprland/
├── waybar/
├── neovim/
├── wezterm/
└── ...
```

## What I Learned

**Linux customization is a rabbit hole.** You start with "I'll just change the terminal colors" and end up rewriting config files at 2 AM because the Waybar battery icon doesn't match the rest of your theme.

**Consistency takes effort.** Getting every application to respect the same color palette required digging through documentation, reading source code, and sometimes just trial and error.

**Dotfiles are living documents.** My setup evolves constantly. I tweak keybindings, add new tools, adjust colors. The key is to version control everything so you can roll back when you break something (which happens).

**Automation saves time.** Writing scripts to switch themes or update configs takes time upfront, but saves hours of manual work later.

## Why Share This?

Because someone else might find it useful. Dotfiles are personal, but they're also a learning resource. If you're building your own rice, feel free to steal ideas from mine. That's how the Linux community works.

## Try It

Check out the dotfiles on GitHub. Installation instructions are in the README. Fair warning: this setup assumes you're comfortable with Arch Linux and manually configuring things. It's not plug-and-play, but that's the point.

Ricing isn't about having the prettiest desktop (though that's a nice bonus). It's about understanding your tools, making them yours, and having a system that works exactly the way you want it to.

And yeah, it looks damn good too.

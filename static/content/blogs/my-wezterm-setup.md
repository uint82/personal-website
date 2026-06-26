---
title:
  text: "My WezTerm Setup"
  config: "2c 4ci 2.5"
description: "A walkthrough of how my terminal is configured, why I picked WezTerm, and a glyph warning I gave up on properly fixing."
published_at: "June 22, 2026"
tags: ["wezterm", "terminal", "hyprland", "linux", "devlog", "dotfiles"]
author: "abror"
reading_time: 5
draft: false
---

I spend most of my day in a terminal, so at some point it stopped making sense to just use whatever came installed by default. I'm on Arch with Hyprland, and WezTerm ended up being the terminal emulator I settled on after trying a couple others. This is just a rundown of how it's set up right now, mistakes included.

## Why WezTerm

I'd tried Alacritty and Kitty before this. Both are fine, genuinely, I don't have complaints about either. WezTerm just happened to fit better for me, mainly because the config is just Lua, and I already prefer config-as-code over digging through a TOML file trying to remember what option does what.

It's also got tabs and panes built in natively, so I'm not stacking a terminal multiplexer on top of it for basic splitting, which is one less moving part to keep track of.

## The Config

My `wezterm.lua` is mostly color scheme, font, and a tmux-style leader key setup since I wanted pane/tab management that didn't fight with Hyprland's own keybinds.

```lua
local wezterm = require("wezterm")
local config = {}

if wezterm.config_builder then
  config = wezterm.config_builder()
end

config.color_scheme = "Gruvbox dark, medium (base16)"
config.font = wezterm.font("JetBrainsMono NF", {
  weight = "Regular",
  italic = false,
})
config.font_size = 12

config.window_decorations = "NONE"

-- Enable ligatures
config.harfbuzz_features = { "calt=1", "clig=1", "liga=1" }

config.warn_about_missing_glyphs = false
```

`window_decorations = "NONE"` is there for the same reason as always, Hyprland already draws borders and gaps, so WezTerm doesn't need to add its own chrome on top of that.

That `warn_about_missing_glyphs = false` line is going to come back later in this post, so keep it in mind.

## Leader Key Instead of Native Tabs/Panes

I went with a tmux-style leader key instead of relying on whatever WezTerm does by default, mostly because I already think in leader-key terms from using tmux and Hyprland, so it felt dumb to relearn a different set of shortcuts just for the terminal.

```lua
config.leader = { key = "q", mods = "ALT", timeout_milliseconds = 2000 }
config.keys = {
  { mods = "LEADER", key = "c", action = wezterm.action.SpawnTab("CurrentPaneDomain") },
  { mods = "LEADER", key = "x", action = wezterm.action.CloseCurrentPane({ confirm = true }) },
  { mods = "LEADER", key = "b", action = wezterm.action.ActivateTabRelative(-1) },
  { mods = "LEADER", key = "n", action = wezterm.action.ActivateTabRelative(1) },
  { mods = "LEADER", key = "\\", action = wezterm.action.SplitHorizontal({ domain = "CurrentPaneDomain" }) },
  { mods = "LEADER", key = "-", action = wezterm.action.SplitVertical({ domain = "CurrentPaneDomain" }) },
  { mods = "LEADER", key = "h", action = wezterm.action.ActivatePaneDirection("Left") },
  { mods = "LEADER", key = "j", action = wezterm.action.ActivatePaneDirection("Down") },
  { mods = "LEADER", key = "k", action = wezterm.action.ActivatePaneDirection("Up") },
  { mods = "LEADER", key = "l", action = wezterm.action.ActivatePaneDirection("Right") },
}
```

ALT+q as leader, then h/j/k/l for pane navigation, same direction logic as vim so I don't have to think about it. Pane resizing is mapped to LEADER + arrow keys, 5 units at a time, which is enough granularity that I'm not stuck nudging things forever to get a split where I want it.

I also looped a 0-9 tab switcher instead of writing out ten separate keybind entries by hand:

```lua
for i = 0, 9 do
  table.insert(config.keys, {
    key = tostring(i),
    mods = "LEADER",
    action = wezterm.action.ActivateTab(i),
  })
end
```

LEADER + number jumps straight to that tab, zero-indexed to match `tab_and_split_indices_are_zero_based = true` further down, which I had to set explicitly because by default WezTerm numbers tabs starting from 1 and that was driving me slightly insane every time the number on screen didn't match the number I pressed.

## The Glyph Warning I Never Actually Fixed

Okay, full honesty time. Earlier I mentioned that `warn_about_missing_glyphs = false` line, and the real story behind it is less impressive than "I debugged my way to a clean fix."

After switching to `JetBrainsMono NF`, WezTerm kept throwing a missing glyph warning on startup. Everything on screen looked fine, icons rendered, nothing visually broken, but the warning showed up in the logs every single launch and it bugged me enough to go look into it.

I tried reinstalling the font first, assuming I'd grabbed a non-patched version by mistake.

```bash
sudo pacman -S ttf-jetbrains-mono-nerd
fc-cache -fv
```

Same warning, completely unchanged. I spent a while digging through the log output trying to figure out exactly which glyph it was complaining about, and honestly couldn't pin it down to anything that actually mattered. Whatever character it wanted just didn't seem to come up in anything I was actually using day to day.

So I did the thing that's apparently a pretty common answer in the WezTerm community when this happens: I just turned the warning off.

```lua
config.warn_about_missing_glyphs = false
```

That's it. That's the fix. Not glamorous, but it's been silent ever since and I haven't run into an actual missing icon anywhere in months, so functionally it never mattered in the first place. Sometimes the lesson isn't some deep insight, it's just "this warning wasn't worth my time and turning it off was the correct call."

## The Status Line Thing

One bit I'm actually a little proud of is the leader indicator in the status bar. By default there's no real visual cue that the leader key is active, you just have to remember you pressed it and hope the next key lands right. So I wired up an `update-right-status` callback that shows a wave emoji when leader mode is active:

```lua
wezterm.on("update-right-status", function(window, _)
  local SOLID_LEFT_ARROW = ""
  local ARROW_FOREGROUND = { Foreground = { Color = "#c6a0f6" } }
  local prefix = ""

  if window:leader_is_active() then
    prefix = " " .. utf8.char(0x1f30a) -- ocean wave
    SOLID_LEFT_ARROW = utf8.char(0xe0b2)
  end

  if window:active_tab():tab_id() ~= 0 then
    ARROW_FOREGROUND = { Foreground = { Color = "#1e2030" } }
  end

  window:set_left_status(wezterm.format({
    { Background = { Color = "#b7bdf8" } },
    { Text = prefix },
    ARROW_FOREGROUND,
    { Text = SOLID_LEFT_ARROW },
  }))
end)
```

It's a small thing but it actually matters in practice, before I added this I kept second-guessing whether leader mode was on or whether the timeout had already expired, and just glancing at the corner of the screen fixed that completely. The arrow color check is purely cosmetic, just makes the powerline arrow blend into the background instead of standing out weird when you're on the very first tab.

## Where It's At Now

It's not a particularly exciting setup if I'm honest, no fancy ASCII art on launch, nothing beyond Gruvbox and a status bar indicator. It's fast, the leader key setup means I never have to think about which shortcut does what, and the glyph warning is just quietly off in the background, possibly forever, possibly until it turns out to actually matter someday. We'll see.

Keybinds file's getting a little long at this point too, might split it into its own module eventually. Future me's problem.

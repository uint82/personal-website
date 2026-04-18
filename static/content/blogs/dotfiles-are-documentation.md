---
title:
  text: "Dotfiles Are Documentation"
  config: "4.5c 2 3.5c"
description: "Your dotfiles aren't just config. They're a record of every decision you've made about how you work."
published_at: "April 18, 2026"
tags: ["linux", "personal", "opinion", "devlog"]
author: "abror"
reading_time: 3
draft: false
---

I've been on Arch + Hyprland for a while now. And the thing I keep coming back to isn't the performance, or the Wayland setup, or even how clean the tiling is.

It's the dotfiles.

## Your config is a changelog

Every line in your config is a decision. A keybind you added because you kept reaching for it. A plugin you removed because it was doing something you didn't understand. An alias you wrote at 11pm because you were tired of typing the same thing.

Over time, dotfiles stop being configuration and start being *autobiography*.

Open someone's `.zshrc` and you'll learn more about how they think than any portfolio site. You'll see what they optimized for, what they couldn't be bothered to fix, and what they cared enough about to spend an afternoon perfecting.

## Comments are rare, but they matter

Most dotfiles are uncommented. I get it - you wrote it, you know what it does. But six months later, you don't.

I started commenting the non-obvious stuff. Not `# sets background color` but `# had to set this because Hyprland ignores GTK theme on Wayland without it`. That context is the part you'll actually forget.

Comments in dotfiles are notes to your future self. Write them like it.

## Version control changes the game

Once your dotfiles are in git, something clicks. You stop being afraid to experiment. Broke something? `git stash`. Curious what your config looked like a year ago? `git log`.

It also forces you to think in units. What's one logical change? What belongs together? That discipline makes your config cleaner even if you never look at the history.

I use a bare repo setup - no symlinks, no stow, just:

```bash
alias dotfiles='git --git-dir=$HOME/.dotfiles/ --work-tree=$HOME'
```

Simple. No tooling. Tracks exactly what I want and ignores everything else.

## The ritual of a new machine

The real test of your dotfiles is setting up a new machine. If you can clone your repo, run one script, and be productive in under an hour - you've done it right.

If you spend three hours remembering what you had installed and why - you've got work to do.

That setup script is also documentation. It tells you exactly what your system depends on, in order.

## Don't overthink the structure

There's a whole ecosystem of dotfile managers. I've tried a few. Most add more complexity than they solve.

A flat repo with a setup script and a good README is enough. The goal isn't a perfect dotfile architecture. It's a config you understand and can rebuild.

Keep it boring. Keep it yours.

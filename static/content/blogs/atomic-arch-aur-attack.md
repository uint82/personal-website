---
title:
  text: "About That AUR Supply Chain Attack"
  config: "1.8 2.2c 1.8 1.8 2.2ci 1.8c"
description: "Some notes on the Atomic Arch AUR incident, how to actually catch something like this before pacman ever runs, and why I'm not switching distros over it."
published_at: "June 29, 2026"
tags: ["arch", "aur", "security", "linux", "supply-chain", "devlog"]
author: "abror"
reading_time: 6
draft: false
---

So earlier this month there was a pretty big AUR supply chain attack, the one security people are calling "Atomic Arch." I've been running Arch as my daily driver for a while now and I use the AUR constantly, so this one actually made me stop and pay attention instead of scrolling past another infosec headline.

I'm not going to pretend I'm a security researcher, I'm just a student who actually reads every PKGBUILD before building, always have. But I wanted to write down what actually happened, why my existing habits held up fine through this, and why I'm personally still okay using Arch despite all this.

## What Actually Happened

The short version: attackers went after orphaned AUR packages, meaning packages whose original maintainer had stepped away and left them up for adoption. AUR has a system where anyone can request ownership of an abandoned package to keep it alive, which is genuinely useful most of the time, somebody has to keep things working. The attackers just abused that exact mechanism.

Once they had control of a package, they didn't touch the actual software. They edited the PKGBUILD or install hooks to quietly pull in a malicious npm package, something called `atomic-lockfile`, and later a variant called `js-digest` pulled via Bun instead. That npm package had a preinstall hook that ran a Rust-based credential stealer, and on systems where it landed with root it could also drop in an eBPF rootkit to help hide itself.

Numbers floating around vary depending on which point in the timeline you're reading about, early reports said something like 400+ packages, and later community-consolidated lists put it closer to 1,500 to almost 2,000 affected package names. Arch ended up suspending new AUR account registrations for a bit just to do cleanup.

The part that actually got my attention isn't the malware itself, it's the method. Nobody had to convince anyone to install something sketchy or new. The package names, history, and existing trust all stayed exactly the same. Only the build instructions underneath changed.

## Why This Worked

This is the bit that's worth sitting with for a second. The AUR's whole trust model is basically: a package that's been around a while, has a maintainer, and other people use it, is probably fine. That's not an unreasonable heuristic most of the time. But it means trust gets attached to a package's name and history, not to whoever currently holds the keys to it.

Once a package gets adopted by someone new, there's no real signal to the average user that anything changed. You update like normal, pacman/yay/paru does its thing, and unless you're specifically reading the PKGBUILD diff on every update, which let's be honest nobody is doing for every single package every single time, you'd never notice.

## How To Actually Catch Something Like This

I went and looked into what people are actually recommending after this, here's what stuck with me as genuinely doable, not just "audit everything" advice that nobody follows in practice:

**Read the PKGBUILD before you build, every single time, not just on first install.** This is something I already do, I use `paru` and I always read through the PKGBUILD diff before confirming a build, even on updates to stuff I've had installed for ages. It takes maybe a minute longer per update and it's exactly the habit that would've caught this attack, since the actual malicious code change shows up right there in the diff before anything gets built. If you're someone who only reads PKGBUILDs on first install and then blindly trusts every update after that, this incident is a pretty good reason to stop doing that.

**Watch for orphaned packages getting adopted, this is something I actively pay attention to.** If a package I use shows up as recently orphaned and then picked up by a new maintainer with no real history, that gets extra scrutiny from me before I touch the next update, not because adoption itself is bad, but because that's literally the exact mechanism this attack used to get a foothold.

**Watch for new install hooks or build steps that weren't there before.** If a package that never needed network access during build suddenly has a `.install` or `.hook` file running `npm install` or `bun install` for something unrelated to the actual software, that's a real red flag, not just paranoia.

**Cross-check against published IOC lists if you're not sure.** After incidents like this, security researchers and community members usually put together lists of affected package names pretty fast. Worth a quick comparison against your installed packages if you updated anything from the AUR during the attack window.

None of this is foolproof and I'm not claiming it is. But it's a meaningfully bigger filter than just trusting that "it's been on AUR for years so it's fine," which turned out to be exactly the assumption this attack was built to exploit.

## Why I'm Not Switching Off Arch Over This

I've seen people in threads about this acting like it's proof Arch or the AUR is fundamentally broken or unsafe to use. I get the instinct, but I don't think that take really holds up once you look at which packages were actually hit.

The packages targeted were specifically the orphaned ones, abandoned, no active maintainer, sitting there waiting for someone to pick them up. That's not really a flaw unique to Arch, that's a structural risk in basically any system where ownership of something can transfer hands, GitHub orgs, npm packages, browser extensions, all of it. The AUR has always had a disclaimer on the wiki that packages aren't vetted the same way official repos are, that's the whole deal you're opting into by using it. The official Arch repositories, the actual vetted core of the distro, were not part of this at all.

So this wasn't really "Arch got hacked." It was "a community trust mechanism got abused on packages nobody was actively maintaining anymore," which is a different and honestly more containable problem. If you were running well-maintained, actively used AUR packages and reading your updates instead of blindly trusting everything, you were probably fine the whole time.

## What This Confirmed For Me

Practically, this didn't really change anything for me, reading PKGBUILDs and watching for orphan adoptions was already part of how I use `paru` before this attack even happened. If anything, Atomic Arch just confirmed that habit wasn't paranoia, it was the exact thing standing between "update like normal" and "update and now you're running a credential stealer."

Arch being a DIY, you-configure-everything distro was always going to come with this kind of tradeoff somewhere. I'd still rather have that control and actually look at what I'm building than go back to something that hides all of this from me and hope nothing ever goes wrong on their end either.

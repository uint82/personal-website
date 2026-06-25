---
title:
  text: "My First Blog Post"
  config: "2c 3.5c 2.5 2.5"
description: "My 'irst' blog post; or at least, my first blog post here on my website."
published_at: "December 28, 2025"
tags: ["devlog", "personal", "2025"]
author: "abror"
reading_time: 5
draft: false
---

# Introduction

Okay so this is my first actual blog post. I've had this site sitting half-finished for way longer than I'd like to admit, and I kept telling myself I'd write "once it's ready," which is obviously a trap because it's never going to feel ready.

Honestly the main reason I wanted my own thing instead of just posting on Medium or whatever is that I'm kind of tired of writing into a platform I don't control. Like, I build a router from scratch, write some CSS by hand, and then post it somewhere that could change its algorithm tomorrow and bury everything? No thanks. This way at least if nobody reads it, it's because nobody reads it, not because some recommendation engine decided not to show it to anyone.

So yeah. This is going to be where I dump whatever I'm working on, mostly side projects, plus probably some complaining about bugs I caused myself.

## What I've Learned

I've spent a good chunk of the last few months messing around with frontend stuff outside of my coursework, and a few things actually stuck with me enough to write down.

TypeScript was annoying to learn and I avoided it for way too long. I had the classic "it's just JavaScript with extra steps" mindset. Then I had a project with like 15 files referencing the same data shape and I kept typo-ing property names, and autocomplete actually catching that before runtime made me feel kind of dumb for resisting it. Anyway I'm a convert now, mostly.

Thinking in components is something I picked up from React but it turns out it applies even when you're not using React at all. I was writing some vanilla JS for a small project and caught myself splitting things into little reusable chunks anyway, just out of habit at this point. Apparently that's just how you end up organizing UI once you've seen it done properly once.

Building my own SPA router was probably the most "aha" thing I did this semester. Everyone just reaches for a library and I get why, but actually wiring up the History API myself and dealing with all the edge cases (back button doing weird things, scroll position, etc) made a lot of stuff that used to feel like framework magic just... not magic anymore. It's still kind of held together with tape though, I won't pretend otherwise.

## Getting Started

If anyone reading this is also just starting out, here's what's worked for me, take it with a grain of salt because I'm a sixth semester student, not some senior engineer:

Build something you'll actually use yourself. I tried doing a todo app and a portfolio site first like everyone says to and I lost interest in both within a week because I didn't actually need either of those things. This blog/site thing stuck because I genuinely wanted a place to put my stuff.

Read actual docs instead of the fifth "10 JavaScript Tips You Didn't Know" article. MDN and the TypeScript handbook are both better written than people give them credit for. It took me an embarrassingly long time to figure that out.

Don't wait until it's perfect to ship it. This site definitely has bugs I haven't found yet, the CSS has some parts I'm not proud of, and there's at least one console warning I've been ignoring for a week. But it's up, and that matters more than it being flawless.

## Conclusion

That's it for post one. I'm planning to write more about the router I mentioned, some weird typography stuff I've been experimenting with, and maybe how I'm handling markdown parsing for this blog since that took longer than it should have.

No real posting schedule, I'll just write when I have something worth saying. If you actually made it this far, thanks for reading. Code's on my GitHub if you want to poke around, and if you spot a bug, that's literally what issues are for, go ahead.

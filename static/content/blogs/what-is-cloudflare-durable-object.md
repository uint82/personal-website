---
title:
  text: "What Is Cloudflare Durable Object"
  config: "2 1.8 2.5c 3.5c 4c"
description: "Cloudflare Durable Objects give you stateful, consistent storage at the edge. Here's what that actually means and when to use one."
published_at: "April 16, 2026"
tags: ["technology", "cloudflare", "tools", "tutorial"]
author: "abror"
reading_time: 3
draft: false
---

Cloudflare Workers are stateless. Stateless is simple, stateless scales. But sometimes you need a single source of truth. You need *one* thing, running in one place, that multiple clients can talk to simultaneously without stepping on each other.

That's what Durable Objects are.

## The core idea

A Durable Object is a tiny, single-threaded JavaScript class that lives on Cloudflare's edge. What makes it special: every named instance is **unique and consistent**. No matter where in the world a request comes from, `OBJECT.get("my-room")` always routes to the exact same object, in the exact same location.

That means you can hold state in memory, or in a built-in persistent key-value store without worrying about race conditions from concurrent writes hitting different replicas.

## A minimal example

```typescript
export class Counter {
  private count: number = 0;
  private state: DurableObjectState;

  constructor(state: DurableObjectState) {
    this.state = state;
  }

  async fetch(request: Request) {
    this.count = (await this.state.storage.get("count")) ?? 0;
    this.count++;
    await this.state.storage.put("count", this.count);
    return new Response(String(this.count));
  }
}
```

Then from a Worker, you get a handle to this specific object by name:

```typescript
const id = env.COUNTER.idFromName("global-counter");
const stub = env.COUNTER.get(id);
const response = await stub.fetch(request);
```

That's it. No database. No Redis. No coordination logic. The Durable Object *is* the coordination.

## When does this actually matter?

The canonical use case is **real-time collaboration**, chat rooms, multiplayer games, live cursors. Anything where multiple users share a piece of state and need to see each other's changes immediately.

But it's also useful for simpler things: rate limiters, session stores, job queues, or like I did in ON-SITE a lightweight write layer that doesn't need a full database.

## The trade-off

Durable Objects aren't free. Each object has an activation cost, and if you're spinning up thousands of unique instances, you'll feel it. They're also not a replacement for a proper database because there's no querying, no relations, no indexing.

Think of them as a coordination primitive, not a storage solution. Use them when you need *one thing to be in charge*, and keep your actual data somewhere else.

---

Simple, powerful, and very Cloudflare. Once you understand what problem they solve, you start seeing uses for them everywhere.

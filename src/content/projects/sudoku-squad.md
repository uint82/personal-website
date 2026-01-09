---
title:
  text: "Sudoku Squad"
  config: "3c 3.5c"
description: "Real-time multiplayer Sudoku game where up to 10 players can collaborate on the same puzzle. Built with Django and React, featuring live cursors, quick emotes, and clever username-based persistence."
date: "Marh 5, 2025"
published: true
featured: true
tags: ["django", "djangorestfreamwork", "python", "react", "wbsockets", "redis", "realtime"]
image:
  url: "/images/projects/sudoku_squad.jpg"
  alt: "Sudoku Squad multiplayer interface"
links:
  - text: "Live Demo"
    url: "https://sudokusquad.netlify.app"
    icon: "external"
  - text: "GitHub"
    url: "https://github.com/uint82/OnlineSudoku"
    icon: "github"
---

# Overview

Sudoku Squad is a real-time multiplayer Sudoku game where up to 10 players can work together on the same puzzle. See your teammates' cursors in real-time, communicate with quick emotes, and collaborate to solve the board faster than you could alone.

I built this to explore real-time web technologies—specifically WebSockets and how to sync state across multiple clients without a complex authentication system.

## Motivation

Sudoku is typically a solo game. But what if it wasn't?

I wanted to see if collaborative Sudoku could be fun. The challenge: how do you make it feel _collaborative_ rather than just chaotic? The solution: real-time cursors showing each player's name, hints that everyone can see, and quick emotes for communication without chat spam.

This project also gave me an excuse to dive into Django Channels for WebSocket support and figure out how to build stateful multiplayer games without requiring user accounts.

## How It Works

### Room Creation

1. Create a room and choose difficulty: Easy, Medium, or Hard
2. Share the room link with friends (or play with strangers)
3. Enter a username (no signup required)
4. Start playing

Up to 10 players can join a single room. Each player gets their own cursor color, and everyone sees each other's moves in real-time.

### Gameplay Features

**Real-Time Cursors** - See where other players are hovering on the board. Their username floats above their cursor so you can coordinate which cells to work on.

**Quick Emotes** - Send reactions without cluttering the board with chat. 👍, 🤔, 🎉, and more. Perfect for celebrating solved cells or signaling confusion.

**Hint System** - Each player gets **one hint** per game. Use it wisely. When someone uses a hint, it reveals the correct number for that cell—and everyone sees it.

**Auto-Cleanup** - Rooms are automatically deleted after 12 hours of inactivity. No need to manually clean up abandoned games.

## Technical Stack

### Backend

- **Django** - Web framework for API and room management
- **Django REST Framework** - RESTful API for room creation and game state
- **Django Channels** - WebSocket support for real-time gameplay
- **Redis** - Channel layer backend for WebSocket message passing

### Frontend

- **React** - Component-based UI for the game board and interface
- **WebSocket API** - Real-time connection to Django Channels
- **CSS** - Custom styling for the Sudoku grid and player cursors

### Deployment

- **Netlify** - Frontend hosting
- **Railway/Render** - Backend API and WebSocket server

## Technical Challenges

### Authentication Without Authentication

I didn't want to force users to create accounts. But I also wanted returning players to keep their progress if they rejoined a room.

**Solution**: When you enter a username, the backend generates a unique player ID and sends it to the client. This ID is stored in `localStorage` along with your username.

```javascript
// On first join
localStorage.setItem("playerId", response.playerId);
localStorage.setItem("username", username);

// On rejoin
const existingId = localStorage.getItem("playerId");
const existingUsername = localStorage.getItem("username");

if (existingUsername === username && existingId) {
  // Reconnect as the same player
  socket.send({ type: "rejoin", playerId: existingId });
}
```

If you rejoin with the **same username**, you get your score and progress back. Different username? You're a new player. Simple, stateless (from the server's perspective), and works without a database of users.

### Real-Time Cursor Sync

Sending cursor positions on every mouse movement would flood the WebSocket connection. I needed to throttle updates without making the cursors feel laggy.

**Solution**: Throttle cursor position updates to **~30 updates per second**. The human eye can't perceive latency below ~33ms, so this feels instant while keeping bandwidth manageable.

```javascript
const throttledCursorUpdate = throttle((x, y) => {
  socket.send({ type: "cursor_move", x, y });
}, 33); // ~30 FPS

onMouseMove = (e) => {
  throttledCursorUpdate(e.clientX, e.clientY);
};
```

### State Synchronization

When a player makes a move, all other players need to see it immediately. But what if two players try to update the same cell at the same time?

**Solution**: The server is the source of truth. Each move is validated server-side before being broadcast to all clients. If two players update the same cell simultaneously, the first one to reach the server wins. The second player gets their move rejected and sees the board update to reflect the winning move.

This prevents race conditions and ensures the game state stays consistent across all clients.

### Room Management

Abandoned rooms waste server resources. But I can't just delete rooms immediately when everyone leaves—players might disconnect briefly and want to rejoin.

**Solution**: Track the **last activity timestamp** for each room. A background task runs every hour and deletes rooms where the last move was more than 12 hours ago. This gives players time to rejoin after a disconnect while eventually cleaning up inactive games.

```python
from celery import shared_task
from datetime import timedelta
from django.utils import timezone

@shared_task
def cleanup_inactive_rooms():
    cutoff = timezone.now() - timedelta(hours=12)
    Room.objects.filter(last_activity__lt=cutoff).delete()
```

## What I Learned

**WebSockets are powerful but tricky**. Managing connection state, handling reconnects, and syncing game state across multiple clients is harder than it looks. Django Channels made it manageable, but there's still a lot of complexity.

**Throttling is essential**. Real-time doesn't mean sending _everything_ in real-time. Cursor positions, for example, can be throttled without users noticing. Bandwidth is finite—use it wisely.

**Stateless authentication can work**. Not every app needs JWT or OAuth. For a casual multiplayer game, localStorage + server-generated IDs is enough. Keep it simple if you can.

**Real-time games are fun to build**. Seeing multiple cursors moving across the board, watching the puzzle fill in collaboratively—it's satisfying in a way that single-player apps aren't.

## Future Improvements

- **Custom Puzzles** - Let users upload their own Sudoku puzzles
- **Leaderboards** - Track fastest solve times per difficulty
- **Private Rooms** - Add password protection for private games
- **Better Emotes** - Custom emote packs or even a simple text chat
- **Mobile Support** - Optimize the UI for touch controls

## Try It

Visit [sudokusquad.netlify.app](https://sudokusquad.netlify.app) and create a room. Invite some friends (or play with strangers) and see how fast you can solve a Sudoku puzzle together.

Building multiplayer games is a different challenge than building typical web apps. The real-time aspect, state synchronization, and handling race conditions—all new problems that don't come up in CRUD apps. This project taught me how to think about distributed state and gave me a solid foundation in WebSockets.

Plus, it's just fun to watch cursors dance across the board while you solve puzzles with people halfway around the world.

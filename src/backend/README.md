# Backend

Server-driven UI backend. WebSocket-style mock backend, window manager, content streaming channel for real-time UI updates.

## Features

- MockBackend — simulates server push events via WebSocket interface
- WindowManager — create/destroy/layer windows by command
- ContentChannel — typed streaming channel for partial UI updates

## Architecture

Event-driven, typed command system. Backend emits commands consumed by window components.

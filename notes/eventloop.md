## 🧠 Node.js Event Loop - Explanation

The Node.js event loop is what makes Node.js non-blocking and asynchronous. It handles all async operations like file I/O, network requests, and timers.

### How It Works:

1. **JavaScript code runs** - executes synchronously
2. **Async operations are delegated** - to the system kernel
3. **Callbacks are queued** - when operations complete
4. **Event loop checks the queue** - when the call stack is empty

### Phases of Event Loop:

| Phase | What it does |
|-------|--------------|
| **Timers** | Executes setTimeout/setInterval callbacks |
| **Pending Callbacks** | Executes I/O callbacks |
| **Idle/Prepare** | Internal use |
| **Poll** | Retrieves new I/O events |
| **Check** | Executes setImmediate callbacks |
| **Close Callbacks** | Closes connections |

### Why it matters:
- JavaScript is single-threaded
- Event loop handles concurrency without multi-threading
- Non-blocking I/O makes Node.js fast and efficient
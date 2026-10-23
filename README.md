# Life Dashboard 🚀

A beautiful, minimalist To-Do Life Dashboard built with pure HTML5, CSS3, and vanilla JavaScript.  
No frameworks. No backend. Everything persists in the browser via **Local Storage**.

---

## 📁 File Structure

```
CodingCamp-22Oktober26-Nurulhanisah/
├── index.html          ← Main HTML file
├── css/
│   └── style.css       ← All styles (responsive, light/dark)
├── js/
│   └── script.js       ← All JavaScript (no dependencies)
└── README.md
```

---

## 🚀 How to Run Locally

### Option A — Open directly (simplest)
1. Navigate to the project folder.
2. Double-click **`index.html`** to open it in your default browser.

### Option B — Live Server (recommended for development)
If you have VS Code with the **Live Server** extension:
1. Open the folder in VS Code.
2. Right-click `index.html` → **Open with Live Server**.

### Option C — VS Code + Kiro IDE
Open `index.html` in the Kiro IDE preview panel.

---

## ✅ Features & How to Test Each One

### 1. Greeting with Live Clock
- The header shows a **live digital clock** (updates every second).
- The **greeting phrase** (Good morning / afternoon / evening / night) updates automatically based on the current hour.
- The **current date** (e.g., "Thursday, October 22, 2026") is displayed below the greeting.

### 2. Focus Timer — 25-minute Pomodoro
| Button | Behaviour |
|--------|-----------|
| **Start** | Starts the countdown from 25:00 (or wherever it left off) |
| **Stop**  | Pauses the timer at its current value |
| **Reset** | Stops and resets to 25:00 |

- Timer turns **green** while running.
- Timer pulses **amber** when fewer than 5 minutes remain.
- A toast notification appears when the session completes.
- The browser tab title shows the countdown while running.

### 3. To-Do List
| Action | How to use |
|--------|-----------|
| **Add** | Type in the input field → click "Add Task" or press Enter |
| **Complete** | Click the checkbox on any task |
| **Edit** | Hover over a task → click ✏️ → modify text → Save |
| **Delete** | Hover over a task → click 🗑️ |
| **Filter** | Use All / Active / Completed buttons |
| **Clear completed** | Click "Clear Completed" in the footer |

All tasks are saved to **Local Storage** and survive page reloads.

### 4. Quick Links
1. Enter a **Label** (e.g., "GitHub") and a **URL** (e.g., `https://github.com`).
2. Click **Add** — the link appears below with its favicon.
3. Click the link label to open the site in a new tab.
4. Click **✕** to remove a link.

Links are saved to **Local Storage**.

---

## 🏆 Challenges Implemented

### Challenge 1 — Light / Dark Mode
- Click the **🌙 / ☀️ button** in the top-right corner to toggle themes.
- Your preference is saved to Local Storage and restored on the next visit.

### Challenge 2 — Custom Name in Greeting
1. Scroll to the **⚙️ Settings** card at the bottom.
2. Type your name and click **Save Name**.
3. The header greeting updates to "Hello, [Name]! 👋".
4. Your name is saved to Local Storage.

### Challenge 3 — Prevent Duplicate Tasks
- If you try to add a task that already exists (case-insensitive, whitespace-normalised), an inline error message appears and a toast notification is shown.
- Works for **Add** and **Edit** — you cannot rename a task to match an existing one.

---

## 🔧 Browser Support

Works in all modern browsers: Chrome, Edge, Firefox, Safari.  
No build step, no npm, no dependencies.

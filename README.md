
# MindSketch

**MindSketch** is a real-time collaborative whiteboard built for brainstorming, planning, and visual thinking.  
It combines an infinite canvas, smart drawing tools, and AI-powered insights to help teams and individuals turn ideas into structured outcomes — together, in real time.

---

## ✨ Features

### 🧑‍🤝‍🧑 Collaboration & Organizations
- Create and manage **Organizations**
- Invite members and collaborate securely
- Access control for boards and workspaces

### 🧩 Templates
- Pre-built templates to get started quickly
- Ideal for brainstorming, planning, and ideation workflows

### 🖌️ Real-Time Infinite Canvas
- Infinite, zoomable canvas
- Live cursors and updates across all collaborators
- Smooth performance even with large boards

### ✏️ Smart Drawing Tools
- Pencil, shapes, text, sticky notes, and more
- Shape recognition and clean rendering
- Optimized for both mouse and trackpad interactions

### 🕒 History & Restoration
- Board history tracking
- Restore previous states effortlessly
- Built for experimentation without fear of losing progress

### 📤 Exporting
- Export selected frames or entire boards
- Useful for sharing, presentations, and documentation

### 🤖 AI-Powered Features
- **Canvas Summary**: Automatically generate summaries of your board
- Designed to turn messy brainstorming into structured insights

---

## 🛠 Tech Stack

- **Framework**: Next.js (App Router)
- **Backend / Realtime**: Convex
- **Authentication**: Clerk
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **State & Utilities**: Modern React patterns
- **Deployment Ready**: Optimized for Vercel

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or later recommended)
- npm or pnpm
- Convex account
- Clerk account

---

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/mindsketch.git
   cd mindsketch
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start Convex**
   ```bash
   npx convex dev
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. Open your browser and visit:
   ```
   http://localhost:3000
   ```

---

## 🔐 Environment Variables

Create a `.env.local` file and configure the following:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

CONVEX_DEPLOYMENT=
NEXT_PUBLIC_CONVEX_URL=
```

---

## 📌 Project Status

MindSketch is actively evolving with a focus on performance, collaboration, and intelligent tooling.

---

## 🤝 Contributing

Contributions are welcome.  
Fork the repository, create a feature branch, and submit a pull request.

---

## 📄 License

MIT License

---

## 👤 Author

Built by **Kartik**

> MindSketch is designed to feel fast, collaborative, and intuitive — a digital space where ideas move forward.

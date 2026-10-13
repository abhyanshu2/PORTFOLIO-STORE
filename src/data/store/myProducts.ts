export type MyProduct = {
  id: string;
  name: string;
  monogram: string;
  description: string;
  features: string[];
  stack: string[];
  status: "live" | "coming-soon";
  liveUrl?: string;
  learnMoreUrl?: string;
};

export const MY_PRODUCTS: MyProduct[] = [
  {
    id: "notiq",
    name: "NOTIQ",
    monogram: "NQ",
    description: "Sticky notes reimagined — persistent, keyboard-friendly, and fast.",
    features: ["Local persistence", "Keyboard shortcuts", "Dark mode", "Export"],
    stack: ["React", "TypeScript", "Tailwind"],
    status: "live",
    liveUrl: "https://github.com/abhyanshu2",
  },
  {
    id: "habit-tracker",
    name: "Habit Tracker",
    monogram: "HT",
    description: "Track daily habits with streaks, heat-maps and weekly insights.",
    features: ["Streaks", "Heatmap", "Weekly review", "Reminders"],
    stack: ["React", "Node.js", "MongoDB"],
    status: "live",
    liveUrl: "https://github.com/abhyanshu2",
  },
  { id: "expense-tracker", name: "Expense Tracker", monogram: "ET", description: "Personal finance tracker with categories and monthly reports.", features: ["Categories", "Charts", "Budgets", "CSV export"], stack: ["Next.js", "MongoDB"], status: "coming-soon" },
  { id: "ai-assistant", name: "AI Assistant", monogram: "AI", description: "Personal AI helper for daily tasks, writing and code.", features: ["Chat", "Voice", "Memory", "Plugins"], stack: ["Next.js", "OpenAI"], status: "coming-soon" },
  { id: "url-shortener", name: "URL Shortener", monogram: "US", description: "Custom short links with analytics and QR codes.", features: ["Analytics", "QR", "Custom slug", "API"], stack: ["Node.js", "MongoDB"], status: "coming-soon" },
  { id: "chat-app", name: "Chat App", monogram: "CA", description: "Real-time chat with rooms, DMs and file sharing.", features: ["Real-time", "Rooms", "File share", "Presence"], stack: ["Socket.io", "React"], status: "coming-soon" },
  { id: "resume-builder", name: "Resume Builder", monogram: "RB", description: "Build ATS-friendly resumes with live preview and PDF export.", features: ["Templates", "PDF export", "ATS friendly", "Cover letter"], stack: ["React", "TS"], status: "coming-soon" },
  { id: "portfolio-builder", name: "Portfolio Builder", monogram: "PB", description: "Drag-and-drop portfolio builder with hosting.", features: ["Drag & drop", "Hosting", "Themes", "SEO"], stack: ["Next.js"], status: "coming-soon" },
];

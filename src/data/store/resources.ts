export type Resource = { id: string; name: string; description: string; url: string; type: string };
export const RESOURCES: Resource[] = [
  { id: "html-notes", name: "HTML Notes", description: "Complete HTML5 notes with examples and cheat sheets.", url: "https://github.com/abhyanshu2", type: "PDF" },
  { id: "css-notes", name: "CSS Notes", description: "CSS3 essentials, flexbox, grid, animations, responsive.", url: "https://github.com/abhyanshu2", type: "PDF" },
  { id: "js-notes", name: "JavaScript Notes", description: "ES6+ core, DOM, async, closures, and patterns.", url: "https://github.com/abhyanshu2", type: "PDF" },
  { id: "react-notes", name: "React Notes", description: "Hooks, patterns, state, routing, and best practices.", url: "https://github.com/abhyanshu2", type: "PDF" },
];

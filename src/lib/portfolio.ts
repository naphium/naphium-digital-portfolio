import { useEffect, useState } from "react";

export const DEFAULT_DATA = {
  admin: { passcode: "naphium" },
  profile: {
    name: "Md. Nafim Muttaki",
    nickname: "n a f i m",
    username: "naphium",
    location: "Rajshahi, Bangladesh",
    coords: "24°22'26\"N 88°36'04\"E",
    tagline: "Student · Web engineer · Firmware tinkerer",
    bio: "HSC Science student from Rajshahi building fast web tools, tiny firmware and clean visual identities. I like software that loads instantly and gets out of the way.",
    avatarInitials: "NM",
    statusLabel: "naphium ⚡ DEV",
  },
  presence: [
    { mode: "Coding", detail: "Editing portfolio.tsx", state: "VS Code · TypeScript" },
    { mode: "Listening", detail: "Lo-fi synth loops", state: "Spotify · on repeat" },
    { mode: "Idle", detail: "Away from keyboard", state: "Probably studying physics" },
  ],
  about: {
    overview:
      "I'm an HSC Science student in Rajshahi, Bangladesh. Between physics problem sets and chemistry labs I build web apps, chess tooling and ESP8266 gadgets. Most of what I make starts as a fix for something that annoyed me.",
    philosophy:
      "Ship small, measure everything, delete what doesn't earn its bytes. I prefer boring tech that runs fast on a cheap phone over clever tech that only works on a flagship.",
    hardware: [
      { label: "CPU", value: "AMD Ryzen 5 3400G · 4C/8T" },
      { label: "GPU", value: "Radeon Vega 11 (integrated)" },
      { label: "RAM", value: "16 GB DDR4 3200 MHz" },
      { label: "Storage", value: "512 GB NVMe SSD" },
      { label: "OS", value: "Windows 11 + WSL Ubuntu" },
    ],
    metrics: [
      { label: "SSC GPA", value: "5.00" },
      { label: "Group", value: "Science" },
      { label: "HSC batch", value: "2028" },
      { label: "Focus", value: "Physics · Math · ICT" },
    ],
  },
  links: [
    { category: "Developer", name: "GitHub", handle: "@naphium", url: "https://github.com/naphium" },
    { category: "Developer", name: "Email", handle: "naphium@gmail.com", url: "mailto:naphium@gmail.com" },
    { category: "Developer", name: "Discord", handle: "naphium", url: "https://discord.com" },
    { category: "Social", name: "Instagram", handle: "@naphium", url: "https://instagram.com/naphium" },
    { category: "Social", name: "Facebook", handle: "Nafim Muttaki", url: "https://facebook.com" },
    { category: "Social", name: "Pinterest", handle: "@naphium", url: "https://pinterest.com" },
    { category: "Social", name: "Spotify", handle: "naphium", url: "https://open.spotify.com" },
    { category: "Gaming", name: "Twitch", handle: "naphium", url: "https://twitch.tv/naphium" },
    { category: "Gaming", name: "Roblox", handle: "naphium", url: "https://roblox.com" },
  ],
  projects: [
    { category: "Web App", title: "Naphium Hub", desc: "This portfolio — a single-page dashboard with a canvas topo background, presence widget and a synth player.", tags: ["React", "Canvas", "Web Audio"], status: "Live" },
    { category: "Client Tool", title: "Naphium Chess", desc: "Browser chess client with move analysis, PGN import and keyboard-first controls.", tags: ["TypeScript", "Chess.js"], status: "Beta" },
    { category: "Client Tool", title: "Stockfish Wasm Runner", desc: "Runs Stockfish compiled to WebAssembly in a worker so analysis never blocks the UI.", tags: ["Wasm", "Web Workers"], status: "Active" },
    { category: "Firmware", title: "ESP8266 Room Node", desc: "Temperature and humidity node pushing readings over MQTT, with OTA updates and deep-sleep.", tags: ["C++", "Arduino", "MQTT"], status: "Deployed" },
    { category: "Branding", title: "নিরুদ্বেগ-২৬", desc: "Visual identity for our high school festival: logo, banners, social kit and ID cards.", tags: ["Illustrator", "Typography"], status: "Delivered" },
  ],
  skills: {
    groups: [
      { name: "Frontend Web Engineering", items: [{ name: "HTML / CSS", level: 92 }, { name: "TypeScript", level: 82 }, { name: "React", level: 80 }] },
      { name: "Embedded Firmware", items: [{ name: "ESP8266 / Arduino", level: 72 }, { name: "C / C++", level: 64 }] },
      { name: "Cloud / Serverless", items: [{ name: "Edge functions", level: 66 }, { name: "Static hosting", level: 85 }] },
      { name: "Graphic Design", items: [{ name: "Branding", level: 78 }, { name: "Vector art", level: 74 }] },
    ],
    badges: ["TypeScript", "React", "Tailwind", "Vite", "WebAssembly", "Canvas", "Web Audio", "C++", "MQTT", "Git", "Figma", "Illustrator"],
  },
  timeline: [
    { date: "2024 · Feb", title: "First real website", desc: "Shipped a hand-written HTML/CSS page for a school club." },
    { date: "2024 · Sep", title: "ESP8266 rabbit hole", desc: "Built my first sensor node and learned to love serial monitors." },
    { date: "2025 · Mar", title: "Naphium Chess", desc: "Started a chess client to analyse my own games." },
    { date: "2025 · Nov", title: "Stockfish in the browser", desc: "Got Stockfish running via Wasm inside a worker." },
    { date: "2026 · Jan", title: "নিরুদ্বেগ-২৬ branding", desc: "Designed the full identity for our school festival." },
    { date: "2026 · Nov", title: "Naphium Hub v2", desc: "Rebuilt this portfolio as a dashboard." },
  ],
  goals: [
    { title: "HSC 2028 — GPA 5.00", desc: "Consistent study blocks for Physics, Chemistry, Higher Math.", progress: 35 },
    { title: "Wasm analysis < 50 ms", desc: "Cut Stockfish depth-12 eval time on low-end phones.", progress: 55 },
    { title: "Open-source 100 stars", desc: "Publish chess and firmware tools with proper docs.", progress: 20 },
    { title: "Lighthouse 100 everywhere", desc: "Keep every project at a perfect performance score.", progress: 80 },
  ],
  setup: [
    { section: "Rig", items: [{ label: "CPU", value: "Ryzen 5 3400G" }, { label: "Board", value: "B450M" }, { label: "Display", value: "24\" 75 Hz IPS" }, { label: "Input", value: "TKL mechanical · 1600 DPI mouse" }] },
    { section: "Network", items: [{ label: "Router", value: "TP-Link Archer C6" }, { label: "Tweak", value: "Static DHCP + QoS for dev machine" }, { label: "DNS", value: "1.1.1.1 / 8.8.8.8" }, { label: "Registry", value: "TCP ack frequency + Nagle off" }] },
    { section: "Software", items: [{ label: "Editor", value: "VS Code · JetBrains Mono · One Dark" }, { label: "Extensions", value: "ESLint, Prettier, PlatformIO, GitLens" }, { label: "Minecraft", value: "Fabric + Sodium + Lithium" }, { label: "Terminal", value: "Windows Terminal + zsh (WSL)" }] },
  ],
  album: [
    { title: "Contour 01", caption: "Rajshahi elevation study", hue: 210 },
    { title: "Grid Signal", caption: "Tactical grid poster", hue: 200 },
    { title: "Padma Dusk", caption: "River at sunset, vector", hue: 225 },
    { title: "Festival Mark", caption: "নিরুদ্বেগ-২৬ logo sketch", hue: 195 },
    { title: "Chip Map", caption: "ESP8266 pinout art", hue: 215 },
    { title: "Night Desk", caption: "Workstation at 2 AM", hue: 230 },
  ],
  tracks: [
    { title: "Rajshahi Night", artist: "naphium synth", bpm: 84, notes: [220, 261.6, 329.6, 392, 329.6, 261.6, 196, 246.9] },
    { title: "Padma Drift", artist: "naphium synth", bpm: 72, notes: [174.6, 220, 261.6, 220, 196, 246.9, 293.7, 246.9] },
    { title: "Wasm Pulse", artist: "naphium synth", bpm: 110, notes: [146.8, 220, 293.7, 349.2, 293.7, 220, 174.6, 261.6] },
  ],
  faq: [
    { q: "Where are your projects hosted?", a: "Mostly static hosting and edge functions. If it can be a static file, it is one — cheaper, faster and nearly impossible to break." },
    { q: "Why Rajshahi?", a: "It's home. Quiet city, the Padma river, decent internet and very good mangoes. Everything here is built from a desk in Rajshahi." },
    { q: "Can we collaborate?", a: "Yes — especially on web tools, chess software or small hardware projects. Send an email or a Discord message with what you have in mind." },
    { q: "Do you take design work?", a: "Occasionally: logos, event branding and social kits. Timelines depend on exams." },
  ],
};

export type PortfolioData = typeof DEFAULT_DATA;
const KEY = "naphium:data";

export function loadData(): PortfolioData {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...DEFAULT_DATA, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT_DATA;
}

export function saveData(d: PortfolioData) {
  localStorage.setItem(KEY, JSON.stringify(d));
}

export function resetData() {
  localStorage.removeItem(KEY);
}

export function usePortfolio() {
  const [data, setData] = useState<PortfolioData>(DEFAULT_DATA);
  useEffect(() => setData(loadData()), []);
  return data;
}

export function useLocal<T>(key: string, initial: T) {
  const [v, setV] = useState<T>(initial);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) setV(JSON.parse(raw));
    } catch {}
  }, [key]);
  const set = (nv: T) => {
    setV(nv);
    localStorage.setItem(key, JSON.stringify(nv));
  };
  return [v, set] as const;
}

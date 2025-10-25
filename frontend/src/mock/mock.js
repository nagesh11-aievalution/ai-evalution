// Mock data for Frame Studio (frontend-only mocks)
// This file centralizes all mock content to simplify future backend integration.

export const NAV_LINKS = [
  { label: "Home", path: "/" },
  { label: "About", path: "/about" },
  { label: "Upload", path: "/upload" },
  { label: "Gallery", path: "/gallery" },
  { label: "Automation", path: "/automation" },
  { label: "Contact", path: "/contact" },
];

export const SOCIAL_LINKS = {
  youtube: "https://youtube.com/@framestudio",
  instagram: "https://instagram.com/framestudio",
  github: "https://github.com/framestudio",
};

export const CATEGORIES = [
  { key: "all", label: "All" },
  { key: "cinematic", label: "Cinematic" },
  { key: "luxury", label: "Luxury" },
  { key: "realistic", label: "Realistic" },
  { key: "experimental", label: "Experimental" },
];

export const MOCK_VIDEOS = [
  {
    id: "v1",
    title: "Midnight City Drive",
    category: "cinematic",
    thumb: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1200&auto=format&fit=crop",
    duration: "01:12",
    keywords: ["ai", "cinematic", "neon", "city"],
  },
  {
    id: "v2",
    title: "Gold Reflections",
    category: "luxury",
    thumb: "https://images.unsplash.com/photo-1606313564200-e75d5e30476e?q=80&w=1200&auto=format&fit=crop",
    duration: "00:36",
    keywords: ["ai", "luxury", "gold", "macro"],
  },
  {
    id: "v3",
    title: "Hyperreal Portrait",
    category: "realistic",
    thumb: "https://images.unsplash.com/photo-1544006659-f0b21884ce1d?q=80&w=1200&auto=format&fit=crop",
    duration: "00:44",
    keywords: ["ai", "portrait", "realistic"],
  },
  {
    id: "v4",
    title: "Liquid Chrome",
    category: "experimental",
    thumb: "https://images.unsplash.com/photo-1541873676-a18131494184?q=80&w=1200&auto=format&fit=crop",
    duration: "00:28",
    keywords: ["ai", "chrome", "abstract"],
  },
  {
    id: "v5",
    title: "Noir Alley",
    category: "cinematic",
    thumb: "https://images.unsplash.com/photo-1508057198894-247b23fe5ade?q=80&w=1200&auto=format&fit=crop",
    duration: "01:06",
    keywords: ["ai", "noir", "cinematic"],
  },
];

// Simple SEO presets per route (used by SEO component)
export const SEO_PRESETS = {
  "/": {
    title: "Frame Studio — Where AI meets imagination.",
    description:
      "Showcase and upload cinematic, luxury, and hyper-real AI-generated videos. Frame Studio is your home for premium AI video craft.",
    keywords:
      "AI video, cinematic AI, luxury visuals, realistic AI, Frame Studio, generative video, emergent, comfyui",
  },
  "/gallery": {
    title: "Gallery — Frame Studio",
    description:
      "Explore a curated gallery of cinematic, luxury, realistic and experimental AI videos crafted with precision.",
    keywords: "ai gallery, cinematic ai, luxury ai, realistic ai, experimental ai",
  },
  "/upload": {
    title: "Upload — Frame Studio",
    description:
      "Upload your AI-generated videos for showcase. Future-ready for Emergent or ComfyUI generator integration.",
    keywords: "upload ai video, frame studio upload, comfyui, emergent ai",
  },
  "/automation": {
    title: "Automation — Frame Studio",
    description:
      "Auto-generate YouTube titles, hashtags, and SEO descriptions for your AI videos.",
    keywords: "youtube seo, ai title generator, hashtags, descriptions",
  },
  "/about": {
    title: "About — Frame Studio",
    description:
      "Frame Studio is a dark, luxurious platform where AI video artistry meets refined presentation.",
    keywords: "about frame studio, ai video platform",
  },
  "/contact": {
    title: "Contact — Frame Studio",
    description:
      "Get in touch for collaborations, feedback, or partnerships. We would love to hear from you.",
    keywords: "contact frame studio, partnerships",
  },
};

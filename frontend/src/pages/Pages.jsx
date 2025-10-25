import React from "react";
import { Link } from "react-router-dom";
import Spline from "@splinetool/react-spline";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { toast } from "../components/ui/sonner";
import { CATEGORIES, MOCK_VIDEOS } from "../mock/mock";
import { Copy, Upload as UploadIcon, Video, Search } from "lucide-react";

// Utility: copy to clipboard
const copyText = async (text) => {
  try { await navigator.clipboard.writeText(text); toast("Copied to clipboard"); } catch(e) { toast("Copy failed"); }
};

export const Home = () => {
  return (
    <section className="relative">
      <div className="mx-auto max-w-[1400px] px-6 md:px-10 py-16 md:py-24 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
        {/* Left content */}
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 border border-white/20 bg-white/5 backdrop-blur-xl px-3 py-1 text-white/80 text-xs tracking-wide">Premium AI Video</div>
          <h1 className="mt-6 text-5xl md:text-6xl font-semibold leading-tight" style={{fontFamily: "Kode Mono, KodeMono, monospace"}}>Frame Studio</h1>
          <p className="mt-4 text-lg text-white/80">Where AI meets imagination. Showcase and upload cinematic, luxury, and hyper-real creations.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild className="!rounded-none !min-h-14 bg-[#00FFD1] text-black hover:bg-[#00ffd11a] hover:text-[#00FFD1]">
              <Link to="/upload"><UploadIcon size={18} className="mr-2"/> Upload Video</Link>
            </Button>
            <Button asChild variant="secondary" className="!rounded-none !min-h-14 bg-white/10 text-white hover:bg-white hover:text-black">
              <Link to="/gallery"><Video size={18} className="mr-2"/> Explore Gallery</Link>
            </Button>
          </div>
          <div className="mt-8 grid grid-cols-3 gap-4 max-w-lg">
            {["Cinematic", "Luxury", "Realistic"].map((t) => (
              <div key={t} className="border border-white/15 bg-white/5 backdrop-blur-xl px-3 py-2 text-white/70 text-sm">
                {t}
              </div>
            ))}
          </div>
        </div>

        {/* Right visual - Spline */}
        <div className="relative z-0 flex justify-center md:justify-end">
          <div style={{ width: "700px", height: "700px", overflow: "visible", position: "relative" }}>
            <Spline scene="https://prod.spline.design/NbVmy6DPLhY-5Lvg/scene.splinecode" />
          </div>
        </div>
      </div>

      {/* Feature cards */}
      <div className="mx-auto max-w-[1400px] px-6 md:px-10 pb-16 md:pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {title: "Cinematic Quality", desc: "Dark, luxurious canvas for AI films with glassmorphism and motion."},
            {title: "Creator Uploads", desc: "Frontend-only upload flow today. Ready for Emergent/ComfyUI backend."},
            {title: "SEO-Ready", desc: "Auto meta tags for YouTube/Google discovery on each section."},
          ].map((f) => (
            <Card key={f.title} className="bg-white/[0.04] border-white/15 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-white">{f.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white/70">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export const About = () => (
  <section className="mx-auto max-w-[1000px] px-6 md:px-10 py-16 md:py-24">
    <h2 className="text-4xl md:text-5xl font-semibold" style={{fontFamily: "Kode Mono, KodeMono, monospace"}}>About Frame Studio</h2>
    <p className="mt-5 text-white/80 text-lg">A crafted destination for AI-generated videos. We obsess over cinematic tone, luxury aesthetics, and realism. Built to be fast, responsive, and future-integrated with AI generation backends.</p>
    <ul className="mt-8 space-y-3 text-white/70">
      <li>• Designed for OLED-black backgrounds and neon cyan accents</li>
      <li>• Smooth micro-interactions with accessible contrast</li>
      <li>• Built on React + Shadcn UI, ready for FastAPI + Mongo</li>
    </ul>
  </section>
);

export const Upload = () => {
  const [fileName, setFileName] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [tags, setTags] = React.useState("");

  const onSubmit = (e) => {
    e.preventDefault();
    const newItem = {
      id: `u_${Date.now()}`,
      title: title || fileName || "Untitled",
      category: "cinematic",
      thumb: "https://images.unsplash.com/photo-1606313564200-e75d5e30476e?q=80&w=1200&auto=format&fit=crop",
      duration: "--:--",
      keywords: tags.split(",").map((t) => t.trim()).filter(Boolean),
    };
    const existing = JSON.parse(localStorage.getItem("fs_user_gallery") || "[]");
    existing.unshift(newItem);
    localStorage.setItem("fs_user_gallery", JSON.stringify(existing));
    setFileName(""); setTitle(""); setTags("");
    toast("Saved locally. Backend integration coming next.");
  };

  return (
    <section className="mx-auto max-w-[900px] px-6 md:px-10 py-16 md:py-24">
      <h2 className="text-4xl font-semibold" style={{fontFamily: "Kode Mono, KodeMono, monospace"}}>Upload</h2>
      <p className="mt-3 text-white/70">Frontend-only. Stores preview metadata in your browser for now.</p>
      <form onSubmit={onSubmit} className="mt-8 space-y-6">
        <div>
          <label className="block mb-2 text-white/80">Video file</label>
          <div className="flex gap-3 items-center">
            <Input type="file" accept="video/*" onChange={(e) => setFileName(e.target.files?.[0]?.name || "")} className="bg-white/5 border-white/15" />
            <span className="text-white/50 text-sm truncate max-w-[240px]">{fileName || "No file selected"}</span>
          </div>
        </div>
        <div>
          <label className="block mb-2 text-white/80">Title</label>
          <Input value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="e.g. Noir Alley" className="bg-white/5 border-white/15"/>
        </div>
        <div>
          <label className="block mb-2 text-white/80">Tags (comma separated)</label>
          <Input value={tags} onChange={(e)=>setTags(e.target.value)} placeholder="cinematic, neon, city" className="bg-white/5 border-white/15"/>
        </div>
        <Button type="submit" className="!rounded-none bg-[#00FFD1] text-black hover:bg-[#00ffd11a] hover:text-[#00FFD1]">Save to Browser</Button>
      </form>
    </section>
  );
};

export const Gallery = () => {
  const [active, setActive] = React.useState("all");
  const userItems = React.useMemo(() => JSON.parse(localStorage.getItem("fs_user_gallery") || "[]"), []);
  const data = React.useMemo(() => (active === "all" ? [...userItems, ...MOCK_VIDEOS] : [...userItems, ...MOCK_VIDEOS].filter(v => v.category === active)), [active, userItems]);

  return (
    <section className="mx-auto max-w-[1400px] px-6 md:px-10 py-16 md:py-24">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-4xl font-semibold" style={{fontFamily: "Kode Mono, KodeMono, monospace"}}>Gallery</h2>
        <div className="hidden md:flex items-center w-[340px] gap-2 bg-white/5 p-2 border border-white/15">
          <Search size={18} className="text-white/40"/>
          <input placeholder="Search videos..." className="bg-transparent outline-none text-sm flex-1 text-white placeholder:text-white/40"/>
        </div>
      </div>

      <Tabs value={active} onValueChange={setActive} className="mt-8">
        <TabsList className="bg-white/5 border border-white/15">
          {CATEGORIES.map(c => (
            <TabsTrigger key={c.key} value={c.key} className="text-white/80 data-[state=active]:bg-[#00FFD1] data-[state=active]:text-black">
              {c.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value={active} className="mt-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {data.map((v) => (
              <Card key={v.id} className="group bg-white/[0.04] border-white/15 backdrop-blur-xl overflow-hidden">
                <div className="relative">
                  <img src={v.thumb} alt={v.title} className="w-full h-48 object-cover"/>
                  <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1">{v.duration}</div>
                </div>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-white font-medium">{v.title}</div>
                      <div className="text-white/50 text-sm capitalize">{v.category}</div>
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="!rounded-none bg-[#00FFD1] text-black hover:bg-[#00ffd11a] hover:text-[#00FFD1]">Preview</Button>
                      </DialogTrigger>
                      <DialogContent className="bg-black/90 border-white/15 text-white">
                        <DialogHeader>
                          <DialogTitle>{v.title}</DialogTitle>
                        </DialogHeader>
                        <img src={v.thumb} alt={v.title} className="w-full h-64 object-cover border border-white/10"/>
                        <div className="text-white/70 text-sm">Keywords: {v.keywords?.join(", ") || "—"}</div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </section>
  );
};

export const Contact = () => {
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [msg, setMsg] = React.useState("");
  const onSubmit = (e) => { e.preventDefault(); setName(""); setEmail(""); setMsg(""); toast("Message saved locally. Backend coming next."); };
  return (
    <section className="mx-auto max-w-[800px] px-6 md:px-10 py-16 md:py-24">
      <h2 className="text-4xl font-semibold" style={{fontFamily: "Kode Mono, KodeMono, monospace"}}>Contact</h2>
      <p className="mt-2 text-white/70">Say hello — collabs, feedback, partnerships.</p>
      <form onSubmit={onSubmit} className="mt-8 space-y-6">
        <div>
          <label className="block mb-2 text-white/80">Name</label>
          <Input value={name} onChange={(e)=>setName(e.target.value)} placeholder="Your name" className="bg-white/5 border-white/15"/>
        </div>
        <div>
          <label className="block mb-2 text-white/80">Email</label>
          <Input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="you@example.com" className="bg-white/5 border-white/15"/>
        </div>
        <div>
          <label className="block mb-2 text-white/80">Message</label>
          <Textarea value={msg} onChange={(e)=>setMsg(e.target.value)} placeholder="Your message" className="bg-white/5 border-white/15"/>
        </div>
        <Button type="submit" className="!rounded-none bg-[#00FFD1] text-black hover:bg-[#00ffd11a] hover:text-[#00FFD1]">Send</Button>
      </form>
    </section>
  );
};

export const Automation = () => {
  const [input, setInput] = React.useState("");
  const [out, setOut] = React.useState({ title: "", tags: "", desc: "" });

  const generate = () => {
    // Frontend-only mock generator until LLM integration
    const base = input || "AI cinematic video";
    const title = `${base} — Ultra Real 4K | Frame Studio`;
    const tags = ["#AI", "#Cinematic", "#4K", "#FrameStudio", "#Generative"].join(" ");
    const desc = `Experience ${base} crafted with cutting-edge AI. Cinematic tone, luxury detail, and realism.\n\nChapters:\n00:00 Intro\n00:10 Sequence\n01:00 Outro\n\nTags: ${tags}`;
    setOut({ title, tags, desc });
    toast("Generated SEO copy (mock)");
  };

  return (
    <section className="mx-auto max-w-[1000px] px-6 md:px-10 py-16 md:py-24">
      <h2 className="text-4xl font-semibold" style={{fontFamily: "Kode Mono, KodeMono, monospace"}}>Automation</h2>
      <p className="mt-2 text-white/70">Auto-generate YouTube titles, hashtags, and descriptions. Currently mocked — will connect to LLM later.</p>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="bg-white/[0.04] border-white/15 backdrop-blur-xl">
          <CardHeader><CardTitle className="text-white">Input</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Input value={input} onChange={(e)=>setInput(e.target.value)} placeholder="Describe your video (e.g., Noir alley rain sequence)" className="bg-white/5 border-white/15"/>
            <Button onClick={generate} className="!rounded-none bg-[#00FFD1] text-black hover:bg-[#00ffd11a] hover:text-[#00FFD1]">Generate</Button>
          </CardContent>
        </Card>

        <Card className="bg-white/[0.04] border-white/15 backdrop-blur-xl">
          <CardHeader><CardTitle className="text-white">Results</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            <div>
              <div className="text-white/70 text-sm mb-1">Title</div>
              <div className="flex items-center gap-2">
                <Input readOnly value={out.title} className="bg-white/5 border-white/15"/>
                <Button variant="secondary" className="!rounded-none bg-white/10 text-white hover:bg-white hover:text-black" onClick={()=>copyText(out.title)}><Copy size={16}/></Button>
              </div>
            </div>
            <div>
              <div className="text-white/70 text-sm mb-1">Hashtags</div>
              <div className="flex items-center gap-2">
                <Input readOnly value={out.tags} className="bg-white/5 border-white/15"/>
                <Button variant="secondary" className="!rounded-none bg-white/10 text-white hover:bg-white hover:text-black" onClick={()=>copyText(out.tags)}><Copy size={16}/></Button>
              </div>
            </div>
            <div>
              <div className="text-white/70 text-sm mb-1">Description</div>
              <div className="flex items-center gap-2">
                <Textarea readOnly value={out.desc} className="bg-white/5 border-white/15 h-40"/>
                <Button variant="secondary" className="!rounded-none bg-white/10 text-white hover:bg-white hover:text-black" onClick={()=>copyText(out.desc)}><Copy size={16}/></Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default { Home, About, Upload, Gallery, Contact, Automation };

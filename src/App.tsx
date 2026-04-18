/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, useScroll, useTransform, AnimatePresence } from "motion/react";
import { 
  Play, 
  CheckCircle2, 
  Users, 
  Star, 
  Mail, 
  Instagram, 
  Twitter, 
  ArrowRight, 
  Menu, 
  X,
  Youtube,
  Video,
  Zap,
  Send,
  MessageSquare,
  LogOut,
  LogIn,
  Bell
} from "lucide-react";
import React, { useState, useRef, useEffect, createContext, useContext } from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { AdminPortal } from "./components/AdminPortal";
import { 
  auth, 
  db, 
  googleProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  collection, 
  addDoc, 
  serverTimestamp, 
  doc, 
  setDoc, 
  getDoc,
  query,
  where,
  onSnapshot,
  User 
} from "./firebase";

// Auth Context
interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Store user data in Firestore
        try {
          const userRef = doc(db, "users", currentUser.uid);
          const userSnap = await getDoc(userRef);
          if (!userSnap.exists()) {
            await setDoc(userRef, {
              uid: currentUser.uid,
              email: currentUser.email,
              displayName: currentUser.displayName,
              photoURL: currentUser.photoURL,
              createdAt: serverTimestamp(),
            });
          }
        } catch (error: any) {
          console.error("Error storing user data:", error);
          if (error.message.includes("insufficient permissions")) {
            console.error('User Store Firestore Error Details:', JSON.stringify({
              error: error.message,
              operationType: 'write',
              path: `users/${currentUser.uid}`,
              authInfo: {
                userId: currentUser.uid,
                email: currentUser.email,
              }
            }));
          }
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const login = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user') {
        console.log("Login popup closed by user");
      } else if (error.code === 'auth/unauthorized-domain') {
        alert("This domain is not authorized in Firebase. Please add it to your Firebase Console > Authentication > Settings > Authorized domains.");
      } else {
        console.error("Login failed", error);
      }
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, login, logout } = useAuth();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/50 backdrop-blur-lg border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6 md:px-16 h-24 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <span className="text-2xl font-extrabold tracking-tighter font-heading">Raza<span className="text-[#FF6A00]">.</span></span>
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-10">
          {["Home", "Work", "Services", "About"].map((item) => (
            <a 
              key={item} 
              href={`#${item.toLowerCase()}`} 
              className="text-sm font-medium text-[#A0A0A0] hover:text-white transition-colors"
            >
              {item}
            </a>
          ))}
          
          <Link 
            to="/admin" 
            className="text-sm font-medium text-[#A0A0A0] hover:text-white transition-colors"
          >
            Admin Portal
          </Link>
          
          {user ? (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <img src={user.photoURL || ""} alt={user.displayName || ""} className="w-8 h-8 rounded-full border border-white/10" />
                <span className="text-xs font-medium text-white hidden lg:block">{user.displayName}</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={logout}
                className="text-gray-400 hover:text-white hover:bg-white/5 rounded-full"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          ) : (
            <Button 
              onClick={login}
              className="bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-full px-6 py-2 text-sm font-semibold"
            >
              <LogIn className="w-4 h-4 mr-2" />
              Login
            </Button>
          )}

          <a href="#contact">
            <Button className="bg-gradient-orange hover:opacity-90 text-white border-none rounded-full px-7 py-6 font-semibold text-sm glow-orange">
              Hire Me
            </Button>
          </a>
        </div>

        {/* Mobile Toggle */}
        <button className="md:hidden text-white" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden bg-black border-b border-white/10 px-6 py-8 flex flex-col gap-6"
        >
          {["Home", "About"].map((item) => (
            <a 
              key={item} 
              href={`#${item.toLowerCase()}`} 
              className="text-lg font-medium text-gray-400"
              onClick={() => setIsOpen(false)}
            >
              {item}
            </a>
          ))}

          <Link 
            to="/admin" 
            className="text-lg font-medium text-gray-400"
            onClick={() => setIsOpen(false)}
          >
            Admin Portal
          </Link>

          {["Work", "Services"].map((item) => (
            <a 
              key={item} 
              href={`#${item.toLowerCase()}`} 
              className="text-lg font-medium text-gray-400"
              onClick={() => setIsOpen(false)}
            >
              {item}
            </a>
          ))}
          
          {user ? (
            <Button onClick={logout} variant="outline" className="w-full py-6 rounded-full border-white/10 text-white">
              Logout ({user.displayName})
            </Button>
          ) : (
            <Button onClick={login} className="bg-white/5 text-white border-white/10 rounded-full w-full py-6">
              Login with Google
            </Button>
          )}

          <Button className="bg-gradient-orange text-white border-none rounded-full w-full py-6">
            Hire Me
          </Button>
        </motion.div>
      )}
    </nav>
  );
};

const Hero = () => {
  return (
    <section id="home" className="relative min-h-screen flex items-center pt-24 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 md:px-16 w-full relative z-10">
        <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#FF6A00] mb-4 block">
              Professional Video Editor
            </span>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter leading-[1.1] mb-6 font-heading">
              I Turn Raw Footage Into <br />
              <span className="text-gradient">High-Converting Videos</span>
            </h1>
            <p className="text-lg text-[#A0A0A0] max-w-lg mb-8 leading-relaxed">
              We help creators and brands grow with engaging, scroll-stopping edits that boost retention and performance.
            </p>
            <div className="flex flex-wrap items-center gap-4 mb-12">
              <a href="#work">
                <Button size="lg" className="bg-gradient-orange hover:opacity-90 text-white rounded-full px-8 py-6 text-sm font-semibold glow-orange group">
                  View Our Work
                </Button>
              </a>
              <a href="#contact">
                <Button size="lg" variant="outline" className="bg-white/[0.03] border-[#FF6A00]/20 backdrop-blur-md hover:bg-white/5 text-white rounded-full px-8 py-6 text-sm font-semibold">
                  Hire Me
                </Button>
              </a>
            </div>

            <div className="flex gap-8">
              <div className="flex flex-col">
                <span className="text-2xl font-extrabold text-white">50+</span>
                <span className="text-[10px] uppercase tracking-widest text-[#A0A0A0] font-bold">Projects</span>
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-extrabold text-white">3+</span>
                <span className="text-[10px] uppercase tracking-widest text-[#A0A0A0] font-bold">Years Exp.</span>
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-extrabold text-white">100%</span>
                <span className="text-[10px] uppercase tracking-widest text-[#A0A0A0] font-bold">Satisfaction</span>
              </div>
            </div>
          </motion.div>

          <div className="hidden lg:flex items-center justify-center gap-6 relative">
            <motion.div
              initial={{ opacity: 0, x: -30, rotate: -5 }}
              animate={{ opacity: 1, x: 0, rotate: -2 }}
              whileHover={{ scale: 1.05, rotate: 0, zIndex: 20 }}
              transition={{ duration: 0.8, type: "spring" }}
              className="w-64 aspect-[3/4] rounded-3xl overflow-hidden shadow-2xl border border-white/10 relative z-10"
            >
              <img 
                src="https://public.readdy.ai/ai/img_res/f033063de00da8b1c820f7ad94bc4518.jpg" 
                alt="Editing Setup 1"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 30, rotate: 5 }}
              animate={{ opacity: 1, x: 0, rotate: 2 }}
              whileHover={{ scale: 1.05, rotate: 0, zIndex: 20 }}
              transition={{ duration: 0.8, delay: 0.2, type: "spring" }}
              className="w-64 aspect-[3/4] rounded-3xl overflow-hidden shadow-2xl border border-white/10 mt-32"
            >
              <img 
                src="https://public.readdy.ai/ai/img_res/fbd2dab147702b851c15dff761c30c4e.jpg" 
                alt="Editing Setup 2"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

const About = () => {
  return (
    <section id="about" className="py-32 relative">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-8 font-heading">About Me<span className="text-[#FF6A00]">.</span></h2>
            <p className="text-gray-400 text-lg mb-8 leading-relaxed">
              Hey, I'm Raza. I'm a professional video editor obsessed with the art of visual storytelling. With over 3 years of experience, I've mastered the techniques that keep viewers hooked from the first second to the last.
            </p>
            <ul className="space-y-4">
              {[
                "Short-form content (Reels, TikTok, Shorts)",
                "YouTube long-form storytelling",
                "Ads & promotional videos"
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-gray-300">
                  <CheckCircle2 className="text-[#FF6A00] w-5 h-5" />
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>

          <div className="grid grid-cols-2 gap-4">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="col-span-2 glass p-8 rounded-3xl border-[#FF6A00]/30 shadow-[0_0_20px_rgba(255,106,0,0.05)]"
            >
              <h3 className="text-5xl font-extrabold text-white mb-2">50+</h3>
              <p className="text-[10px] uppercase tracking-widest text-[#FF6A00] font-bold">Projects Completed</p>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="glass p-8 rounded-3xl"
            >
              <h3 className="text-4xl font-extrabold text-white mb-2">3+</h3>
              <p className="text-[10px] uppercase tracking-widest text-[#A0A0A0] font-bold">Years Exp.</p>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="glass p-8 rounded-3xl"
            >
              <h3 className="text-4xl font-extrabold text-white mb-2">100%</h3>
              <p className="text-[10px] uppercase tracking-widest text-[#A0A0A0] font-bold">Satisfaction</p>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

const Work = () => {
  const [activeMedia, setActiveMedia] = useState<{ id: string, type: 'youtube' | 'instagram' } | null>(null);
  
  const projects = [
    {
      title: "YouTube Growth Edit",
      category: "Storytelling & Retention",
      image: "https://img.youtube.com/vi/zMjj8D-Clvg/maxresdefault.jpg",
      mediaId: "zMjj8D-Clvg",
      type: 'youtube' as const
    },
    {
      title: "Instagram Reel",
      category: "Fast-Paced Motion",
      image: "https://i.ibb.co/m57SJZ8S/Screenshot-2026-04-15-145203.png",
      mediaId: "DImFnU3MW9I",
      type: 'instagram' as const
    },
    {
      title: "Product Ad",
      category: "Cinematic B-Roll",
      image: "https://img.youtube.com/vi/Crk4Juui5MM/maxresdefault.jpg",
      mediaId: "Crk4Juui5MM",
      type: 'youtube' as const
    },
    {
      title: "Documentary Style",
      category: "Advanced Grading",
      image: "https://img.youtube.com/vi/F-qEzcQFI94/maxresdefault.jpg",
      mediaId: "F-qEzcQFI94",
      type: 'youtube' as const
    },
    {
      title: "Travel Vlog",
      category: "Cinematic Journey",
      image: "https://img.youtube.com/vi/CrzXAZ3CTv0/maxresdefault.jpg",
      mediaId: "CrzXAZ3CTv0",
      type: 'youtube' as const
    },
    {
      title: "Gaming Montage",
      category: "Entertainment Edit",
      image: "https://img.youtube.com/vi/8bQ-8ZnHG4A/maxresdefault.jpg",
      mediaId: "8bQ-8ZnHG4A",
      type: 'youtube' as const
    }
  ];

  return (
    <section id="work" className="py-32">
      <div className="max-w-7xl mx-auto px-6 md:px-16">
        <div className="mb-16">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#FF6A00] mb-4 block">Portfolio</span>
          <h2 className="text-4xl md:text-5xl font-extrabold mb-4 font-heading">Our Work<span className="text-[#FF6A00]">.</span></h2>
          <p className="text-[#A0A0A0]">A selection of our best edits across various formats.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              onClick={() => project.mediaId && setActiveMedia({ id: project.mediaId, type: project.type! })}
              className={`group cursor-pointer glass rounded-3xl overflow-hidden relative aspect-video ${project.mediaId ? 'ring-1 ring-orange-500/20' : ''}`}
            >
              <img 
                src={project.image} 
                alt={project.title} 
                className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-all duration-500 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
              <div className="absolute bottom-6 left-6">
                <h3 className="text-base font-bold mb-1">{project.title}</h3>
                <p className="text-[#A0A0A0] text-xs font-medium">{project.category}</p>
              </div>
              <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                  <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                </div>
              </div>
              {project.mediaId && (
                <div className="absolute top-6 left-6">
                  <Badge className="bg-orange-500 text-white border-none text-[8px] uppercase tracking-widest font-bold">
                    Watch {project.type === 'youtube' ? 'Video' : 'Reel'}
                  </Badge>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Media Modal */}
      {activeMedia && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10"
        >
          <div className="absolute inset-0 bg-black/90 backdrop-blur-2xl" onClick={() => setActiveMedia(null)} />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`relative w-full glass rounded-3xl overflow-hidden shadow-2xl border-white/10 ${
              activeMedia.type === 'instagram' ? 'max-w-[400px] aspect-[9/16]' : 'max-w-5xl aspect-video'
            }`}
          >
            <button 
              onClick={() => setActiveMedia(null)}
              className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center border border-white/20 hover:bg-black/70 transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
            
            {activeMedia.type === 'youtube' ? (
              <iframe
                src={`https://www.youtube.com/embed/${activeMedia.id}?autoplay=1`}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="w-full h-full"
              />
            ) : (
              <iframe
                src={`https://www.instagram.com/reel/${activeMedia.id}/embed`}
                title="Instagram Reel"
                frameBorder="0"
                scrolling="no"
                allowTransparency={true}
                className="w-full h-full"
              />
            )}
          </motion.div>
        </motion.div>
      )}
    </section>
  );
};

const Services = () => {
  const services = [
    {
      title: "Short Form Editing",
      icon: <Zap className="w-6 h-6" />,
      desc: "Engaging, fast-paced edits for Reels, TikTok, and Shorts designed to maximize retention.",
      features: ["Fast-paced cuts", "Dynamic captions", "Sound effects", "Trend optimization"],
      highlight: false
    },
    {
      title: "YouTube Editing",
      icon: <Youtube className="w-6 h-6" />,
      desc: "Professional long-form editing with storytelling, pacing, and audience retention in mind.",
      features: ["Story-driven cuts", "A-roll / B-roll mix", "Color grading", "Audio mixing"],
      highlight: true
    },
    {
      title: "Ads & Brand Videos",
      icon: <Video className="w-6 h-6" />,
      desc: "High-quality, conversion-focused edits that help brands turn viewers into customers.",
      features: ["Hook creation", "Call to actions", "Motion graphics", "Commercial grading"],
      highlight: false
    }
  ];

  return (
    <section id="services" className="py-32">
      <div className="max-w-7xl mx-auto px-6 md:px-16">
        <div className="text-center mb-20">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#FF6A00] mb-4 block">Solutions</span>
          <h2 className="text-4xl md:text-5xl font-extrabold mb-4 font-heading">Services<span className="text-[#FF6A00]">.</span></h2>
          <p className="text-[#A0A0A0]">Premium editing solutions tailored to your platform and goals.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 items-center">
          {services.map((service, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className={`p-10 rounded-[32px] glass flex flex-col transition-all duration-500 relative ${
                service.highlight 
                ? "border-[#FF6A00] shadow-[0_0_40px_rgba(255,106,0,0.1)] md:scale-105 z-10" 
                : "border-white/5 hover:border-white/20"
              }`}
            >
              {service.highlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#FF6A00] text-white text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full shadow-[0_0_20px_rgba(255,106,0,0.5)]">
                  Most Popular
                </div>
              )}
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-8 ${
                service.highlight ? "bg-[#FF6A00] text-white" : "bg-white/5 text-[#FF6A00]"
              }`}>
                {service.icon}
              </div>
              <h3 className="text-2xl font-bold mb-4">{service.title}</h3>
              <p className="text-[#A0A0A0] mb-8 text-sm leading-relaxed">{service.desc}</p>
              
              <div className="space-y-4">
                <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-500 mb-4">Includes</p>
                {service.features.map((feature, j) => (
                  <div key={j} className="flex items-center gap-3 text-sm text-gray-300">
                    <CheckCircle2 className="w-4 h-4 text-[#FF6A00]" />
                    {feature}
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const HowItWorks = () => {
  const steps = [
    { title: "You Send Footage", desc: "Upload your raw files and provide any specific instructions or vision.", icon: <Send className="w-6 h-6" /> },
    { title: "I Edit & Enhance", desc: "I cut, grade, mix audio, and add effects to bring your vision to life.", icon: <Zap className="w-6 h-6" /> },
    { title: "Revisions If Needed", desc: "Review the draft and let me know if anything needs fine-tuning.", icon: <MessageSquare className="w-6 h-6" /> },
    { title: "Final Delivery", desc: "Receive the high-quality exported video ready to be published.", icon: <CheckCircle2 className="w-6 h-6" /> }
  ];

  return (
    <section className="py-32 bg-white/[0.02] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <h2 className="text-4xl md:text-5xl font-bold mb-20 text-center font-heading">How It Works<span className="text-[#FF6A00]">.</span></h2>
        
        <div className="relative">
          {/* Connecting Line */}
          <div className="hidden md:block absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange-500/30 to-transparent -translate-y-1/2" />
          
          <div className="grid md:grid-cols-4 gap-12">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative flex flex-col items-center text-center"
              >
                <div className="w-16 h-16 rounded-full glass border-white/10 flex items-center justify-center mb-8 relative z-10 bg-black group hover:border-orange-500/50 transition-colors">
                  <div className="text-[#FF6A00]">{step.icon}</div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#FF6A00] text-white text-[10px] font-bold flex items-center justify-center">
                    {i + 1}
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-4">{step.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

const Testimonials = () => {
  const reviews = [
    {
      name: "Sarah K.",
      role: "YouTuber (500k+ Subs)",
      text: "Amazing editing skills, highly recommended! The retention on my latest video doubled just because of how well the cuts were timed. Will definitely work with Raza again.",
      stars: 5
    },
    {
      name: "Marcus T.",
      role: "E-commerce Brand Owner",
      text: "Very professional and fast delivery. We needed a promotional ad turned around in 48 hours and Raza delivered a stunning, conversion-ready edit ahead of schedule.",
      stars: 5
    }
  ];

  return (
    <section className="py-32">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="text-4xl md:text-5xl font-bold mb-20 text-center font-heading">What Clients Say<span className="text-[#FF6A00]">.</span></h2>
        
        <div className="grid md:grid-cols-2 gap-8">
          {reviews.map((review, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="p-10 rounded-[32px] glass border-white/5 relative group hover:border-orange-500/20 transition-colors"
            >
              <div className="flex gap-1 mb-6">
                {[...Array(review.stars)].map((_, j) => (
                  <Star key={j} className="w-4 h-4 text-orange-400 fill-orange-400" />
                ))}
              </div>
              <p className="text-lg text-gray-300 italic mb-8 leading-relaxed">"{review.text}"</p>
              <div>
                <p className="font-bold text-white">{review.name}</p>
                <p className="text-xs text-orange-500 font-medium uppercase tracking-widest">{review.role}</p>
              </div>
              <div className="absolute top-10 right-10 opacity-5 group-hover:opacity-10 transition-opacity">
                <MessageSquare className="w-20 h-20" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const Contact = () => {
  const { user, login } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: ""
  });

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.displayName || "",
        email: user.email || ""
      }));
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      await login();
      return;
    }

    if (!formData.message.trim()) return;

    setIsSubmitting(true);
    const path = "messages";
    try {
      await addDoc(collection(db, path), {
        senderId: user.uid,
        senderName: formData.name,
        senderEmail: formData.email,
        content: formData.message,
        status: "new",
        createdAt: serverTimestamp(),
      });
      setSubmitted(true);
      setFormData(prev => ({ ...prev, message: "" }));
      setTimeout(() => setSubmitted(false), 5000);
    } catch (error: any) {
      console.error("Error sending message:", error);
      if (error.message.includes("insufficient permissions")) {
        const errInfo = {
          error: error.message,
          operationType: 'create',
          path: path,
          authInfo: {
            userId: auth.currentUser?.uid,
            email: auth.currentUser?.email,
            emailVerified: auth.currentUser?.emailVerified,
            isAnonymous: auth.currentUser?.isAnonymous,
          }
        };
        console.error('Firestore Error Details:', JSON.stringify(errInfo));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contact" className="py-32 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-radial from-orange-500/5 to-transparent opacity-50" />
      
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid md:grid-cols-2 gap-20">
          <div>
            <h2 className="text-5xl md:text-6xl font-black mb-8 font-heading leading-tight">
              Let's Work <br />
              <span className="text-gradient">Together.</span>
            </h2>
            <p className="text-gray-400 text-lg mb-12 leading-relaxed max-w-md">
              Have a project in mind? Let's create something amazing. Drop me a message with your requirements and I'll get back to you within 24 hours.
            </p>
            
            <div className="space-y-6">
              <div className="flex items-center gap-6 p-6 rounded-2xl glass border-white/5 hover:border-white/10 transition-colors group">
                <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center text-[#FF6A00] group-hover:bg-[#FF6A00] group-hover:text-white transition-colors">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1">Email Me</p>
                  <p className="text-white font-medium">raza.studioworks@gmail.com</p>
                </div>
              </div>
              <div className="flex items-center gap-6 p-6 rounded-2xl glass border-white/5 hover:border-white/10 transition-colors group">
                <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center text-[#FF6A00] group-hover:bg-[#FF6A00] group-hover:text-white transition-colors">
                  <Instagram className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1">Follow Me</p>
                  <p className="text-white font-medium">@owaisahmedraza786</p>
                </div>
              </div>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-10 rounded-[40px] glass border-white/10 shadow-2xl relative overflow-hidden"
          >
            {submitted ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="h-full flex flex-col items-center justify-center text-center py-10"
              >
                <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 mb-6">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Message Sent!</h3>
                <p className="text-gray-400">Thank you for reaching out. I'll get back to you shortly.</p>
                <Button 
                  variant="ghost" 
                  className="mt-8 text-orange-500 hover:text-orange-400"
                  onClick={() => setSubmitted(false)}
                >
                  Send another message
                </Button>
              </motion.div>
            ) : (
              <>
                {!user && (
                  <div className="absolute inset-0 z-20 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-orange-500/20 flex items-center justify-center text-orange-500 mb-6">
                      <LogIn className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Login Required</h3>
                    <p className="text-gray-400 text-sm mb-8">Please sign in to send a message and start your project.</p>
                    <Button 
                      onClick={login}
                      className="bg-gradient-orange text-white rounded-full px-8 py-6 font-bold glow-orange"
                    >
                      Sign in with Google
                    </Button>
                  </div>
                )}
                <form className="space-y-6" onSubmit={handleSubmit}>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-gray-500 ml-1">Your Name</label>
                    <Input 
                      placeholder="John Doe" 
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="bg-white/5 border-white/10 h-14 rounded-xl focus:border-orange-500/50 transition-colors" 
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-gray-500 ml-1">Email Address</label>
                    <Input 
                      type="email" 
                      placeholder="john@example.com" 
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="bg-white/5 border-white/10 h-14 rounded-xl focus:border-orange-500/50 transition-colors" 
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-gray-500 ml-1">Project Details</label>
                    <Textarea 
                      placeholder="Tell me about your footage and vision..." 
                      value={formData.message}
                      onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                      className="bg-white/5 border-white/10 min-h-[150px] rounded-xl focus:border-orange-500/50 transition-colors" 
                      required
                    />
                  </div>
                  <Button 
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-orange hover:opacity-90 text-white h-16 rounded-xl text-lg font-bold glow-orange group"
                  >
                    {isSubmitting ? "Sending..." : "Send Message"}
                    <Send className="ml-2 w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </Button>
                </form>
              </>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

const Footer = () => {
  return (
    <footer className="py-20 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-10 mb-20">
          <div className="flex-1">
            <span className="text-7xl md:text-[10rem] font-black tracking-tighter font-heading text-white/[0.03] select-none leading-none block">
              Raza<span className="text-[#FF6A00]/5">.</span>
            </span>
          </div>
          <div className="flex gap-6">
            <a href="#" className="w-12 h-12 rounded-full glass flex items-center justify-center text-gray-400 hover:text-[#FF6A00] hover:border-orange-500/30 transition-all">
              <Instagram className="w-5 h-5" />
            </a>
            <a href="#" className="w-12 h-12 rounded-full glass flex items-center justify-center text-gray-400 hover:text-[#FF6A00] hover:border-orange-500/30 transition-all">
              <Twitter className="w-5 h-5" />
            </a>
            <a href="#" className="w-12 h-12 rounded-full glass flex items-center justify-center text-gray-400 hover:text-[#FF6A00] hover:border-orange-500/30 transition-all">
              <Mail className="w-5 h-5" />
            </a>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-10 border-t border-white/5 text-xs text-gray-600 font-medium uppercase tracking-widest">
          <p>© 2026 Raza. All rights reserved.</p>
          <div className="flex gap-8">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

const UserNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [dismissed, setDismissed] = useState<string[]>([]);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "messages"),
      where("senderId", "==", user.uid),
      where("status", "==", "confirmed")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newNotifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setNotifications(newNotifications);
    });

    return () => unsubscribe();
  }, [user]);

  const activeNotifications = notifications.filter(n => !dismissed.includes(n.id));

  if (activeNotifications.length === 0) return null;

  return (
    <div className="fixed bottom-8 right-8 z-[100] flex flex-col gap-4 max-w-md w-full px-4 md:px-0">
      <AnimatePresence>
        {activeNotifications.map((notif) => (
          <motion.div
            key={notif.id}
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.9 }}
            className="bg-zinc-900 border border-emerald-500/30 rounded-2xl p-6 shadow-[0_0_30px_rgba(16,185,129,0.1)] backdrop-blur-xl relative overflow-hidden group"
          >
            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
            
            <button 
              onClick={() => setDismissed(prev => [...prev, notif.id])}
              className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex gap-4">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center shrink-0">
                <Bell className="w-6 h-6 text-emerald-500" />
              </div>
              <div className="space-y-2">
                <h4 className="font-bold text-white flex items-center gap-2">
                  Message Confirmed
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                </h4>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Dear, <span className="text-emerald-400 font-semibold">{notif.senderName}</span> Your Message Has Been Confirmed By Admin, And We Will Shortly Approach You, Thank You For Choosing Us As Your Trusted Video Editor Partner - Raza Studios
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

const MainSite = () => {
  return (
    <main className="bg-[#050505] text-white selection:bg-orange-500/30 relative overflow-hidden">
      <div className="ambient-glow top-[-200px] right-[-100px]" />
      <div className="ambient-glow bottom-[-200px] left-[-100px]" />
      
      <Navbar />
      <Hero />
      <About />
      <Work />
      <Services />
      <HowItWorks />
      <Testimonials />
      <Contact />
      <Footer />
      <UserNotifications />
    </main>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MainSite />} />
          <Route path="/admin" element={<AdminPortal />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

import React, { useState, useEffect } from "react";
import { auth, db, signInWithEmailAndPassword, signOut, collection, query, orderBy, onSnapshot, updateDoc, deleteDoc, doc } from "../firebase";
import { LogOut, CheckCircle, Trash2, Mail, User, Clock, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderEmail: string;
  content: string;
  createdAt: any;
  status?: "new" | "viewed" | "confirmed";
  adminNote?: string;
}

export const AdminPortal = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user && user.email === "razastudios@gmail.com") {
        setIsAdmin(true);
        fetchMessages();
      } else {
        setIsAdmin(false);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchMessages = () => {
    const q = query(collection(db, "messages"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      setMessages(msgs);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching messages:", err);
      setError("Permission denied. Ensure your account has admin privileges.");
      setLoading(false);
    });
    return unsubscribe;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      if (userCredential.user.email !== "razastudios@gmail.com") {
        await signOut(auth);
        setError("Access denied. Only the authorized admin can enter.");
      }
    } catch (err: any) {
      setError("Invalid credentials. Please check your email and password.");
    }
  };

  const handleLogout = () => signOut(auth);

  const markAsViewed = async (id: string) => {
    try {
      await updateDoc(doc(db, "messages", id), { status: "viewed" });
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  const sendConfirmation = async (id: string) => {
    try {
      await updateDoc(doc(db, "messages", id), { 
        status: "confirmed",
        adminNote: "Admin has viewed your message and confirmed receipt."
      });
    } catch (err) {
      console.error("Error sending confirmation:", err);
    }
  };

  const deleteMessage = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this message?")) return;
    try {
      await deleteDoc(doc(db, "messages", id));
    } catch (err) {
      console.error("Error deleting message:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 backdrop-blur-xl"
        >
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center">
              <ShieldCheck className="w-8 h-8 text-emerald-500" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white text-center mb-2">Admin Access</h1>
          <p className="text-zinc-400 text-center mb-8 text-sm">Please enter your credentials to manage Raza Studios.</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Email Address</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                placeholder="admin@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                placeholder="••••••••"
                required
              />
            </div>
            {error && <p className="text-red-400 text-xs bg-red-400/10 p-3 rounded-lg border border-red-400/20">{error}</p>}
            <button 
              type="submit"
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-semibold py-3 rounded-xl transition-all active:scale-[0.98]"
            >
              Sign In
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-zinc-950" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">Admin Dashboard</h1>
              <p className="text-xs text-zinc-500">Raza Studios Management</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-all text-sm font-medium"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold mb-1">Incoming Messages</h2>
            <p className="text-zinc-500 text-sm">You have {messages.length} total inquiries.</p>
          </div>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="grid gap-6">
          <AnimatePresence mode="popLayout">
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                layout
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className={`bg-zinc-900/50 border rounded-2xl p-6 transition-all ${
                  msg.status === 'confirmed' ? 'border-emerald-500/30' : 
                  msg.status === 'viewed' ? 'border-zinc-700' : 'border-zinc-800 shadow-[0_0_20px_rgba(16,185,129,0.05)]'
                }`}
              >
                <div className="flex flex-col lg:flex-row gap-6">
                  <div className="flex-1 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center">
                          <User className="w-6 h-6 text-zinc-400" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">{msg.senderName}</h3>
                          <div className="flex items-center gap-2 text-zinc-500 text-sm">
                            <Mail className="w-3 h-3" />
                            {msg.senderEmail}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-zinc-500 text-xs">
                        <Clock className="w-3 h-3" />
                        {msg.createdAt?.toDate().toLocaleString() || "Just now"}
                      </div>
                    </div>
                    
                    <div className="bg-zinc-950/50 rounded-xl p-4 border border-zinc-800/50">
                      <p className="text-zinc-300 leading-relaxed">{msg.content}</p>
                    </div>

                    {msg.adminNote && (
                      <div className="flex items-center gap-2 text-emerald-500 text-sm font-medium bg-emerald-500/5 p-3 rounded-lg border border-emerald-500/10">
                        <CheckCircle className="w-4 h-4" />
                        {msg.adminNote}
                      </div>
                    )}
                  </div>

                  <div className="lg:w-48 flex lg:flex-col gap-2">
                    {msg.status !== 'confirmed' && (
                      <button 
                        onClick={() => sendConfirmation(msg.id)}
                        className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 py-2 px-4 rounded-xl text-sm font-bold transition-all"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Confirm
                      </button>
                    )}
                    {msg.status === 'new' && (
                      <button 
                        onClick={() => markAsViewed(msg.id)}
                        className="flex-1 flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white py-2 px-4 rounded-xl text-sm font-bold transition-all"
                      >
                        Mark Viewed
                      </button>
                    )}
                    <button 
                      onClick={() => deleteMessage(msg.id)}
                      className="flex-1 flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 py-2 px-4 rounded-xl text-sm font-bold transition-all border border-red-500/20"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {messages.length === 0 && !loading && (
            <div className="text-center py-24 bg-zinc-900/30 border border-dashed border-zinc-800 rounded-3xl">
              <Mail className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-zinc-400">No messages yet</h3>
              <p className="text-zinc-600 text-sm">When people contact you, they will appear here.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

import { FormEvent, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import gsap from "gsap";
import { LockKeyhole, Sparkles, ShieldCheck, BrainCircuit, Eye, EyeOff } from "lucide-react";

import api from "../lib/api";

const highlights = [
  "Semantic resume parsing with transformer embeddings",
  "Skill overlap, gap detection, and recruiter insights",
  "Heatmaps and section-level relevance analysis",
];

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const screenRef = useRef<HTMLElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!screenRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".login-reveal",
        { opacity: 0, y: 26 },
        { opacity: 1, y: 0, stagger: 0.1, duration: 0.55, ease: "power2.out" }
      );
    }, screenRef);
    return () => ctx.revert();
  }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (isRegister && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const endpoint = isRegister ? "/auth/register" : "/auth/login";
      const { data } = await api.post(endpoint, { email: email.trim().toLowerCase(), password });
      localStorage.setItem("token", data.access_token);
      navigate("/dashboard");
    } catch (err: any) {
      const status = err?.response?.status;
      const detail = err?.response?.data?.detail;
      const apiBase = (api.defaults.baseURL || "configured backend").toString();
      if (status === 409) {
        setError("Account already exists. Switch to login.");
      } else if (typeof detail === "string") {
        setError(detail);
      } else if (status === 0 || !err?.response) {
        setError(`Cannot reach backend API at ${apiBase}. Ensure FastAPI is running.`);
      } else {
        setError("Authentication failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.main ref={screenRef} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mx-auto max-w-6xl px-4 pb-16 pt-10">
      <div className="grid items-stretch gap-5 lg:grid-cols-[1.1fr,0.9fr]">
        <section className="login-reveal relative overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/70 p-8 shadow-soft md:p-10">
          <div className="absolute -left-24 -top-24 h-64 w-64 rounded-full bg-sky-500/20 blur-3xl" />
          <div className="absolute -bottom-24 right-0 h-64 w-64 rounded-full bg-emerald-500/20 blur-3xl" />
          <div className="relative z-10">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-skyline/30 bg-skyline/10 px-3 py-1 text-xs font-semibold text-sky-200">
              <Sparkles className="h-3.5 w-3.5" /> TALENTALIGN ENTERPRISE
            </div>
            <h1 className="text-3xl font-extrabold text-slate-100 md:text-4xl">AI Hiring Intelligence Platform</h1>
            <p className="mt-3 max-w-lg text-slate-300">
              Professional recruiter workflow for matching resumes against roles with explainable, data-backed scoring.
            </p>

            <div className="mt-7 space-y-3">
              {highlights.map((item) => (
                <div key={item} className="login-reveal flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-3 text-slate-200">
                  <ShieldCheck className="mt-0.5 h-4 w-4 text-emerald-300" />
                  <span className="text-sm">{item}</span>
                </div>
              ))}
            </div>

            <div className="login-reveal mt-6 inline-flex items-center gap-2 rounded-xl bg-skyline/15 px-3 py-2 text-sm text-sky-200">
              <BrainCircuit className="h-4 w-4" /> Engine optimized for recruiter decision velocity
            </div>
          </div>
        </section>

        <form onSubmit={submit} className="login-reveal glass rounded-[2rem] p-8 shadow-soft">
          <div className="mb-6">
            <h2 className="text-3xl font-extrabold">{isRegister ? "Create account" : "Welcome back"}</h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">Secure access to TalentAlign AI dashboard.</p>
          </div>

          <label className="mb-2 block text-sm font-semibold">Email</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            required
            className="input-field mb-4"
            placeholder="you@company.com"
          />

          <label className="mb-2 block text-sm font-semibold">Password</label>
          <div className="relative mb-4">
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type={showPassword ? "text" : "password"}
              minLength={8}
              required
              className="input-field pr-11"
              placeholder="Minimum 8 characters"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {isRegister && (
            <>
              <label className="mb-2 block text-sm font-semibold">Confirm Password</label>
              <input
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                type={showPassword ? "text" : "password"}
                minLength={8}
                required
                className="input-field mb-5"
                placeholder="Re-enter password"
              />
            </>
          )}

          {error && <p className="mb-4 rounded-xl border border-rose-400/30 bg-rose-500/10 p-2 text-sm text-rose-700 dark:text-rose-300">{error}</p>}

          <motion.button
            whileTap={{ scale: 0.97 }}
            whileHover={{ y: -1 }}
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-skyline p-3 font-semibold text-white shadow-lg shadow-skyline/35"
          >
            <LockKeyhole className="h-4 w-4" /> {loading ? "Please wait..." : isRegister ? "Register" : "Login"}
          </motion.button>

          <button type="button" onClick={() => setIsRegister((v) => !v)} className="mt-4 text-sm font-semibold text-skyline">
            {isRegister ? "Already have an account? Login" : "Need an account? Register"}
          </button>
        </form>
      </div>
    </motion.main>
  );
}

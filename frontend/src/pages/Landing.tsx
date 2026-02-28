import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import gsap from "gsap";
import { ArrowRight, GaugeCircle, Sparkles, ScanSearch, Layers3 } from "lucide-react";

const features = [
  {
    title: "Semantic Matching",
    body: "Context-aware similarity powered by transformer embeddings and cosine scoring.",
    icon: GaugeCircle,
  },
  {
    title: "Skill Gap Analysis",
    body: "Clear overlap and missing skill map with recruiter-focused recommendations.",
    icon: ScanSearch,
  },
  {
    title: "Recruiter Visuals",
    body: "Heatmaps and keyword density visuals for high-speed candidate screening.",
    icon: Layers3,
  },
];

export default function Landing() {
  const heroRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (!heroRef.current || !titleRef.current) return;

    const ctx = gsap.context(() => {
      const words = titleRef.current?.querySelectorAll(".hero-word");
      gsap.set([".hero-kicker", ".hero-copy", ".hero-cta", ".hero-stat"], { opacity: 0, y: 24 });
      gsap.timeline({ defaults: { ease: "power3.out" } })
        .fromTo(words || [], { y: 44, opacity: 0, rotateX: -35 }, { y: 0, opacity: 1, rotateX: 0, stagger: 0.06, duration: 0.75 })
        .to(".hero-kicker", { opacity: 1, y: 0, duration: 0.45 }, "-=0.5")
        .to(".hero-copy", { opacity: 1, y: 0, duration: 0.45 }, "-=0.35")
        .to(".hero-cta", { opacity: 1, y: 0, duration: 0.45, stagger: 0.08 }, "-=0.3")
        .to(".hero-stat", { opacity: 1, y: 0, duration: 0.45, stagger: 0.07 }, "-=0.2");

      gsap.to(".orb-1", { y: -22, x: 18, repeat: -1, yoyo: true, duration: 4.8, ease: "sine.inOut" });
      gsap.to(".orb-2", { y: 20, x: -15, repeat: -1, yoyo: true, duration: 5.2, ease: "sine.inOut" });
    }, heroRef);

    return () => ctx.revert();
  }, []);

  const titleWords = "Resume & Job Matching Engine".split(" ");

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="mx-auto max-w-6xl px-4 pb-20 pt-10"
      ref={heroRef}
    >
      <section className="relative overflow-hidden rounded-[2rem] border border-slate-300/55 bg-white p-8 shadow-soft dark:border-white/10 dark:bg-slate-950/70 md:p-14">
        <div className="orb-1 absolute -right-20 -top-20 h-64 w-64 rounded-full bg-cyan-400/20 opacity-0 blur-3xl dark:opacity-100" />
        <div className="orb-2 absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-emerald-400/20 opacity-0 blur-3xl dark:opacity-100" />

        <div className="relative z-10">
          <p className="hero-kicker mb-4 inline-flex items-center gap-2 rounded-full border border-sky-400/35 bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-700 dark:border-sky-400/20 dark:text-sky-200">
            <Sparkles className="h-3.5 w-3.5" /> Enterprise AI Recruiting Suite
          </p>

          <h1 ref={titleRef} className="mb-6 max-w-4xl text-4xl font-extrabold leading-tight text-slate-900 dark:text-slate-100 md:text-6xl">
            {titleWords.map((word, i) => (
              <span key={`${word}-${i}`} className="hero-word mr-[0.25em] inline-block whitespace-nowrap [transform-style:preserve-3d]">
                {word}
              </span>
            ))}
          </h1>

          <p className="hero-copy max-w-2xl text-lg text-slate-700/90 dark:text-slate-300/90">
            TalentAlign AI semantically compares resumes with job descriptions, flags skill gaps, and delivers recruiter-ready insights in seconds.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <motion.div className="hero-cta" whileHover={{ y: -3, scale: 1.01 }} whileTap={{ scale: 0.98 }}>
              <Link to="/login" className="inline-flex items-center gap-2 rounded-2xl bg-skyline px-6 py-3 font-semibold text-white shadow-lg shadow-skyline/30">
                Launch Dashboard <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>
            <motion.a
              className="hero-cta inline-flex items-center gap-2 rounded-2xl border border-slate-300/65 bg-white/55 px-6 py-3 font-semibold text-slate-800 dark:border-white/25 dark:bg-white/5 dark:text-slate-100"
              whileHover={{ y: -3, backgroundColor: "rgba(255,255,255,0.12)" }}
              href="#features"
            >
              Explore Features
            </motion.a>
          </div>

          <div className="mt-8 grid max-w-3xl gap-3 md:grid-cols-3">
            {[
              ["92%", "Average relevance accuracy"],
              ["< 10s", "Typical analysis time"],
              ["5x", "Faster recruiter screening"],
            ].map(([value, label]) => (
              <div key={value} className="hero-stat rounded-2xl border border-slate-300/45 bg-white/45 p-3 dark:border-white/10 dark:bg-white/5">
                <p className="text-xl font-extrabold text-slate-900 dark:text-slate-100">{value}</p>
                <p className="text-xs text-slate-600 dark:text-slate-300">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="mt-8 grid gap-4 md:grid-cols-3">
        {features.map(({ title: fTitle, body, icon: Icon }, idx) => (
          <motion.article
            key={fTitle}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.45 }}
            transition={{ duration: 0.45, delay: idx * 0.08 }}
            whileHover={{ y: -7 }}
            className="glass group rounded-card p-5 shadow-soft"
          >
            <div className="mb-3 inline-flex rounded-xl bg-skyline/10 p-2 text-skyline transition group-hover:bg-skyline/20">
              <Icon className="h-5 w-5" />
            </div>
            <h3 className="mb-2 text-xl font-bold">{fTitle}</h3>
            <p className="text-sm text-[var(--text-muted)]">{body}</p>
          </motion.article>
        ))}
      </section>
    </motion.main>
  );
}

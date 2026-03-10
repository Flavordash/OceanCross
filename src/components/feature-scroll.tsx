"use client";

import { useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";
import Image from "next/image";

const features = [
  {
    title: "Command Center",
    description:
      "Real-time overview of today's events, aircraft status, and quick actions — everything your operation needs at a glance.",
    image: "/features/dashboard.png",
  },
  {
    title: "Smart Scheduling",
    description:
      "Color-coded calendar with weekly and monthly views. Manage flight training, exams, and ground school effortlessly.",
    image: "/features/schedule.png",
  },
  {
    title: "Fleet at a Glance",
    description:
      "Track aircraft registration, type, hours, and maintenance status. Hobbs and Tach time at your fingertips.",
    image: "/features/aircraft.png",
  },
  {
    title: "AI-Powered Booking",
    description:
      "Book flights, check availability, and manage schedules with natural language. Your AI copilot for operations.",
    image: "/features/chat.png",
  },
];

// ── Helpers ─────────────────────────────────────────────

function buildRange(index: number, total: number, t: number) {
  const seg = 1 / total;
  if (index === 0) return [0, seg - t, seg];
  if (index === total - 1) return [index * seg, index * seg + t, 1];
  return [
    index * seg,
    index * seg + t,
    (index + 1) * seg - t,
    (index + 1) * seg,
  ];
}

function buildOutput(
  index: number,
  total: number,
  first: number[],
  middle: number[],
  last: number[],
) {
  if (index === 0) return first;
  if (index === total - 1) return last;
  return middle;
}

// ── Animated Text ───────────────────────────────────────

function AnimatedText({
  index,
  total,
  progress,
  title,
  description,
}: {
  index: number;
  total: number;
  progress: MotionValue<number>;
  title: string;
  description: string;
}) {
  const t = 0.06;
  const range = buildRange(index, total, t);

  const opacity = useTransform(
    progress,
    range,
    buildOutput(index, total, [1, 1, 0], [0, 1, 1, 0], [0, 1, 1]),
  );
  const y = useTransform(
    progress,
    range,
    buildOutput(index, total, [0, 0, -30], [30, 0, 0, -30], [30, 0, 0]),
  );

  return (
    <motion.div
      style={{ opacity, y }}
      className="absolute inset-0 flex flex-col justify-center"
    >
      <span className="text-xs font-semibold tracking-widest text-[#1A6FB5] uppercase mb-3">
        {String(index + 1).padStart(2, "0")} /{" "}
        {String(total).padStart(2, "0")}
      </span>
      <h3 className="text-2xl lg:text-4xl font-bold text-[#0F1B2D] mb-4 leading-tight">
        {title}
      </h3>
      <p className="text-base lg:text-lg text-slate-500 leading-relaxed max-w-md">
        {description}
      </p>
    </motion.div>
  );
}

// ── Animated Image ──────────────────────────────────────

function AnimatedImage({
  index,
  total,
  progress,
  image,
  alt,
}: {
  index: number;
  total: number;
  progress: MotionValue<number>;
  image: string;
  alt: string;
}) {
  const t = 0.06;
  const range = buildRange(index, total, t);

  const opacity = useTransform(
    progress,
    range,
    buildOutput(index, total, [1, 1, 0], [0, 1, 1, 0], [0, 1, 1]),
  );
  const scale = useTransform(
    progress,
    range,
    buildOutput(
      index,
      total,
      [1, 1, 0.92],
      [1.05, 1, 1, 0.92],
      [1.05, 1, 1],
    ),
  );
  const y = useTransform(
    progress,
    range,
    buildOutput(index, total, [0, 0, -20], [50, 0, 0, -20], [50, 0, 0]),
  );

  return (
    <motion.div style={{ opacity, scale, y }} className="absolute inset-0">
      <Image
        src={image}
        alt={alt}
        fill
        className="object-cover object-left-top"
        sizes="(max-width: 1024px) 90vw, 640px"
        priority={index === 0}
      />
    </motion.div>
  );
}

// ── Progress Dot ────────────────────────────────────────

function Dot({
  index,
  total,
  progress,
}: {
  index: number;
  total: number;
  progress: MotionValue<number>;
}) {
  const seg = 1 / total;
  const buf = 0.02;
  const range = buildRange(index, total, buf);

  const width = useTransform(
    progress,
    range,
    buildOutput(index, total, [32, 32, 8], [8, 32, 32, 8], [8, 32, 32]),
  );
  const dotOpacity = useTransform(
    progress,
    range,
    buildOutput(
      index,
      total,
      [1, 1, 0.3],
      [0.3, 1, 1, 0.3],
      [0.3, 1, 1],
    ),
  );

  return (
    <motion.div
      style={{ width, opacity: dotOpacity }}
      className="h-1.5 rounded-full bg-[#1A6FB5]"
    />
  );
}

// ── Main Component ──────────────────────────────────────

export default function FeatureScroll() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  return (
    <section ref={containerRef} className="relative h-[400vh]">
      <div className="sticky top-0 h-screen flex flex-col items-center justify-center py-12 lg:py-16">
        {/* Section header */}
        <div className="text-center mb-8 lg:mb-12 px-4">
          <h2 className="text-3xl lg:text-4xl font-bold text-[#0F1B2D]">
            See It In Action
          </h2>
          <p className="mt-3 text-slate-500 max-w-md mx-auto">
            Powerful tools designed for modern aviation operations.
          </p>
        </div>

        {/* Content grid */}
        <div className="mx-auto max-w-6xl w-full px-4 flex-1 min-h-0">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-12 items-center h-full">
            {/* Text — left 2 cols */}
            <div className="lg:col-span-2 relative h-[160px] lg:h-[220px]">
              {features.map((f, i) => (
                <AnimatedText
                  key={f.title}
                  index={i}
                  total={features.length}
                  progress={scrollYProgress}
                  title={f.title}
                  description={f.description}
                />
              ))}
            </div>

            {/* Image — right 3 cols */}
            <div className="lg:col-span-3 relative aspect-[16/10] rounded-2xl overflow-hidden shadow-2xl shadow-slate-900/10 border border-slate-200/60 bg-slate-100">
              {features.map((f, i) => (
                <AnimatedImage
                  key={f.title}
                  index={i}
                  total={features.length}
                  progress={scrollYProgress}
                  image={f.image}
                  alt={f.title}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Progress dots */}
        <div className="flex items-center gap-1.5 mt-6">
          {features.map((_, i) => (
            <Dot
              key={i}
              index={i}
              total={features.length}
              progress={scrollYProgress}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

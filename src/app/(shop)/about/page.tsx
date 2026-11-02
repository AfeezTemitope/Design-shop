import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "About Afeez" };

const services = ["Flyers", "Logos", "Branding", "Merch", "Motion"];

export default function AboutPage() {
  return (
    <div className="flex flex-col gap-5 px-5 pt-5 md:grid md:grid-cols-[minmax(0,420px)_1fr] md:items-center md:gap-12 md:pt-12">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/afeez.jpg" alt="Afeez, designer at BelzGraphics" className="aspect-[4/5] w-full rounded-[22px] object-cover" />
      <div className="flex flex-col gap-4">
        <h1 className="text-[26px] font-black md:text-4xl">Hi, I&rsquo;m Afeez.</h1>
        <p className="max-w-prose leading-relaxed text-body">
          I&rsquo;m the designer behind BelzGraphics. I make flyers, logos, brand identities, merch and motion content for
          businesses that want to look as good as they really are.
        </p>
        <p className="max-w-prose leading-relaxed text-body">
          I&rsquo;m also a software engineer, so I design the way I write code: clean, intentional, and built to do a job. A
          good design should make people stop scrolling and start asking about your business.
        </p>
        <p className="max-w-prose leading-relaxed text-body">
          Quick flyer for this weekend or a full brand from scratch, you get the same thing from me: clear communication,
          fast delivery, and work you&rsquo;ll be proud to post.
        </p>
        <ul className="flex flex-wrap gap-2">
          {services.map((s) => (
            <li key={s} className="rounded-full bg-brand-soft px-3 py-1.5 text-[13px] font-bold text-brand-dark">{s}</li>
          ))}
        </ul>
        <Link href="/" className="mt-2 self-start rounded-2xl bg-brand px-6 py-3.5 font-extrabold text-white">
          Browse designs
        </Link>
      </div>
    </div>
  );
}

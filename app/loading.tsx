import Image from "next/image";
import trimQLogo from "./TrimQ.png";

export default function Loading() {
  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center px-4 py-8 text-center sm:px-6">
      <Image
        src={trimQLogo}
        alt="TrimQ"
        priority
        className="h-[min(46vh,440px)] w-auto max-w-[92vw] object-contain"
      />

      <p className="mt-4 text-lg font-extrabold tracking-[0.08em] text-slate-900 sm:text-2xl">
        TrimQ
      </p>
      <p className="mt-1 text-sm text-slate-600 sm:text-base">Loading...</p>

      <div className="mt-5 h-2 w-[min(72vw,360px)] overflow-hidden rounded-full bg-slate-200">
        <span className="block h-full w-1/2 animate-pulse rounded-full bg-accent" />
      </div>
    </main>
  );
}

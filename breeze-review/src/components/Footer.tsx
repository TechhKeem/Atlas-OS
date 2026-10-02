import Link from "next/link";
import { site } from "@/config/site";

export default function Footer() {
  return (
    <footer className="bg-footer-gradient text-slate-200">
      <div className="mx-auto max-w-5xl space-y-3 px-4 py-8 text-sm">
        <p className="font-display text-lg font-extrabold text-white">{site.tagline}</p>
        <p className="text-slate-300">{site.licensingDisclosure}</p>
        <nav className="flex gap-5 font-semibold text-white" aria-label="Legal">
          <Link href="/privacy" className="underline-offset-4 hover:underline">Privacy Policy</Link>
          <Link href="/terms" className="underline-offset-4 hover:underline">Terms of Use</Link>
        </nav>
        <p className="text-xs text-slate-300">&copy; {new Date().getFullYear()} {site.parentBrand}. {site.productName} is an educational tool, not a quote, offer, or licensed advice.</p>
      </div>
    </footer>
  );
}

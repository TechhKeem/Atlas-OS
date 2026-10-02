import Link from "next/link";
import BrandMark from "./BrandMark";

export default function Header() {
  return (
    <header className="border-b border-slate-100 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" aria-label="Breeze Review home"><BrandMark /></Link>
      </div>
    </header>
  );
}

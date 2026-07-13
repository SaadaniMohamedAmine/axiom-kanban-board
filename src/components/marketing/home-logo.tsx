"use client";

import Link from "next/link";

export function HomeLogo() {
  return (
    <Link
      href="/"
      onClick={(e) => {
        if (window.location.pathname === "/") {
          e.preventDefault();
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      }}
      className="text-[15px] font-semibold text-primary tracking-tighter cursor-pointer"
    >
      Axiom
    </Link>
  );
}

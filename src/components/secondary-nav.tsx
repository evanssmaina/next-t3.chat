"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export interface NavLink {
  name: string;
  href: string;
}

interface SecondaryNavProps {
  links: NavLink[];
  className?: string;
  layoutId?: string;
}

export function SecondaryNav({
  links,
  className = "",
  layoutId = "secondary-nav-underline",
}: SecondaryNavProps) {
  const pathname = usePathname();

  return (
    <nav className={` border-gray-200 border-b ${className}`}>
      <ul className="flex gap-4">
        {links.map((link) => {
          const isActive =
            pathname === link.href || pathname.startsWith(`${link.href}/`);

          return (
            <li key={link.href}>
              <Link
                href={link.href}
                prefetch={true}
                className={`relative inline-block px-2 py-3 text-sm transition-colors font-medium ${
                  isActive
                    ? "font-medium text-white"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                {link.name}
                {isActive && (
                  <motion.div
                    layoutId={layoutId}
                    className="absolute right-0 bottom-0 left-0 h-1 bg-primary rounded-full"
                    initial={false}
                    transition={{
                      duration: 0.2,
                      ease: "easeOut",
                    }}
                  />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

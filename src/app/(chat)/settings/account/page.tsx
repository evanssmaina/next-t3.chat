"use client";

import { Icons } from "@/components/icons";
import { getClerkComponentAppearance } from "@/utils/clerk-utils";
import { UserProfile } from "@clerk/nextjs";
import { motion } from "motion/react";

export const FADE_ANIMATION = {
  initial: { opacity: 0, y: 1 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: "easeInOut" },
} as const;

export default function AccountsPage() {
  const clerkAppearance = getClerkComponentAppearance();

  return (
    <div className="flex flex-col gap-8 pb-16">
      <motion.div className="flex flex-col gap-5 " {...FADE_ANIMATION}>
        <UserProfile
          fallback={<Icons.loader className="animate-spin" />}
          appearance={clerkAppearance}
        >
          <UserProfile.Page label="account" />
          <UserProfile.Page label="security" />

          <div className="border-none shadow-none">
            <h1 className="text-foreground mb-6 mt-10 text-xl font-semibold">
              Security
            </h1>

            <UserProfile.Page label="security" />
            <UserProfile.Page label="account" />
          </div>
        </UserProfile>
      </motion.div>
    </div>
  );
}

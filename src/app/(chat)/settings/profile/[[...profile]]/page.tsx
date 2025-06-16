"use client";

import { Icons } from "@/components/icons";
import { FADE_ANIMATION } from "@/utils/animation";
import { getClerkComponentAppearance } from "@/utils/clerk-utils";
import { UserProfile } from "@clerk/nextjs";
import { motion } from "motion/react";

export default function Profile() {
  const clerkApparance = getClerkComponentAppearance();

  return (
    <div className="flex flex-col gap-8 pb-16">
      <motion.div className="flex flex-col gap-5 " {...FADE_ANIMATION}>
        <UserProfile
          fallback={<Icons.loader className="animate-spin" />}
          appearance={clerkApparance}
          routing="path"
          path="/settings/profile"
        >
          <UserProfile.Page label="account" />
          <UserProfile.Page label="security" />
        </UserProfile>
      </motion.div>
    </div>
  );
}

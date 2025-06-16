"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import { AnimatePresence, motion } from "motion/react";

export function InitialState() {
  const { userId } = useAuth();
  const { user } = useUser();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{
          duration: 0.8,
          ease: "easeOut",
        }}
        className="mx-auto max-w-3xl w-full  text-center  mb-10 space-y-5"
      >
        <h1 className="text-3xl">
          {userId ? `Hi ${user?.firstName}, how are you?` : "Hi, how are you?"}
        </h1>
      </motion.div>
    </AnimatePresence>
  );
}

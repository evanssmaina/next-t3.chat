import { SecondaryNav } from "@/components/secondary-nav";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "settings",
};

export default function SettingsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const links = [
    {
      name: "Profile",
      href: "/settings/profile",
    },
    {
      name: "Security",
      href: "/settings/security",
    },
  ];

  return (
    <div className="flex flex-col gap-5 mt-20 w-full max-w-3xl mx-auto">
      <div className="flex flex-col gap-3">
        <h1 className="text-3xl font-medium">Settings</h1>
      </div>
      <SecondaryNav links={links} />
      {children}
    </div>
  );
}

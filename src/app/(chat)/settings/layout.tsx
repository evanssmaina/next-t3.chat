import { SecondaryNav } from "@/components/secondary-nav";

export default function SettingsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const links = [
    {
      name: "Account",
      href: "/settings/account",
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

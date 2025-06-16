export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-col ">
      <div className="min-h-screen w-full flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}

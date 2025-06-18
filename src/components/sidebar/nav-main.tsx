"use client";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import type { LucideProps } from "lucide-react";
import Link from "next/link";
import type { ForwardRefExoticComponent, RefAttributes } from "react";

type NavMainProps = {
  isActive: (item: any) => boolean;
  items: {
    title: string;
    url: string;
    segment: string;
    icon: ForwardRefExoticComponent<
      Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>
    >;
  }[];
};

export function NavMain({ isActive, items }: NavMainProps) {
  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu className="space-y-2 gap-0">
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                tooltip={item.title}
                isActive={isActive(item.segment)}
              >
                <Link href={item.url} prefetch={true}>
                  {item.icon && (
                    <item.icon className="h-[18px] w-[18px] shrink-0" />
                  )}
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

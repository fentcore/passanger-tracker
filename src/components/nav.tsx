"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  Users,
  MapPinned,
  MoreHorizontal,
  MessageSquareText,
  Map,
  DollarSign,
  History,
  Archive,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useState } from "react";
import { PwaInstallButton } from "@/components/pwa-install-button";

const LINKS_PRINCIPALES = [
  { href: "/", label: "Agenda", icon: CalendarDays },
  { href: "/pasajeros", label: "Pasajeros", icon: Users },
  { href: "/barrios", label: "Barrios", icon: MapPinned },
];

const LINKS_MAS = [
  { href: "/copys", label: "Copys", icon: MessageSquareText },
  { href: "/mapa", label: "Mapa", icon: Map },
  { href: "/precios", label: "Precios y tarifas", icon: DollarSign },
  { href: "/historial", label: "Historial de cambios", icon: History },
  { href: "/archivados", label: "Archivados", icon: Archive },
];

const TODOS_LOS_LINKS = [...LINKS_PRINCIPALES, ...LINKS_MAS];

const HREFS_SECUNDARIOS = ["/historial", "/archivados"];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

export function BottomNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const enMas = LINKS_MAS.some((l) => isActive(pathname, l.href));

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 pb-[env(safe-area-inset-bottom)]">
      <ul className="grid grid-cols-4">
        {LINKS_PRINCIPALES.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 py-2.5 text-xs font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                <Icon className="size-6" />
                {label}
              </Link>
            </li>
          );
        })}
        <li>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              render={
                <button
                  type="button"
                  className={cn(
                    "flex w-full flex-col items-center justify-center gap-0.5 py-2.5 text-xs font-medium transition-colors",
                    enMas ? "text-primary" : "text-muted-foreground"
                  )}
                />
              }
            >
              <MoreHorizontal className="size-6" />
              Más
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-2xl">
              <SheetHeader>
                <SheetTitle>Más secciones</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-1 px-4 pb-4">
                {LINKS_MAS.map(({ href, label, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors",
                      isActive(pathname, href)
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-accent"
                    )}
                  >
                    <Icon className="size-5" />
                    {label}
                  </Link>
                ))}
                <PwaInstallButton />
              </div>
            </SheetContent>
          </Sheet>
        </li>
      </ul>
    </nav>
  );
}

export function TopNav() {
  const pathname = usePathname();
  return (
    <nav className="hidden md:flex flex-wrap items-center gap-1.5">
      {TODOS_LOS_LINKS.map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href);
        const secundario = HREFS_SECUNDARIOS.includes(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-full font-medium transition-colors",
              secundario ? "px-2.5 py-1 text-xs" : "px-4 py-2.5 text-base",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <Icon className={secundario ? "size-3.5" : "size-5"} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

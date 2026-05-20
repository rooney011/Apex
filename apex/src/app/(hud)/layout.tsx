import { CommandPalette } from "@/components/hud/command-palette";
import { Sidebar } from "@/components/hud/sidebar";
import { Splash } from "@/components/hud/splash";
import { ToastHost } from "@/components/hud/toast";
import { Topbar } from "@/components/hud/topbar";

export default function HudLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Splash />
      <ToastHost />
      <CommandPalette />
      {/* Mobile: page scrolls naturally so the Chrome URL bar doesn't fight a
         fixed-height layout. md+: the HUD reclaims its fixed-height shell with
         an internal scroll container for main. */}
      <div className="flex w-full min-h-dvh md:h-dvh md:overflow-hidden">
        <Sidebar />
        <div className="flex flex-1 flex-col min-w-0">
          <Topbar />
          <main className="flex-1 min-w-0 md:overflow-y-auto">{children}</main>
          <footer
            className="shrink-0 border-t border-apex-border bg-apex-surface/60 backdrop-blur flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-2 md:h-7 md:py-0"
            style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
          >
            <p className="label-mono">APEX_OS // 0.1.0</p>
            <p className="label-mono hidden sm:block">
              DATA · FASTF1 · OPENF1 · JOLPICA
            </p>
            <p className="label-mono flex items-center gap-1.5">
              <span>BUILT_BY</span>
              <a
                href="https://github.com/rooney011"
                target="_blank"
                rel="noopener noreferrer"
                className="text-apex-red hover:text-foreground transition-colors"
              >
                ANEESH
              </a>
              <span className="hidden sm:inline">· © 2026</span>
            </p>
          </footer>
        </div>
      </div>
    </>
  );
}

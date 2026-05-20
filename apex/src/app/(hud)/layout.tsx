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
      <div className="flex h-dvh w-full overflow-hidden">
        <Sidebar />
        <div className="flex flex-1 flex-col min-w-0">
          <Topbar />
          <main className="flex-1 min-w-0 overflow-y-auto">{children}</main>
          <footer className="h-7 shrink-0 border-t border-apex-border bg-apex-surface/60 backdrop-blur flex items-center justify-between px-4">
            <p className="label-mono">APEX_OS // 0.1.0</p>
            <p className="label-mono">DATA · FASTF1 · OPENF1 · JOLPICA</p>
            <p className="label-mono">© 2026 APEX</p>
          </footer>
        </div>
      </div>
    </>
  );
}

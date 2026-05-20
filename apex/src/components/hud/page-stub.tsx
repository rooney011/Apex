import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/* Reusable placeholder block — every route in Phase 0 uses this so the
   shell can be navigated end-to-end before the real content lands. */
type PageStubProps = {
  kicker: string;
  title: string;
  description: string;
  icon: LucideIcon;
  comingIn?: string;
  className?: string;
};

export function PageStub({
  kicker,
  title,
  description,
  icon: Icon,
  comingIn,
  className,
}: PageStubProps) {
  return (
    <section
      className={cn(
        "relative grid place-items-center min-h-full p-8 grid-overlay",
        className,
      )}
    >
      <div className="panel relative w-full max-w-2xl p-10">
        <div
          className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-apex-red to-transparent"
          aria-hidden
        />
        <div className="flex items-start gap-5">
          <div className="rounded-md border border-apex-border bg-apex-bg p-3">
            <Icon className="size-6 text-apex-red" strokeWidth={1.6} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="label-mono text-apex-red">{kicker}</p>
            <h1 className="font-sans text-2xl font-bold tracking-tight mt-2">
              {title}
            </h1>
            <p className="font-serif text-[15px] leading-relaxed text-foreground/80 mt-3">
              {description}
            </p>
            {comingIn && (
              <div className="mt-6 flex items-center gap-2">
                <span className="label-mono">STATUS</span>
                <span className="font-mono text-[11px] tracking-wider rounded border border-apex-border bg-apex-bg px-2 py-1 text-apex-amber">
                  {comingIn}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

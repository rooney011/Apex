"use client";

import { AlertTriangle } from "lucide-react";
import Image from "next/image";
import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = { children: ReactNode };
type State = { hasError: boolean; message: string };

/* If the WebGL context dies or the GLB fails to parse, we don't want the
   hero to blank out. Falls back to a static photo (which we already have)
   and a small mono diagnostic note. */
export class SceneErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: "" };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message || "render_error" };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.warn("HeroScene crashed, falling back to static:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="absolute inset-0 overflow-hidden">
          <Image
            src="/photos/06_silverstone_aerial.png"
            alt="Silverstone aerial"
            fill
            sizes="100vw"
            priority
            className="object-cover opacity-80"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 60% 40% at 50% 50%, rgba(255,24,1,0.15), transparent 70%), linear-gradient(180deg, rgba(6,6,10,0.45), rgba(6,6,10,0.9))",
            }}
          />
          <div className="absolute left-4 bottom-4 panel px-3 py-2 flex items-center gap-2 max-w-md">
            <AlertTriangle className="size-3.5 text-apex-amber shrink-0" strokeWidth={1.8} />
            <p className="label-mono !text-[10px]">
              3D_PIPELINE_FALLBACK · STATIC_RENDER · {this.state.message}
            </p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

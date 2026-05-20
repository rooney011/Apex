"use client";

import type { RenderParams } from "@/lib/canvas/params";

export type SharePayload = {
  lapId: string;
  params: RenderParams;
};

/* base64-URL safe; no padding. Short enough for share links of ~250 chars. */
function b64UrlEncode(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  const b64 =
    typeof btoa !== "undefined"
      ? btoa(bin)
      : Buffer.from(bin, "binary").toString("base64");
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64UrlDecode(encoded: string): string {
  const padded =
    encoded.replace(/-/g, "+").replace(/_/g, "/") +
    "===".slice(0, (4 - (encoded.length % 4)) % 4);
  const bin =
    typeof atob !== "undefined"
      ? atob(padded)
      : Buffer.from(padded, "base64").toString("binary");
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

export function encodeShare(payload: SharePayload): string {
  return b64UrlEncode(JSON.stringify(payload));
}

export function decodeShare(encoded: string): SharePayload | null {
  try {
    const json = b64UrlDecode(encoded);
    const parsed = JSON.parse(json);
    if (
      parsed &&
      typeof parsed === "object" &&
      typeof parsed.lapId === "string" &&
      typeof parsed.params === "object"
    ) {
      return parsed as SharePayload;
    }
    return null;
  } catch {
    return null;
  }
}

export function buildShareUrl(payload: SharePayload): string {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}/canvas#p=${encodeShare(payload)}`;
}

/* Read the current URL hash for #p=<encoded>, returning the payload + a
   cleanup function that strips the hash so the browser URL stays clean. */
export function consumeHashPayload(): SharePayload | null {
  if (typeof window === "undefined") return null;
  const hash = window.location.hash;
  const m = hash.match(/^#p=(.+)$/);
  if (!m) return null;
  const payload = decodeShare(m[1]);
  if (payload) {
    try {
      window.history.replaceState(null, "", window.location.pathname);
    } catch {
      /* best-effort */
    }
  }
  return payload;
}

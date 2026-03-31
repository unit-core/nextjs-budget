"use server";

import { cookies } from "next/headers";
import { type Locale, locales, defaultLocale, localeDirection } from "./config";

export async function setLocale(locale: Locale) {
  if (!locales.includes(locale)) return;

  const cookieStore = await cookies();
  cookieStore.set("locale", locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: "lax",
  });

  // Auto-set direction based on locale
  cookieStore.set("direction", localeDirection[locale], {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}

export async function setDirection(direction: "ltr" | "rtl") {
  const cookieStore = await cookies();
  cookieStore.set("direction", direction, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}

export async function getDirection(): Promise<"ltr" | "rtl"> {
  const cookieStore = await cookies();
  const dir = cookieStore.get("direction")?.value;
  if (dir === "rtl" || dir === "ltr") return dir;

  const locale = (cookieStore.get("locale")?.value as Locale) || defaultLocale;
  return localeDirection[locale] ?? "ltr";
}

export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const locale = cookieStore.get("locale")?.value as Locale;
  return locales.includes(locale) ? locale : defaultLocale;
}

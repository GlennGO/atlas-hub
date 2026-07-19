import { notFound } from "next/navigation";

const locales = ["es", "en"] as const;
type Locale = (typeof locales)[number];

export default locales;
export type { Locale };

// Default locale — Spanish (Mexico/LatAm market first)
export const defaultLocale: Locale = "es";

export function getLocale(pathname: string): Locale {
  const segment = pathname.split("/")[1];
  if (locales.includes(segment as Locale)) {
    return segment as Locale;
  }
  return defaultLocale;
}

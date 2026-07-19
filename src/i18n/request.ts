import { getRequestConfig } from "next-intl/server";
import { defaultLocale } from "./config";

export default getRequestConfig(async ({ locale }) => {
  return {
    messages: (await import(`../messages/${locale ?? defaultLocale}.json`))
      .default,
  };
});

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  environment:
    process.env.NEXT_PUBLIC_VERCEL_ENV ||
    process.env.NODE_ENV ||
    "development",

  enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),

  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.15 : 1.0,

  beforeSend(event) {
    const message =
      event.message ||
      event.exception?.values?.map((item) => item.value).join(" ") ||
      "";

    if (
      /WASM_OR_WORKER_NOT_READY|Error unloading krisp processor|Meeting has ended/i.test(
        message,
      )
    ) {
      return null;
    }

    return event;
  },
});

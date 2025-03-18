import * as Sentry from "@sentry/node";

// This will generate an exception and send it to Sentry
try {
  console.log("Testing Sentry integration...");
  // Intentional error
  nonExistentFunction();
} catch (e) {
  console.error("Caught an error and sending to Sentry:", e.message);
  Sentry.captureException(e);

  // Wait a bit for the event to be sent before exiting
  setTimeout(() => {
    console.log("Test complete. Check your Sentry dashboard for the error.");
    process.exit(0);
  }, 2000);
}

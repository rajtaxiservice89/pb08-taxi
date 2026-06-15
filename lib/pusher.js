import PusherServer from 'pusher';
import PusherClient from 'pusher-js';

// Server instance (for API routes)
export const pusherServer = new PusherServer({
  appId: process.env.PUSHER_APP_ID || "1800000", // Fallback dummy to prevent crash
  key: process.env.NEXT_PUBLIC_PUSHER_KEY || "dummy",
  secret: process.env.PUSHER_SECRET || "dummy",
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "ap2",
  useTLS: true,
});

// Client instantiation function (for React components)
// We export a function so it only runs on the client-side
export const getPusherClient = () => {
  if (typeof window !== 'undefined') {
    // Prevent multiple instances
    if (!window.pusherClientInstance) {
      window.pusherClientInstance = new PusherClient(
        process.env.NEXT_PUBLIC_PUSHER_KEY || "dummy",
        {
          cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "ap2",
        }
      );
    }
    return window.pusherClientInstance;
  }
  return null;
};

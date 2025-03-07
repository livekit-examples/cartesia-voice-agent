import {
  LiveKitRoom,
  RoomAudioRenderer,
  StartAudio,
} from "@livekit/components-react";
import { AnimatePresence, motion } from "framer-motion";
import Head from "next/head";
import { useCallback, useState } from "react";

import Assistant from "@/components/Assistant";
import { PlaygroundToast, ToastType } from "@/components/toast/PlaygroundToast";
import { ConnectionProvider, useConnection } from "@/hooks/useConnection";

export default function Home() {
  return (
    <ConnectionProvider>
      <HomeInner />
    </ConnectionProvider>
  );
}

export function HomeInner() {
  const [toastMessage, setToastMessage] = useState<{
    message: string;
    type: ToastType;
  } | null>(null);
  const { shouldConnect, wsUrl, token, connect, disconnect } = useConnection();

  const title = "LiveKit Voice Agent with Cartesia";
  const description =
    "This is a demo of a LiveKit Voice Pipeline Agent using Cartesia and GPT-4o-mini.";

  const handleConnect = useCallback(
    async (c: boolean) => {
      c ? connect() : disconnect();
    },
    [connect, disconnect]
  );

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="og:title" content={title} />
        <meta name="og:description" content={description} />
        <meta
          property="og:image"
          content="https://cartesia-assistant.vercel.app/og.png"
        />
        <meta name="twitter:site" content="@LiveKit"></meta>
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta
          property="twitter:image"
          content="https://cartesia-assistant.vercel.app/og.png"
        />
        <meta property="twitter:image:width" content="1600" />
        <meta property="twitter:image:height" content="836" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
        />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black" />
        <meta property="og:image:width" content="1600" />
        <meta property="og:image:height" content="836" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main
        className={`relative flex overflow-x-hidden flex-col justify-center items-center h-full w-full bg-background repeating-square-background`}
      >
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              className="left-0 right-0 top-0 absolute z-10"
              initial={{ opacity: 0, translateY: -50 }}
              animate={{ opacity: 1, translateY: 0 }}
              exit={{ opacity: 0, translateY: -50 }}
            >
              <PlaygroundToast
                message={toastMessage.message}
                type={toastMessage.type}
                onDismiss={() => {
                  setToastMessage(null);
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
        <LiveKitRoom
          className="flex flex-col h-full w-full"
          serverUrl={wsUrl}
          token={token}
          connect={shouldConnect}
          onError={(e) => {
            setToastMessage({ message: e.message, type: "error" });
            console.error(e);
          }}
        >
          <Assistant
            title={title}
            logo={<img src="/cartesia-logo.svg" alt="Cartesia logo" />}
            onConnect={handleConnect}
          />
          <RoomAudioRenderer />
          <StartAudio label="Click to enable audio playback" />
        </LiveKitRoom>
      </main>
    </>
  );
}

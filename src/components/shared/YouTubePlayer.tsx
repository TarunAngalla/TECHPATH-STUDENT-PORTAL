"use client";

import Script from "next/script";
import { useEffect, useId, useRef } from "react";

type YTPlayer = {
  destroy: () => void;
};

type YTNamespace = {
  Player: new (
    elementId: string,
    config: {
      videoId: string;
      width?: string | number;
      height?: string | number;
      playerVars?: Record<string, number | string>;
      events?: {
        onStateChange?: (event: { data: number }) => void;
      };
    },
  ) => YTPlayer;
  PlayerState: { ENDED: number };
};

declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

const readyWaiters: Array<() => void> = [];

function flushReadyWaiters() {
  readyWaiters.splice(0).forEach((fn) => fn());
}

function whenYouTubeApiReady(cb: () => void) {
  if (typeof window !== "undefined" && window.YT?.Player) {
    cb();
    return;
  }
  readyWaiters.push(cb);
  if (typeof window !== "undefined" && !window.onYouTubeIframeAPIReady) {
    window.onYouTubeIframeAPIReady = () => {
      flushReadyWaiters();
    };
  }
}

export function YouTubePlayer({
  videoId,
  onEnded,
  className,
}: {
  videoId: string;
  onEnded?: () => void;
  className?: string;
}) {
  const reactId = useId().replace(/:/g, "");
  const elementId = `yt-player-${reactId}`;
  const playerRef = useRef<YTPlayer | null>(null);
  const onEndedRef = useRef(onEnded);
  const endedFiredRef = useRef(false);
  onEndedRef.current = onEnded;

  useEffect(() => {
    endedFiredRef.current = false;
    let cancelled = false;

    const mount = () => {
      if (cancelled || !window.YT?.Player) return;
      playerRef.current?.destroy();
      playerRef.current = new window.YT.Player(elementId, {
        videoId,
        width: "100%",
        height: "100%",
        playerVars: {
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
          enablejsapi: 1,
        },
        events: {
          onStateChange: (event) => {
            if (event.data === window.YT!.PlayerState.ENDED && !endedFiredRef.current) {
              endedFiredRef.current = true;
              onEndedRef.current?.();
            }
          },
        },
      });
    };

    whenYouTubeApiReady(mount);

    return () => {
      cancelled = true;
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [elementId, videoId]);

  return (
    <>
      <Script
        src="https://www.youtube.com/iframe_api"
        strategy="afterInteractive"
        onReady={() => {
          if (window.YT?.Player) flushReadyWaiters();
        }}
      />
      <div className={className}>
        <div id={elementId} className="absolute inset-0 h-full w-full" />
      </div>
    </>
  );
}

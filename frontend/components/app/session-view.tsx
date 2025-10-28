'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { AppConfig } from '@/app-config';
import { ChatTranscript } from '@/components/app/chat-transcript';
import { PreConnectMessage } from '@/components/app/preconnect-message';
import { TileLayout } from '@/components/app/tile-layout';
import { VoiceSelector, AVAILABLE_AGENT_VOICES } from '@/components/app/voice-selector';
import {
  AgentControlBar,
  type ControlBarControls,
} from '@/components/livekit/agent-control-bar/agent-control-bar';
import { useChatMessages } from '@/hooks/useChatMessages';
import { useConnectionTimeout } from '@/hooks/useConnectionTimout';
import { useDebugMode } from '@/hooks/useDebug';
import { cn } from '@/lib/utils';
import { ScrollArea } from '../livekit/scroll-area/scroll-area';

const MotionBottom = motion.create('div');
const MotionVoicePanel = motion.create('aside');
const MotionOverlay = motion.create('div');
const MotionOverlayContent = motion.create('div');

const IN_DEVELOPMENT = process.env.NODE_ENV !== 'production';
const VOICE_PANEL_DESKTOP_WIDTH = 320;
const VOICE_PANEL_TRANSITION = {
  type: 'spring',
  stiffness: 260,
  damping: 28,
};
const MOBILE_VOICE_PANEL_TRANSITION = {
  type: 'spring',
  stiffness: 280,
  damping: 30,
};
const BOTTOM_VIEW_MOTION_PROPS = {
  variants: {
    visible: {
      opacity: 1,
      translateY: '0%',
    },
    hidden: {
      opacity: 0,
      translateY: '100%',
    },
  },
  initial: 'hidden',
  animate: 'visible',
  exit: 'hidden',
  transition: {
    duration: 0.3,
    delay: 0.5,
    ease: 'easeOut',
  },
};

interface FadeProps {
  top?: boolean;
  bottom?: boolean;
  className?: string;
}

export function Fade({ top = false, bottom = false, className }: FadeProps) {
  return (
    <div
      className={cn(
        'from-background pointer-events-none h-4 bg-linear-to-b to-transparent',
        top && 'bg-linear-to-b',
        bottom && 'bg-linear-to-t',
        className
      )}
    />
  );
}
interface SessionViewProps {
  appConfig: AppConfig;
}

export const SessionView = ({
  appConfig,
  ...props
}: React.ComponentProps<'section'> & SessionViewProps) => {
  useConnectionTimeout(200_000);
  useDebugMode({ enabled: IN_DEVELOPMENT });

  const messages = useChatMessages();
  const [chatOpen, setChatOpen] = useState(false);
  const [isVoicePanelOpen, setIsVoicePanelOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const hasAutoOpenedVoicePanel = useRef(false);

  const hasVoices = AVAILABLE_AGENT_VOICES.length > 0;

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia('(min-width: 768px)');

    const updateMatches = (matches: boolean) => {
      setIsDesktop(matches);
    };

    updateMatches(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      updateMatches(event.matches);
    };

    try {
      mediaQuery.addEventListener('change', handleChange);
    } catch {
      mediaQuery.addListener(handleChange);
    }

    return () => {
      try {
        mediaQuery.removeEventListener('change', handleChange);
      } catch {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);

  useEffect(() => {
    if (!hasVoices) {
      setIsVoicePanelOpen(false);
      hasAutoOpenedVoicePanel.current = false;
      return;
    }

    if (isDesktop && !hasAutoOpenedVoicePanel.current) {
      setIsVoicePanelOpen(true);
      hasAutoOpenedVoicePanel.current = true;
    }
  }, [hasVoices, isDesktop]);

  const desktopVoicePanelWidth =
    isDesktop && isVoicePanelOpen && hasVoices ? VOICE_PANEL_DESKTOP_WIDTH : 0;
  const bottomRightOffset = desktopVoicePanelWidth ? desktopVoicePanelWidth + 48 : 0;

  const handleVoicePanelToggle = useCallback(
    (open: boolean) => {
      if (!hasVoices) {
        setIsVoicePanelOpen(false);
        return;
      }
      setIsVoicePanelOpen(open);
    },
    [hasVoices]
  );

  const closeVoicePanel = useCallback(() => {
    setIsVoicePanelOpen(false);
  }, []);

  const handleVoiceSelected = useCallback(() => {
    if (!isDesktop) {
      closeVoicePanel();
    }
  }, [closeVoicePanel, isDesktop]);

  const isMobileVoicePanelVisible = !isDesktop && isVoicePanelOpen && hasVoices;

  const controls: ControlBarControls = {
    leave: true,
    microphone: true,
    chat: appConfig.supportsChatInput,
    camera: appConfig.supportsVideoInput,
    screenShare: appConfig.supportsVideoInput,
    voices: hasVoices,
  };

  return (
    <section className="bg-background relative z-10 h-full w-full overflow-hidden" {...props}>
      <div className="relative flex h-full w-full">
        <div className="relative flex-1">
          {/* Chat Transcript */}
          <div
            className={cn(
              'fixed inset-0 grid grid-cols-1 grid-rows-1',
              !chatOpen && 'pointer-events-none'
            )}
            style={{ right: desktopVoicePanelWidth, transition: 'right 0.4s ease' }}
          >
            <Fade top className="absolute inset-x-4 top-0 h-40" />
            <ScrollArea className="px-4 pt-40 pb-[150px] md:px-6 md:pb-[180px]">
              <ChatTranscript
                hidden={!chatOpen}
                messages={messages}
                className="mx-auto max-w-2xl space-y-3 transition-opacity duration-300 ease-out"
              />
            </ScrollArea>
          </div>

          {/* Tile Layout */}
          <TileLayout chatOpen={chatOpen} voicePanelWidth={desktopVoicePanelWidth} />

          {/* Bottom */}
          <MotionBottom
            {...BOTTOM_VIEW_MOTION_PROPS}
            className="fixed inset-x-3 bottom-0 z-50 md:inset-x-12"
            style={{ right: bottomRightOffset, transition: 'right 0.4s ease' }}
          >
            {appConfig.isPreConnectBufferEnabled && (
              <PreConnectMessage messages={messages} className="pb-4" />
            )}
            <div className="bg-background relative mx-auto max-w-2xl pb-3 md:pb-12">
              <Fade bottom className="absolute inset-x-0 top-0 h-4 -translate-y-full" />
              <AgentControlBar
                controls={controls}
                onChatOpenChange={setChatOpen}
                voicePanelOpen={isVoicePanelOpen}
                voicesAvailable={hasVoices}
                onVoicePanelToggle={handleVoicePanelToggle}
              />
            </div>
          </MotionBottom>
        </div>

        <AnimatePresence initial={false}>
          {isDesktop && hasVoices && isVoicePanelOpen && (
            <MotionVoicePanel
              key="voice-drawer-desktop"
              initial={{ x: VOICE_PANEL_DESKTOP_WIDTH, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: VOICE_PANEL_DESKTOP_WIDTH, opacity: 0 }}
              transition={VOICE_PANEL_TRANSITION}
              className="border-input/40 bg-background/80 supports-[backdrop-filter]:bg-background/60 hidden h-full w-[320px] shrink-0 flex-col border-l backdrop-blur md:flex"
            >
              <VoiceSelector className="h-full" onVoiceSelected={handleVoiceSelected} />
            </MotionVoicePanel>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {isMobileVoicePanelVisible && (
          <MotionOverlay
            key="voice-drawer-mobile"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-background/95 supports-[backdrop-filter]:bg-background/70 fixed inset-0 z-50 flex flex-col p-4"
          >
            <MotionOverlayContent
              initial={{ y: 32, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 32, opacity: 0 }}
              transition={MOBILE_VOICE_PANEL_TRANSITION}
              className="border-input/40 bg-background h-full rounded-3xl border shadow-lg"
            >
              <VoiceSelector
                className="h-full"
                onClose={closeVoicePanel}
                onVoiceSelected={handleVoiceSelected}
                showCloseButton
              />
            </MotionOverlayContent>
          </MotionOverlay>
        )}
      </AnimatePresence>
    </section>
  );
};

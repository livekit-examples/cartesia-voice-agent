'use client';

import { type ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ParticipantEvent } from 'livekit-client';
import { useLocalParticipant, useVoiceAssistant } from '@livekit/components-react';
import { XIcon } from '@phosphor-icons/react/dist/ssr';
import { Button } from '@/components/livekit/button';
import { ScrollArea } from '@/components/livekit/scroll-area/scroll-area';
import { cn } from '@/lib/utils';

export interface AgentVoice {
  id: string;
  name: string;
  description: string | undefined;
  [key: string]: unknown;
}

interface VoiceSelectorProps {
  className?: string;
  onClose?: () => void;
  onVoiceSelected?: () => void;
  showCloseButton?: boolean;
}

export function parseAgentVoices(rawVoices?: string | null): AgentVoice[] {
  if (!rawVoices) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawVoices);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((voice) => {
        if (typeof voice !== 'object' || voice === null) {
          return undefined;
        }

        const id = String((voice as Record<string, unknown>).id ?? '');
        const name = String((voice as Record<string, unknown>).name ?? '');

        if (!id || !name) {
          return undefined;
        }

        return {
          id,
          name,
          description:
            typeof (voice as Record<string, unknown>).description === 'string'
              ? ((voice as Record<string, unknown>).description as string)
              : undefined,
        } satisfies AgentVoice;
      })
      .filter((voice): voice is AgentVoice => !!voice);
  } catch (error) {
    console.warn('Unable to parse agent voices attribute', error);
    return [];
  }
}

export function VoiceSelector({
  className,
  onClose,
  onVoiceSelected,
  showCloseButton = false,
}: VoiceSelectorProps) {
  const { agent, agentAttributes } = useVoiceAssistant();
  const { localParticipant } = useLocalParticipant();

  const [selectedVoiceId, setSelectedVoiceId] = useState<string>('');
  const [voiceSpeed, setVoiceSpeed] = useState<number>(0);
  const pendingVoiceSpeedRef = useRef<number | null>(null);
  const lastSyncedVoiceSpeedRef = useRef<number>(0);
  const voiceSpeedDebounceTimer = useRef<NodeJS.Timeout | null>(null);

  const voices = useMemo<AgentVoice[]>(
    () => parseAgentVoices(agentAttributes?.voices),
    [agentAttributes?.voices]
  );

  useEffect(() => {
    if (!localParticipant) {
      setSelectedVoiceId('');
      setVoiceSpeed(0);
      pendingVoiceSpeedRef.current = null;
      lastSyncedVoiceSpeedRef.current = 0;
      return;
    }

    const updateFromAttributes = () => {
      const attributes = localParticipant.attributes ?? {};
      const currentVoice = attributes.voice ?? '';
      setSelectedVoiceId(currentVoice);

      const speed = parseFloat(attributes.voice_speed ?? '0');
      const sanitizedSpeed = Number.isFinite(speed) ? Math.max(-1, Math.min(1, speed)) : 0;
      setVoiceSpeed(sanitizedSpeed);
      lastSyncedVoiceSpeedRef.current = sanitizedSpeed;
    };

    updateFromAttributes();

    localParticipant.on(ParticipantEvent.AttributesChanged, updateFromAttributes);

    return () => {
      localParticipant.off(ParticipantEvent.AttributesChanged, updateFromAttributes);
    };
  }, [localParticipant]);

  const handleVoiceSelect = useCallback(
    async (voiceId: string) => {
      if (!localParticipant) {
        return;
      }

      setSelectedVoiceId(voiceId);

      try {
        const currentAttributes = localParticipant.attributes ?? {};
        await localParticipant.setAttributes({
          ...currentAttributes,
          voice: voiceId,
        });
        onVoiceSelected?.();
      } catch (error) {
        console.error('Failed to update participant voice attribute', error);
      }
    },
    [localParticipant, onVoiceSelected]
  );

  const handleVoiceSpeedChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const rawValue = Number.parseFloat(event.target.value);
    if (!Number.isFinite(rawValue)) {
      return;
    }

    const nextValue = Math.max(-1, Math.min(1, rawValue));
    setVoiceSpeed(nextValue);
    pendingVoiceSpeedRef.current = nextValue;
  }, []);

  useEffect(() => {
    if (!localParticipant || pendingVoiceSpeedRef.current === null) {
      return;
    }

    if (voiceSpeedDebounceTimer.current) {
      clearTimeout(voiceSpeedDebounceTimer.current);
    }

    voiceSpeedDebounceTimer.current = setTimeout(async () => {
      if (!localParticipant) {
        return;
      }

      const valueToSync = pendingVoiceSpeedRef.current;

      if (valueToSync === null) {
        return;
      }

      const roundedValue = Number(valueToSync.toFixed(2));

      if (Math.abs(roundedValue - lastSyncedVoiceSpeedRef.current) < 0.0001) {
        pendingVoiceSpeedRef.current = null;
        return;
      }

      try {
        const currentAttributes = localParticipant.attributes ?? {};
        await localParticipant.setAttributes({
          ...currentAttributes,
          voice_speed: roundedValue.toFixed(2),
        });
        lastSyncedVoiceSpeedRef.current = roundedValue;
      } catch (error) {
        console.error('Failed to update participant voice speed attribute', error);
      } finally {
        pendingVoiceSpeedRef.current = null;
      }
    }, 1000);

    return () => {
      if (voiceSpeedDebounceTimer.current) {
        clearTimeout(voiceSpeedDebounceTimer.current);
      }
    };
  }, [localParticipant, voiceSpeed]);

  const hasAgent = agent !== undefined;
  const hasVoices = voices.length > 0;
  const formattedVoiceSpeed = voiceSpeed.toFixed(2);
  const sliderDisabled = !localParticipant || !hasAgent;

  return (
    <div className={cn('flex h-full w-full flex-col', className)}>
      <div className="flex items-center justify-between px-4 pt-16 pb-4 md:pt-24">
        <div>
          <p className="text-muted-foreground text-xs font-semibold tracking-[0.2em] uppercase">
            Voices
          </p>
          <p className="text-muted-foreground/70 mt-1 text-xs">Choose how your assistant sounds.</p>
        </div>
        {showCloseButton && (
          <Button size="icon" variant="ghost" aria-label="Close voice selection" onClick={onClose}>
            <XIcon weight="bold" />
          </Button>
        )}
      </div>

      <div className="px-4 pb-4">
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-[11px] font-semibold tracking-[0.2em] uppercase">
            Voice Speed
          </p>
          <span className="text-foreground font-mono text-xs">{formattedVoiceSpeed}</span>
        </div>
        <div className="mt-3 flex flex-col gap-1">
          <input
            type="range"
            min={-1}
            max={1}
            step={0.05}
            value={voiceSpeed}
            onChange={handleVoiceSpeedChange}
            disabled={sliderDisabled}
            className={cn(
              'accent-foreground bg-muted h-2 w-full appearance-none rounded-full',
              'disabled:opacity-50'
            )}
            aria-label="Adjust voice speed"
            aria-valuemin={-1}
            aria-valuemax={1}
            aria-valuenow={voiceSpeed}
            aria-valuetext={formattedVoiceSpeed}
          />
          <div className="text-muted-foreground flex justify-between font-mono text-[10px] uppercase">
            <span>-1.0</span>
            <span>0.0</span>
            <span>1.0</span>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 px-3 pb-6">
        <div className="flex flex-col gap-1">
          {!hasAgent && (
            <p className="text-muted-foreground px-3 py-8 text-sm">
              Connect to an agent to see available voices.
            </p>
          )}

          {hasAgent && !hasVoices && (
            <p className="text-muted-foreground px-3 py-8 text-sm">
              This agent has not published any alternative voices yet.
            </p>
          )}

          {hasAgent &&
            hasVoices &&
            voices.map((voice) => {
              const isSelected = selectedVoiceId === voice.id;

              return (
                <button
                  key={voice.id}
                  type="button"
                  onClick={() => handleVoiceSelect(voice.id)}
                  className={cn(
                    'text-foreground bg-muted/30 hover:bg-muted/60 focus-visible:ring-ring/50 focus-visible:ring-[3px]',
                    'flex w-full flex-col gap-1 rounded-xl px-4 py-3 text-left transition-colors duration-200',
                    'font-mono text-sm tracking-wide uppercase',
                    isSelected && 'bg-foreground text-background hover:bg-foreground'
                  )}
                >
                  <span>{voice.name}</span>
                  {voice.description && !isSelected && (
                    <span className="text-muted-foreground font-sans text-[11px] leading-snug normal-case">
                      {voice.description}
                    </span>
                  )}
                </button>
              );
            })}
        </div>
      </ScrollArea>
    </div>
  );
}

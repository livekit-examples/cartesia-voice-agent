'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
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
  const { agentAttributes } = useVoiceAssistant();
  const { localParticipant } = useLocalParticipant();

  const rawVoices = agentAttributes?.voices ?? null;
  const voices = useMemo<AgentVoice[]>(() => parseAgentVoices(rawVoices), [rawVoices]);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>('');

  useEffect(() => {
    if (!localParticipant) {
      setSelectedVoiceId('');
      return;
    }

    const updateFromAttributes = () => {
      const attributes = localParticipant.attributes ?? {};
      const currentVoice = attributes.voice ?? '';
      setSelectedVoiceId(currentVoice);
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

  const hasVoices = voices.length > 0;
  const containerClasses = cn('flex h-full w-full flex-col justify-start', className);

  return (
    <div className={containerClasses}>
      <div className="flex items-center justify-between px-4 pt-0 pb-2 md:pt-0">
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

      <ScrollArea className="flex-1 px-3 pb-6">
        <div className="flex flex-col gap-1">
          {!hasVoices && (
            <p className="text-muted-foreground px-3 py-8 text-sm">
              No alternative voices are available.
            </p>
          )}

          {hasVoices &&
            voices.map((voice) => {
              const isSelected = selectedVoiceId === voice.id;
              const displayName = voice.name.includes(' - ')
                ? voice.name.split(' - ')[0]?.trim() ?? voice.name
                : voice.name;

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
                  <span>{displayName}</span>
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

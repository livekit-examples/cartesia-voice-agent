'use client';

import { useCallback, useEffect, useState } from 'react';
import { ParticipantEvent } from 'livekit-client';
import { useLocalParticipant } from '@livekit/components-react';
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

export const AVAILABLE_AGENT_VOICES: AgentVoice[] = [
  { id: '0834f3df-e650-4766-a20c-5a93a43aa6e3', name: 'Leo', description: undefined },
  { id: '6776173b-fd72-460d-89b3-d85812ee518d', name: 'Jace', description: undefined },
  { id: 'c961b81c-a935-4c17-bfb3-ba2239de8c2f', name: 'Kyle', description: undefined },
  { id: 'f4a3a8e4-694c-4c45-9ca0-27caf97901b5', name: 'Gavin', description: undefined },
  { id: 'cbaf8084-f009-4838-a096-07ee2e6612b1', name: 'Maya', description: undefined },
  { id: '6ccbfb76-1fc6-48f7-b71d-91ac6298247b', name: 'Tessa', description: undefined },
  { id: 'cc00e582-ed66-4004-8336-0175b85c85f6', name: 'Dana', description: undefined },
  { id: '26403c37-80c1-4a1a-8692-540551ca2ae5', name: 'Marian', description: undefined },
];

export function VoiceSelector({
  className,
  onClose,
  onVoiceSelected,
  showCloseButton = false,
}: VoiceSelectorProps) {
  const { localParticipant } = useLocalParticipant();

  const voices = AVAILABLE_AGENT_VOICES;
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

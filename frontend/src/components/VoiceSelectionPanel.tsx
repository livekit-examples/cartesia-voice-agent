import { Voice } from "./Assistant";

type VoiceSelectionPanelProps = {
  isAgentConnected: boolean;
  voices: Voice[];
  currentVoiceId: string;
  onSelectVoice: (voiceId: string) => void;
};

export function VoiceSelectionPanel({
  isAgentConnected,
  voices,
  currentVoiceId,
  onSelectVoice,
}: VoiceSelectionPanelProps) {
  return (
    <div className="flex flex-col h-full w-full items-start">
      {isAgentConnected && voices && voices.length > 0 && (
        <div className="w-full text-foreground py-4 relative">
          <div className="sticky bg-background py-2 top-0 flex flex-row justify-between items-center px-4 text-xs uppercase tracking-wider">
            <h3 className="font-mono font-semibold text-sm">Voices</h3>
          </div>
          <div className="px-4 py-2 text-xs text-foreground leading-normal">
            <div className={"flex flex-col text-left h-full"}>
              {voices.map((voice) => (
                <button
                  onClick={() => {
                    onSelectVoice(voice.id);
                  }}
                  className={`w-full text-left px-3 py-2 font-mono text-lg md:text-sm ${
                    voice.id === currentVoiceId
                      ? "bg-foreground text-background"
                      : "hover:bg-white/10"
                  }`}
                  key={voice.id}
                >
                  {voice.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

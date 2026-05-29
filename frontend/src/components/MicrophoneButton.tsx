import { TrackToggle, useLocalParticipant } from "@livekit/components-react";
import { Track } from "livekit-client";
import { DeviceSelector } from "./DeviceSelector";
import { MicrophoneOffSVG, MicrophoneOnSVG } from "./ui/icons";
import { AgentMultibandAudioVisualizer } from "./visualization/AgentMultibandAudioVisualizer";

type MicrophoneButtonProps = {
  localMultibandVolume: Float32Array[];
};
export const MicrophoneButton = ({
  localMultibandVolume,
}: MicrophoneButtonProps) => {
  const localParticipant = useLocalParticipant();
  const isMuted = localParticipant.isMicrophoneEnabled === false;

  return (
    <div className="flex flex-row  medium font-mono uppercase border-foreground bg-transparent text-foreground hover:bg-white/10 text-sm font-semibold transition-all border ease-out duration-250 items-center justify-center">
      <TrackToggle
        source={Track.Source.Microphone}
        className={
          "flex items-center justify-center gap-2 h-full py-2 pl-2 " +
          (isMuted ? "opacity-50" : "")
        }
        showIcon={false}
      >
        {isMuted ? <MicrophoneOffSVG /> : <MicrophoneOnSVG />}
        <AgentMultibandAudioVisualizer
          state="speaking"
          barWidth={3}
          minBarHeight={2}
          maxBarHeight={16}
          frequencies={localMultibandVolume}
          gap={2}
        />
        <div className="w-0.5 bg-white/20 h-4 ml-0.5"></div>
      </TrackToggle>
      <DeviceSelector kind="audioinput" />
    </div>
  );
};

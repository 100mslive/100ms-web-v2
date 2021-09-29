import React from "react";
import {
  Header,
  ParticipantList,
  useHMSStore,
  VolumeIcon,
  LogoButton,
  Text,
  selectDominantSpeaker,
  selectPeerSharingAudio,
  selectScreenShareAudioByPeerID,
  useHMSActions,
  RecordingDot,
  GlobeIcon,
  selectRecordingState,
} from "@100mslive/hms-video-react";

const SpeakerTag = () => {
  const dominantSpeaker = useHMSStore(selectDominantSpeaker);
  return dominantSpeaker && dominantSpeaker.name ? (
    <div className="self-center focus:outline-none text-lg flex items-center">
      <VolumeIcon />
      <Text
        variant="body"
        size="md"
        classes={{ root: "truncate max-w-xs ml-1 flex-1" }}
        title={dominantSpeaker.name}
      >
        {dominantSpeaker.name}
      </Text>
    </div>
  ) : (
    <></>
  );
};

const Music = () => {
  const hmsActions = useHMSActions();
  const peer = useHMSStore(selectPeerSharingAudio);
  const track = useHMSStore(selectScreenShareAudioByPeerID(peer?.id));
  if (!peer || !track) {
    return null;
  }
  // Don't show mute option if remote peer has disabled
  if (!peer.isLocal && !track.enabled) {
    return null;
  }
  const muted = peer.isLocal ? !track.enabled : track.volume === 0;

  const handleMute = () => {
    if (!peer.isLocal) {
      hmsActions.setVolume(!track.volume ? 100 : 0, track.id);
    } else {
      hmsActions.setEnabledTrack(track.id, !track.enabled);
    }
  };

  return (
    <div className="flex items-center">
      <VolumeIcon />
      <Text variant="body" size="md" classes={{ root: "mx-2" }}>
        Music is playing
      </Text>
      <Text
        variant="body"
        size="md"
        onClick={handleMute}
        classes={{ root: "text-red-tint cursor-pointer" }}
      >
        {muted ? "Unmute" : "Mute"}
      </Text>
    </div>
  );
};

const Recording = () => {
  const recording = useHMSStore(selectRecordingState);
  const hmsActions = useHMSActions();

  if (!recording.browser.running && !recording.rtmp.running) {
    return null;
  }

  return (
    <div className="flex mx-2">
      {recording.browser.running && (
        <div className="flex items-center">
          <RecordingDot
            className="fill-current text-red-600"
            width="20"
            height="20"
          />
          <Text variant="body" size="md" classes={{ root: "mx-1" }}>
            Recording
          </Text>
          <Text
            variant="body"
            size="md"
            onClick={() => hmsActions.stopRTMPAndRecording()}
            classes={{ root: "text-red-tint cursor-pointer" }}
          >
            stop
          </Text>
        </div>
      )}
      {recording.rtmp.running && (
        <div className="flex items-center mx-2">
          <GlobeIcon className="fill-current text-red-600" />
          <Text variant="body" size="md" classes={{ root: "mx-1" }}>
            Streaming
          </Text>
          <Text
            variant="body"
            size="md"
            onClick={() => hmsActions.stopRTMPAndRecording()}
            classes={{ root: "text-red-tint cursor-pointer" }}
          >
            stop
          </Text>
        </div>
      )}
    </div>
  );
};

export const ConferenceHeader = ({ onParticipantListOpen }) => {
  return (
    <>
      <Header
        leftComponents={[
          <LogoButton key={0} />,
          <Music key={1} />,
          <Recording key={2} />,
        ]}
        centerComponents={[<SpeakerTag key={0} />]}
        rightComponents={[
          <ParticipantList key={0} onToggle={onParticipantListOpen} />,
        ]}
        classes={{ root: "h-full" }}
      />
    </>
  );
};

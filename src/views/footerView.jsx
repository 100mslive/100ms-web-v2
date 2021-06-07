import {
  useHMSStore,
  ControlBar,
  HangUpIcon,
  Button,
  ShareScreenIcon,
  ChatIcon,
  ChatUnreadIcon,
  VerticalDivider,
  useHMSActions,
  selectIsLocalScreenShared,
  selectIsLocalAudioEnabled,
  selectIsLocalVideoDisplayEnabled,
  selectUnreadHMSMessagesCount,
} from "@100mslive/hms-video-react";
import { useContext, useCallback } from "react";
import { AppContext } from "../store/AppContext";
import { useHistory, useParams } from "react-router-dom";
import { Settings } from "@100mslive/hms-video-react";

const SettingsView = () => {
  const hmsActions = useHMSActions();
  const {
    loginInfo: { selectedAudioInput, selectedVideoInput },
    setLoginInfo,
    setMaxTileCount,
  } = useContext(AppContext);

  const onChange = ({
    maxTileCount: newMaxTileCount,
    selectedVideoInput: newSelectedVideoInput,
    selectedAudioInput: newSelectedAudioInput,
  }) => {
    setMaxTileCount(newMaxTileCount);
    if (selectedAudioInput !== newSelectedAudioInput) {
      hmsActions.setAudioSettings({ deviceId: newSelectedAudioInput });
      setLoginInfo({ selectedAudioInput: newSelectedAudioInput });
    }

    if (selectedVideoInput !== newSelectedVideoInput) {
      hmsActions.setVideoSettings({ deviceId: newSelectedVideoInput });
      setLoginInfo({ selectedVideoInput: newSelectedVideoInput });
    }
  };
  return (
    <>
      <Settings onChange={onChange} />
    </>
  );
};

export const ConferenceFooter = ({ isChatOpen, toggleChat }) => {
  const isScreenShared = useHMSStore(selectIsLocalScreenShared);
  const isLocalAudioEnabled = useHMSStore(selectIsLocalAudioEnabled);
  const isLocalVideoEnabled = useHMSStore(selectIsLocalVideoDisplayEnabled);
  const countUnreadMessages = useHMSStore(selectUnreadHMSMessagesCount);
  const hmsActions = useHMSActions();
  const { isConnected, leave } = useContext(AppContext);
  const history = useHistory();
  const params = useParams();

  const toggleScreenShare = useCallback(() => {
    hmsActions.setScreenShareEnabled(!isScreenShared);
  }, [hmsActions, isScreenShared]);

  return (
    <>
      {isConnected && (
        <ControlBar
          leftComponents={[
            <SettingsView key={0} />,
            <VerticalDivider key={1} />,
            <Button
              key={2}
              iconOnly
              variant={"no-fill"}
              iconSize="md"
              shape={"rectangle"}
              onClick={toggleScreenShare}
            >
              <ShareScreenIcon />
            </Button>,
            <VerticalDivider key={3} />,
            <Button
              key={4}
              iconOnly
              variant={"no-fill"}
              iconSize="md"
              shape={"rectangle"}
              onClick={toggleChat}
              active={isChatOpen}
            >
              {countUnreadMessages === 0 ? <ChatIcon /> : <ChatUnreadIcon />}
            </Button>,
          ]}
          rightComponents={[
            <Button
              key={0}
              size="md"
              shape={"rectangle"}
              variant={"danger"}
              onClick={() => {
                leave();
                history.push("/leave/" + params.roomId + "/" + params.role);
              }}
            >
              <HangUpIcon className="mr-2" />
              Leave room
            </Button>,
          ]}
          audioButtonOnClick={() =>
            hmsActions.setLocalAudioEnabled(!isLocalAudioEnabled)
          }
          videoButtonOnClick={() =>
            hmsActions.setLocalVideoEnabled(!isLocalVideoEnabled)
          }
          isAudioMuted={!isLocalAudioEnabled}
          isVideoMuted={!isLocalVideoEnabled}
        />
      )}
    </>
  );
};

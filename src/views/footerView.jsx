import React, {
  useState,
  useCallback,
  useContext,
  useRef,
  Fragment,
} from "react";
import {
  useHMSStore,
  ControlBar,
  ContextMenu,
  ContextMenuItem,
  HangUpIcon,
  MicOffIcon,
  MicOnIcon,
  CamOffIcon,
  CamOnIcon,
  VirtualBackgroundIcon,
  NoiseSupressionIcon,
  Button,
  ShareScreenIcon,
  ChatIcon,
  ChatUnreadIcon,
  MusicIcon,
  VerticalDivider,
  MessageModal,
  useHMSActions,
  selectIsLocalScreenShared,
  selectIsLocalAudioEnabled,
  selectIsLocalVideoDisplayEnabled,
  selectUnreadHMSMessagesCount,
  isMobileDevice,
  selectIsAllowedToPublish,
  selectIsLocalVideoPluginPresent,
  selectIsLocalAudioPluginPresent,
  selectPermissions,
  selectLocalPeer,
  selectScreenSharesByPeerId,
  Text,
} from "@100mslive/hms-video-react";
import { useHistory, useParams } from "react-router-dom";
import { HMSVirtualBackgroundPlugin } from "@100mslive/hms-virtual-background";
import { HMSNoiseSuppressionPlugin } from "@100mslive/hms-noise-suppression";
import { AppContext } from "../store/AppContext";
import { getRandomVirtualBackground } from "../common/utils";
import { MoreSettings } from "./components/MoreSettings";

export const ConferenceFooter = ({ isChatOpen, toggleChat }) => {
  const isScreenShared = useHMSStore(selectIsLocalScreenShared);
  const localPeer = useHMSStore(selectLocalPeer);
  const { video, audio } = useHMSStore(
    selectScreenSharesByPeerId(localPeer?.id)
  );
  const isLocalAudioEnabled = useHMSStore(selectIsLocalAudioEnabled);
  const isLocalVideoEnabled = useHMSStore(selectIsLocalVideoDisplayEnabled);
  const countUnreadMessages = useHMSStore(selectUnreadHMSMessagesCount);
  const isVBPresent = useHMSStore(
    selectIsLocalVideoPluginPresent("@100mslive/hms-virtual-background")
  );
  const hmsActions = useHMSActions();
  const { isConnected, leave } = useContext(AppContext);
  const history = useHistory();
  const params = useParams();
  const pluginRef = useRef(null);
  const audiopluginRef = useRef(null);
  const isAllowedToPublish = useHMSStore(selectIsAllowedToPublish);
  const permissions = useHMSStore(selectPermissions);
  const [showEndRoomModal, setShowEndRoomModal] = useState(false);
  const [shareAudioModal, setShareAudioModal] = useState(false);
  const [lockRoom, setLockRoom] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const isNoiseSuppression = useHMSStore(
    selectIsLocalAudioPluginPresent("@100mslive/hms-noise-suppression")
  );
  const initialModalProps = {
    show: false,
    title: "",
    body: "",
  };
  const [errorModal, setErrorModal] = useState(initialModalProps);

  function createNoiseSuppresionPlugin() {
    if (!audiopluginRef.current) {
      audiopluginRef.current = new HMSNoiseSuppressionPlugin();
    }
  }

  async function addNoiseSuppressionPlugin() {
    createNoiseSuppresionPlugin();

    audiopluginRef.current.setNoiseSuppression(!isNoiseSuppression);
    await hmsActions.addPluginToAudioTrack(audiopluginRef.current);
  }
  //
  async function removeNoiseSuppressionPlugin() {
    if (audiopluginRef.current) {
      await hmsActions.removePluginFromAudioTrack(audiopluginRef.current);
      audiopluginRef.current = null;
    }
  }

  function createVBPlugin() {
    if (!pluginRef.current) {
      pluginRef.current = new HMSVirtualBackgroundPlugin("none");
    }
  }

  async function startPlugin() {
    //create plugin if not present
    createVBPlugin();
    await pluginRef.current.setBackground(getRandomVirtualBackground());
    //Running VB on every alternate frame rate for optimized cpu usage
    await hmsActions.addPluginToVideoTrack(pluginRef.current, 15);
  }

  async function removePlugin() {
    if (pluginRef.current) {
      await hmsActions.removePluginFromVideoTrack(pluginRef.current);
      pluginRef.current = null;
    }
  }

  function handleVirtualBackground() {
    isVBPresent ? removePlugin() : startPlugin();
  }

  function handleNoiseSuppression() {
    isNoiseSuppression
      ? removeNoiseSuppressionPlugin()
      : addNoiseSuppressionPlugin();
  }

  const toggleAudio = useCallback(async () => {
    try {
      await hmsActions.setLocalAudioEnabled(!isLocalAudioEnabled);
    } catch (err) {
      console.error("Cannot toggle audio", err);
    }
  }, [hmsActions, isLocalAudioEnabled]);

  const toggleVideo = useCallback(async () => {
    try {
      await hmsActions.setLocalVideoEnabled(!isLocalVideoEnabled);
    } catch (err) {
      console.error("Cannot toggle video", err);
    }
  }, [hmsActions, isLocalVideoEnabled]);

  const toggleScreenShare = useCallback(
    async (enable, audioOnly = false) => {
      try {
        await hmsActions.setScreenShareEnabled(enable, audioOnly);
      } catch (error) {
        if (
          error.description &&
          error.description.includes("denied by system")
        ) {
          setErrorModal({
            show: true,
            title: "Screen share permission denied by OS",
            body: "Please update your OS settings to permit screen share.",
          });
        } else if (error.message && error.message.includes("share audio")) {
          // when share audio not selected with audioOnly screenshare
          setErrorModal({
            show: true,
            title: "Screenshare error",
            body: error.message,
          });
        } else if (
          error.message &&
          error.message === "Cannot share multiple screens"
        ) {
          // when share audio not selected with audioOnly screenshare
          setErrorModal({
            show: true,
            title: "Screenshare error",
            body: error.message,
          });
        }
      }
    },
    [hmsActions]
  );

  function leaveRoom() {
    leave();
    if (params.role) {
      history.push("/leave/" + params.roomId + "/" + params.role);
    } else {
      history.push("/leave/" + params.roomId);
    }
  }

  const leftComponents = [];
  const isAudioScreenshare = !video && !!audio;

  if (!isMobileDevice()) {
    //creating VB button for only web
    createVBPlugin();
    createNoiseSuppresionPlugin();
    if (isAllowedToPublish.screen) {
      leftComponents.push(
        <Button
          key="shareAudio"
          iconOnly
          variant="no-fill"
          iconSize="md"
          shape="rectangle"
          active={isAudioScreenshare}
          onClick={() => {
            if (!isAudioScreenshare) {
              setShareAudioModal(true);
            } else {
              toggleScreenShare(false, true);
            }
          }}
        >
          <MusicIcon />
        </Button>,
        <VerticalDivider key="audioShareDivider" />
      );
    }
    leftComponents.push(
      <Button
        key="chat"
        iconOnly
        variant="no-fill"
        iconSize="md"
        shape="rectangle"
        onClick={toggleChat}
        active={isChatOpen}
      >
        {countUnreadMessages === 0 ? <ChatIcon /> : <ChatUnreadIcon />}
      </Button>
    );
  }

  const isPublishing = isAllowedToPublish.video || isAllowedToPublish.audio;

  return isConnected ? (
    <>
      <ControlBar
        leftComponents={leftComponents}
        centerComponents={[
          isAllowedToPublish.audio ? (
            <Button
              iconOnly
              variant="no-fill"
              iconSize="md"
              classes={{ root: "mx-2" }}
              shape="rectangle"
              active={!isLocalAudioEnabled}
              onClick={toggleAudio}
              key="toggleAudio"
            >
              {!isLocalAudioEnabled ? <MicOffIcon /> : <MicOnIcon />}
            </Button>
          ) : null,
          isAllowedToPublish.video ? (
            <Button
              iconOnly
              variant="no-fill"
              iconSize="md"
              classes={{ root: "mx-2" }}
              shape="rectangle"
              active={!isLocalVideoEnabled}
              onClick={toggleVideo}
              key="toggleVideo"
            >
              {!isLocalVideoEnabled ? <CamOffIcon /> : <CamOnIcon />}
            </Button>
          ) : null,
          isAllowedToPublish.screen && !isMobileDevice() ? (
            <Button
              key="toggleScreenShare"
              iconOnly
              variant="no-fill"
              iconSize="md"
              shape="rectangle"
              classes={{ root: "mx-2" }}
              onClick={() => toggleScreenShare(!isScreenShared)}
            >
              <ShareScreenIcon />
            </Button>
          ) : null,
          isAllowedToPublish.video && pluginRef.current?.isSupported() ? (
            <Button
              iconOnly
              variant="no-fill"
              shape="rectangle"
              active={isVBPresent}
              onClick={handleVirtualBackground}
              classes={{ root: "mx-2" }}
              key="VB"
            >
              <VirtualBackgroundIcon />
            </Button>
          ) : null,
          isAllowedToPublish.audio && audiopluginRef.current?.isSupported() ? (
            <Button
              iconOnly
              variant="no-fill"
              shape="rectangle"
              active={isNoiseSuppression}
              onClick={handleNoiseSuppression}
              key="noiseSuppression"
            >
              <NoiseSupressionIcon />
            </Button>
          ) : null,
          isPublishing && (
            <span key="SettingsLeftSpace" className="mx-2 md:mx-3"></span>
          ),
          isPublishing && <VerticalDivider key="SettingsDivider" />,
          isPublishing && (
            <span key="SettingsRightSpace" className="mx-2 md:mx-3"></span>
          ),
          <MoreSettings key="MoreSettings" />,
        ]}
        rightComponents={[
          <ContextMenu
            classes={{
              trigger: "w-auto h-auto",
              root: "static",
              menu: "w-56 bg-white dark:bg-gray-100",
              menuItem: "hover:bg-transparent-0 dark:hover:bg-transparent-0",
            }}
            onTrigger={value => {
              if (permissions?.endRoom) {
                setShowMenu(value);
              } else {
                leaveRoom();
              }
            }}
            menuOpen={showMenu}
            key="LeaveAction"
            trigger={
              <Button
                size="md"
                shape="rectangle"
                variant="danger"
                iconOnly={isMobileDevice()}
                active={isMobileDevice()}
                key="LeaveRoom"
              >
                <HangUpIcon className={isMobileDevice() ? "" : "mr-2"} />
                {isMobileDevice() ? "" : "Leave room"}
              </Button>
            }
            menuProps={{
              anchorOrigin: {
                vertical: "top",
                horizontal: "center",
              },
              transformOrigin: {
                vertical: 136,
                horizontal: "center",
              },
            }}
          >
            <ContextMenuItem
              label="Leave Room"
              key="leaveRoom"
              classes={{
                menuTitleContainer: "hidden",
                menuItemChildren: "my-1 w-full overflow-hidden",
              }}
            >
              <Button
                shape="rectangle"
                variant="standard"
                classes={{ root: "w-full" }}
                onClick={() => {
                  leaveRoom();
                }}
              >
                Leave without ending room
              </Button>
            </ContextMenuItem>

            {permissions?.endRoom && (
              <ContextMenuItem
                label="End Room"
                key="endRoom"
                classes={{
                  menuTitleContainer: "hidden",
                  menuItemChildren: "my-1 w-full",
                }}
              >
                <Button
                  shape="rectangle"
                  variant="danger"
                  classes={{ root: "w-full" }}
                  onClick={() => {
                    setShowEndRoomModal(true);
                  }}
                >
                  End Room for all
                </Button>
              </ContextMenuItem>
            )}
          </ContextMenu>,
        ]}
        audioButtonOnClick={toggleAudio}
        videoButtonOnClick={toggleVideo}
        backgroundButtonOnClick={handleVirtualBackground}
        isAudioMuted={!isLocalAudioEnabled}
        isVideoMuted={!isLocalVideoEnabled}
        isBackgroundEnabled={isVBPresent}
      />
      <MessageModal
        {...errorModal}
        onClose={() => setErrorModal(initialModalProps)}
      />
      <MessageModal
        show={showEndRoomModal}
        onClose={() => {
          setShowEndRoomModal(false);
          setLockRoom(false);
        }}
        title="End Room"
        body="Are you sure you want to end the room?"
        footer={
          <div className="flex">
            <div className="flex items-center">
              <label className="text-base dark:text-white text-gray-100">
                <input
                  type="checkbox"
                  className="mr-1"
                  onChange={() => setLockRoom(prev => !prev)}
                  checked={lockRoom}
                />
                <span>Lock room</span>
              </label>
            </div>
            <Button
              classes={{ root: "mr-3 ml-3" }}
              onClick={() => {
                setShowEndRoomModal(false);
                setLockRoom(false);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                hmsActions.endRoom(lockRoom, "End Room");
                leaveRoom();
              }}
            >
              End Room
            </Button>
          </div>
        }
      />
      <MessageModal
        show={shareAudioModal}
        onClose={() => {
          setShareAudioModal(false);
        }}
        title="How to play music"
        body={
          <>
            <Text variant="body" size="sm">
              To share your music, select ‘Chrome Tab’ option in the share
              screen window, then select the tab in which music will be played,
              then click the ‘Share audio’ button and click the ‘Share’ button
              on the right to start sharing your music.
            </Text>
            <img
              src="./share-audio.gif"
              alt="select ‘Chrome Tab’ option in the share screen
          window, then click the ‘Share audio’ button"
            ></img>
          </>
        }
        footer={
          <Button
            variant="emphasized"
            onClick={() => {
              toggleScreenShare(!isAudioScreenshare, true);
            }}
          >
            Continue
          </Button>
        }
        classes={{ footer: "justify-center" }}
      />
    </>
  ) : null;
};

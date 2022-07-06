import React, { useEffect, useContext, Suspense } from "react";
import {
  useHMSStore,
  useHMSActions,
  selectPeerSharingAudio,
  selectPeerScreenSharing,
  selectPeerSharingVideoPlaylist,
  selectLocalPeerRoleName,
  selectIsConnectedToRoom,
} from "@100mslive/react-sdk";
import { Flex } from "@100mslive/react-ui";
import { MainGridView } from "./mainGridView";
import SidePane from "./SidePane";
import { AppContext } from "../components/context/AppContext";
import FullPageProgress from "../components/FullPageProgress";
import ScreenShareView from "./screenShareView";
import { useUISettings } from "../components/AppData/useUISettings";
import { useBeamAutoLeave } from "../common/hooks";
import { useWhiteboardMetadata } from "../plugins/whiteboard";
import { UI_MODE_ACTIVE_SPEAKER, UI_SETTINGS } from "../common/constants";

const WhiteboardView = React.lazy(() => import("./WhiteboardView"));
const HLSView = React.lazy(() => import("./HLSView"));
const ActiveSpeakerView = React.lazy(() => import("./ActiveSpeakerView"));

export const ConferenceMainView = () => {
  const localPeerRole = useHMSStore(selectLocalPeerRoleName);
  const peerSharing = useHMSStore(selectPeerScreenSharing);
  const peerSharingAudio = useHMSStore(selectPeerSharingAudio);
  const peerSharingPlaylist = useHMSStore(selectPeerSharingVideoPlaylist);
  const isAudioOnly = useUISettings(UI_SETTINGS.isAudioOnly);
  const { whiteboardOwner: whiteboardShared } = useWhiteboardMetadata();
  const isConnected = useHMSStore(selectIsConnectedToRoom);
  useBeamAutoLeave();
  const hmsActions = useHMSActions();
  const {
    audioPlaylist,
    videoPlaylist,
    uiViewMode,
    HLS_VIEWER_ROLE,
    showStatsOnTiles,
  } = useContext(AppContext);

  useEffect(() => {
    if (!isConnected) {
      return;
    }
    if (videoPlaylist.length > 0) {
      hmsActions.videoPlaylist.setList(videoPlaylist);
    }
    if (audioPlaylist.length > 0) {
      hmsActions.audioPlaylist.setList(audioPlaylist);
    }
  }, [isConnected, videoPlaylist, audioPlaylist, hmsActions]);

  if (!localPeerRole) {
    // we don't know the role yet to decide how to render UI
    return null;
  }

  let ViewComponent;
  if (localPeerRole === HLS_VIEWER_ROLE) {
    ViewComponent = HLSView;
  } else if (whiteboardShared) {
    ViewComponent = WhiteboardView;
  } else if (
    ((peerSharing && peerSharing.id !== peerSharingAudio?.id) ||
      peerSharingPlaylist) &&
    !isAudioOnly
  ) {
    ViewComponent = ScreenShareView;
  } else if (uiViewMode === UI_MODE_ACTIVE_SPEAKER) {
    ViewComponent = ActiveSpeakerView;
  } else {
    ViewComponent = MainGridView;
  }

  return (
    <Suspense fallback={<FullPageProgress />}>
      <Flex css={{ size: "100%", position: "relative" }}>
        <ViewComponent showStats={showStatsOnTiles} />
        <SidePane />
      </Flex>
    </Suspense>
  );
};

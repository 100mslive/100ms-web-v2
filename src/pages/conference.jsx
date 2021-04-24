import React, { useEffect, useState, useContext } from "react";
import { AppContext } from "../store/AppContext";
import { Header, ControlBar, ParticipantList } from "@100mslive/sdk-components";
import { ScreenShareView } from "../views/screenShareView";
import { TeacherView } from "../views/teacherView";
import { useHistory } from "react-router-dom";
import { useHMSRoom } from "@100mslive/sdk-components";
import { isScreenSharing } from "../utlis/index";

export const Conference = () => {
  const history = useHistory();
  const context = useContext(AppContext);
  const [isScreenShared, setScreenShared] = useState(false);
  const { loginInfo, isChatOpen, toggleChat, isConnected } = context;

  const {
    leave,
    sendMessage,
    localPeer,
    toggleMute,
    toggleScreenShare,
    peers,
  } = useHMSRoom();

  if (!loginInfo.token) {
    history.push("/");
  }
  useEffect(() => {
    return () => {
      leave();
    };
  }, []);

  const participants =
    peers && peers.length > 0 && peers[0]
      ? peers
          .filter((participant) => participant.name && participant.videoTrack)
          .map((participant) => {
            console.debug("app: Participant is ", participant);
            return {
              peer: {
                displayName: participant.name,
                id: participant.id,
              },
            };
          })
      : [];

  return (
    <div className="w-full h-full bg-black">
      <div style={{ padding: "25px", height: "10%" }}>
        <Header
          rightComponents={[
            <ParticipantList key={0} participantList={participants} />,
          ]}
        />
      </div>
      <div className="w-full flex" style={{ height: "80%" }}>
        {console.log(peers, "all peers here")}
        {peers.some(isScreenSharing) ? <ScreenShareView /> : <TeacherView />}
        {/* // ) : (
        //   <StudentView
        //     streamsWithInfo={streamsWithInfo
        //       .filter(
        //         (item) =>
        //           item.videoSource == "screen" || item.videoSource == "camera"
        //       )
        //       .map((item) => ({
        //         ...item,
        //         stream: !item.isVideoMuted
        //           ? item.videoSource == "screen"
        //             ? screenStream
        //             : cameraStream
        //           : new MediaStream(),
        //       }))}
        //   />
        // )} */}
      </div>
      <div className="bg-black" style={{ height: "10%" }}>
        {isConnected && (
          <ControlBar
            audioButtonOnClick={() => {
              toggleMute(localPeer.audioTrack);
            }}
            videoButtonOnClick={() => {
              toggleMute(localPeer.videoTrack);
            }}
            leaveButtonOnClick={() => {
              leave();
              history.push("/");
            }}
            screenshareButtonOnClick={() => toggleScreenShare()}
            isAudioMuted={
              localPeer &&
              !(localPeer.audioTrack && localPeer.audioTrack.enabled)
            }
            isVideoMuted={
              localPeer &&
              !(localPeer.videoTrack && localPeer.videoTrack.enabled)
            }
            isChatOpen={isChatOpen}
            chatButtonOnClick={() => {
              toggleChat();
            }}
          />
        )}
      </div>
    </div>
  );
};

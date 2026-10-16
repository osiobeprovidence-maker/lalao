import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useAction } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { CallSession, User } from '../types';
import { agoraRtcService } from '../services/agora/agoraRtcService';
import { callRingtoneService } from '../services/audio/callRingtone';
import { IAgoraRTCRemoteUser } from 'agora-rtc-sdk-ng';

interface CallContextType {
  activeCall: CallSession | null;
  isIncomingCall: boolean;
  isOutgoingCall: boolean;
  isConnected: boolean;
  isMuted: boolean;
  isCameraOff: boolean;
  isSpeakerOn: boolean;
  isMinimized: boolean;
  duration: number;
  formattedDuration: string;
  connectionState: 'idle' | 'calling' | 'ringing' | 'connecting' | 'connected' | 'reconnecting' | 'disconnected';
  mediaError: string | null;
  remoteUser: IAgoraRTCRemoteUser | null;
  isAgoraConfigured: boolean;

  // Actions
  startCall: (params: { recipient: User; type: 'voice' | 'video'; conversationId?: string }) => Promise<{ success: boolean; reason?: string }>;
  acceptCall: () => Promise<void>;
  declineCall: () => Promise<void>;
  endCall: () => Promise<void>;
  toggleMute: () => Promise<void>;
  toggleCamera: () => Promise<void>;
  toggleSpeaker: () => void;
  toggleMinimize: () => void;
  switchCamera: () => Promise<void>;
  attachLocalVideo: (element: HTMLDivElement | null) => void;
  attachRemoteVideo: (element: HTMLDivElement | null) => void;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

export const CallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Reactive query from Convex backend for the current user's call session
  const activeCallData = useQuery(api.calls.getActiveCall);

  const initiateCallMutation = useMutation(api.calls.initiateCall);
  const acceptCallMutation = useMutation(api.calls.acceptCall);
  const declineCallMutation = useMutation(api.calls.declineCall);
  const cancelCallMutation = useMutation(api.calls.cancelCall);
  const endCallMutation = useMutation(api.calls.endCall);
  const checkTimeoutMutation = useMutation(api.calls.checkCallTimeout);
  const generateTokenAction = useAction(api.callActions.generateRtcToken);

  const [activeCall, setActiveCall] = useState<CallSession | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [duration, setDuration] = useState(0);
  const [connectionState, setConnectionState] = useState<CallContextType['connectionState']>('idle');
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [remoteUser, setRemoteUser] = useState<IAgoraRTCRemoteUser | null>(null);
  const [isAgoraConfigured, setIsAgoraConfigured] = useState(true);

  const durationTimerRef = useRef<any>(null);
  const localVideoContainerRef = useRef<HTMLDivElement | null>(null);
  const remoteVideoContainerRef = useRef<HTMLDivElement | null>(null);
  const hasJoinedAgoraRef = useRef(false);

  // Sync active call data from reactive Convex query
  useEffect(() => {
    if (activeCallData) {
      setActiveCall(activeCallData as any);
    } else {
      if (activeCall && ['calling', 'ringing', 'connected'].includes(activeCall.status)) {
        // Call ended on server
        handleCleanupLocal();
      }
      setActiveCall(null);
    }
  }, [activeCallData]);

  // Handle call status transitions and ringtones
  useEffect(() => {
    if (!activeCall) {
      callRingtoneService.stop();
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
        durationTimerRef.current = null;
      }
      return;
    }

    if (activeCall.status === 'ringing' || activeCall.status === 'calling') {
      setConnectionState('ringing');
      if (activeCall.isCaller) {
        callRingtoneService.startOutgoingRingtone();
      } else {
        callRingtoneService.startIncomingRingtone();
      }

      // Check for timeout every 5 seconds
      const timeoutCheck = setInterval(() => {
        checkTimeoutMutation({ callId: activeCall._id as any }).catch(() => {});
      }, 5000);

      return () => {
        clearInterval(timeoutCheck);
      };
    }

    if (activeCall.status === 'connected') {
      callRingtoneService.stop();
      setConnectionState('connected');

      // Start duration timer
      if (!durationTimerRef.current) {
        // Calculate initial elapsed seconds if connectedAt is present
        const startSecs = activeCall.connectedAt
          ? Math.max(0, Math.floor((Date.now() - activeCall.connectedAt) / 1000))
          : 0;
        setDuration(startSecs);

        durationTimerRef.current = setInterval(() => {
          setDuration((prev) => prev + 1);
        }, 1000);
      }

      // Join Agora RTC channel if not joined yet
      if (!hasJoinedAgoraRef.current) {
        connectToAgora(activeCall);
      }
    }

    if (['completed', 'declined', 'canceled', 'missed', 'failed'].includes(activeCall.status)) {
      callRingtoneService.playCallEndTone();
      handleCleanupLocal();
    }
  }, [activeCall?.status, activeCall?._id]);

  // Connect to Agora RTC Channel
  const connectToAgora = async (call: CallSession) => {
    hasJoinedAgoraRef.current = true;
    setConnectionState('connecting');
    setMediaError(null);

    try {
      // 1. Fetch short-lived token and credentials from backend
      const tokenResult: any = await generateTokenAction({ callId: call._id as any });

      const appId = tokenResult.appId || (import.meta.env.VITE_AGORA_APP_ID as string) || '';
      setIsAgoraConfigured(!!appId && appId !== 'replace_with_your_app_id');

      if (!appId || appId === 'replace_with_your_app_id') {
        console.warn('[CallContext] Agora App ID is not configured. Media transport will remain in signaling-only state.');
        setConnectionState('connected');
        return;
      }

      // 2. Initialize Agora client
      agoraRtcService.initClient({
        onRemoteUserJoined: (user) => {
          setRemoteUser(user);
          if (remoteVideoContainerRef.current) {
            agoraRtcService.playRemoteVideo(user.uid, remoteVideoContainerRef.current);
          }
        },
        onRemoteUserLeft: () => {
          setRemoteUser(null);
        },
        onRemoteVideoChanged: (user, isOff) => {
          if (!isOff && remoteVideoContainerRef.current) {
            agoraRtcService.playRemoteVideo(user.uid, remoteVideoContainerRef.current);
          }
        },
        onConnectionStateChanged: (curState) => {
          if (curState === 'CONNECTED') setConnectionState('connected');
          else if (curState === 'RECONNECTING') setConnectionState('reconnecting');
          else if (curState === 'DISCONNECTED') setConnectionState('disconnected');
        },
        onError: (err) => {
          setMediaError(err.message || 'Media connection issue');
        },
      });

      // 3. Join channel with user's assigned UID
      const myUid = call.myUid || (call.isCaller ? call.callerUid : call.recipientUid);
      const { localVideoTrack } = await agoraRtcService.joinChannel({
        appId,
        channelName: tokenResult.channelName || call.channelName,
        token: tokenResult.token || null,
        uid: myUid,
        callType: call.type,
      });

      setConnectionState('connected');

      // Attach local video if container is mounted
      if (localVideoTrack && localVideoContainerRef.current) {
        agoraRtcService.playLocalVideo(localVideoContainerRef.current);
      }
    } catch (err: any) {
      console.error('[CallContext] Error joining Agora channel:', err);
      let errMsg = 'Could not access camera or microphone.';
      if (err.name === 'NotAllowedError' || err.message?.includes('permission')) {
        errMsg = 'Permission denied. Please allow microphone and camera in your browser.';
      } else if (err.name === 'NotFoundError') {
        errMsg = 'Microphone or camera hardware not found.';
      } else if (err.message) {
        errMsg = err.message;
      }
      setMediaError(errMsg);
    }
  };

  // Local media cleanup
  const handleCleanupLocal = useCallback(() => {
    callRingtoneService.stop();
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }
    agoraRtcService.leave().catch(() => {});
    hasJoinedAgoraRef.current = false;
    setDuration(0);
    setIsMuted(false);
    setIsCameraOff(false);
    setIsMinimized(false);
    setRemoteUser(null);
    setConnectionState('idle');
  }, []);

  // Cleanup on window unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      agoraRtcService.leave().catch(() => {});
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // Format call duration MM:SS or HH:MM:SS
  const formatSeconds = (totalSecs: number): string => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Start outgoing call
  const startCall = async (params: { recipient: User; type: 'voice' | 'video'; conversationId?: string }) => {
    setMediaError(null);
    setIsMinimized(false);
    try {
      const result: any = await initiateCallMutation({
        recipientId: params.recipient.id as any,
        type: params.type,
        conversationId: params.conversationId as any,
      });

      if (!result.success) {
        return { success: false, reason: result.reason || result.message };
      }

      return { success: true };
    } catch (err: any) {
      console.error('Failed to initiate call:', err);
      return { success: false, reason: err.message || 'Call failed' };
    }
  };

  // Accept incoming call
  const acceptCall = async () => {
    if (!activeCall) return;
    callRingtoneService.stop();
    try {
      await acceptCallMutation({ callId: activeCall._id as any });
    } catch (err: any) {
      console.error('Failed to accept call:', err);
      setMediaError(err.message || 'Could not accept call');
    }
  };

  // Decline incoming call
  const declineCall = async () => {
    if (!activeCall) return;
    callRingtoneService.stop();
    try {
      await declineCallMutation({ callId: activeCall._id as any });
      handleCleanupLocal();
    } catch (err) {
      console.error('Failed to decline call:', err);
      handleCleanupLocal();
    }
  };

  // End active call or cancel outgoing ringing call
  const endCall = async () => {
    if (!activeCall) return;
    callRingtoneService.stop();
    try {
      if (activeCall.status === 'ringing' && activeCall.isCaller) {
        await cancelCallMutation({ callId: activeCall._id as any });
      } else {
        await endCallMutation({ callId: activeCall._id as any, reason: 'user_hung_up' });
      }
    } catch (err) {
      console.error('Failed to end call:', err);
    } finally {
      handleCleanupLocal();
    }
  };

  // Toggle microphone
  const toggleMute = async () => {
    const nextMuted = !isMuted;
    await agoraRtcService.setMuted(nextMuted);
    setIsMuted(nextMuted);
  };

  // Toggle camera
  const toggleCamera = async () => {
    const nextOff = !isCameraOff;
    await agoraRtcService.setCameraOff(nextOff);
    setIsCameraOff(nextOff);
  };

  // Toggle speaker/audio
  const toggleSpeaker = () => {
    setIsSpeakerOn((prev) => !prev);
  };

  // Toggle minimize
  const toggleMinimize = () => {
    setIsMinimized((prev) => !prev);
  };

  // Switch camera (front/back)
  const switchCamera = async () => {
    await agoraRtcService.switchCamera();
  };

  // Attach local video DOM element
  const attachLocalVideo = (element: HTMLDivElement | null) => {
    localVideoContainerRef.current = element;
    if (element && agoraRtcService.getLocalVideoTrack()) {
      agoraRtcService.playLocalVideo(element);
    }
  };

  // Attach remote video DOM element
  const attachRemoteVideo = (element: HTMLDivElement | null) => {
    remoteVideoContainerRef.current = element;
    if (element && remoteUser && remoteUser.videoTrack) {
      agoraRtcService.playRemoteVideo(remoteUser.uid, element);
    }
  };

  const isIncomingCall = !!activeCall && activeCall.status === 'ringing' && !activeCall.isCaller;
  const isOutgoingCall = !!activeCall && activeCall.status === 'ringing' && !!activeCall.isCaller;
  const isConnected = !!activeCall && activeCall.status === 'connected';

  return (
    <CallContext.Provider
      value={{
        activeCall,
        isIncomingCall,
        isOutgoingCall,
        isConnected,
        isMuted,
        isCameraOff,
        isSpeakerOn,
        isMinimized,
        duration,
        formattedDuration: formatSeconds(duration),
        connectionState,
        mediaError,
        remoteUser,
        isAgoraConfigured,
        startCall,
        acceptCall,
        declineCall,
        endCall,
        toggleMute,
        toggleCamera,
        toggleSpeaker,
        toggleMinimize,
        switchCamera,
        attachLocalVideo,
        attachRemoteVideo,
      }}
    >
      {children}
    </CallContext.Provider>
  );
};

export const useCall = () => {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error('useCall must be used within a CallProvider');
  }
  return context;
};

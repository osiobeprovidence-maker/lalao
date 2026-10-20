import AgoraRTC, {
  IAgoraRTCClient,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
  IAgoraRTCRemoteUser,
} from 'agora-rtc-sdk-ng';

export interface RemoteParticipantState {
  uid: number | string;
  hasAudio: boolean;
  hasVideo: boolean;
  user: IAgoraRTCRemoteUser;
}

export type AgoraEventCallbacks = {
  onRemoteUserJoined?: (user: IAgoraRTCRemoteUser) => void;
  onRemoteUserLeft?: (user: IAgoraRTCRemoteUser, reason: string) => void;
  onRemoteVideoChanged?: (user: IAgoraRTCRemoteUser, isMuted: boolean) => void;
  onRemoteAudioChanged?: (user: IAgoraRTCRemoteUser, isMuted: boolean) => void;
  onConnectionStateChanged?: (curState: string, revState: string, reason?: string) => void;
  onTokenPrivilegeWillExpire?: () => void;
  onNetworkQuality?: (uplinkQuality: number, downlinkQuality: number) => void;
  onError?: (err: Error) => void;
};

class AgoraRtcService {
  private client: IAgoraRTCClient | null = null;
  private localAudioTrack: IMicrophoneAudioTrack | null = null;
  private localVideoTrack: ICameraVideoTrack | null = null;
  private remoteUsers: Map<number | string, IAgoraRTCRemoteUser> = new Map();
  private callbacks: AgoraEventCallbacks = {};
  private isJoined = false;

  constructor() {
    // Register official Agora Web SDK audio autoplay failure handler
    if (typeof window !== 'undefined') {
      AgoraRTC.onAudioAutoplayFailed = () => {
        console.warn('[AgoraRTC] Audio autoplay policy prevented immediate playback. Registering user gesture handler.');
        const resumeAudio = () => {
          for (const user of this.remoteUsers.values()) {
            if (user.audioTrack && !user.audioTrack.isPlaying) {
              user.audioTrack.play();
            }
          }
          window.removeEventListener('click', resumeAudio);
          window.removeEventListener('touchstart', resumeAudio);
        };
        window.addEventListener('click', resumeAudio, { once: true });
        window.addEventListener('touchstart', resumeAudio, { once: true });
      };
    }
  }

  public isSupported(): boolean {
    return typeof window !== 'undefined' && !!navigator.mediaDevices && !!window.RTCPeerConnection;
  }

  public getClient(): IAgoraRTCClient | null {
    return this.client;
  }

  public getLocalAudioTrack(): IMicrophoneAudioTrack | null {
    return this.localAudioTrack;
  }

  public getLocalVideoTrack(): ICameraVideoTrack | null {
    return this.localVideoTrack;
  }

  public getRemoteUsers(): IAgoraRTCRemoteUser[] {
    return Array.from(this.remoteUsers.values());
  }

  /**
   * Initialize Agora client and register event listeners.
   */
  public initClient(callbacks: AgoraEventCallbacks): IAgoraRTCClient {
    this.callbacks = callbacks;

    if (!this.client) {
      this.client = AgoraRTC.createClient({
        mode: 'rtc',
        codec: 'vp8',
      });

      this.client.on('user-published', async (user, mediaType) => {
        try {
          if (!this.client) return;
          await this.client.subscribe(user, mediaType);
          this.remoteUsers.set(user.uid, user);

          if (mediaType === 'audio') {
            user.audioTrack?.play();
            this.callbacks.onRemoteAudioChanged?.(user, false);
          } else if (mediaType === 'video') {
            this.callbacks.onRemoteVideoChanged?.(user, false);
          }

          this.callbacks.onRemoteUserJoined?.(user);
        } catch (err) {
          console.error('[AgoraRTC] Error subscribing to remote user:', err);
          this.callbacks.onError?.(err as Error);
        }
      });

      this.client.on('user-unpublished', (user, mediaType) => {
        if (mediaType === 'video') {
          this.callbacks.onRemoteVideoChanged?.(user, true);
        } else if (mediaType === 'audio') {
          this.callbacks.onRemoteAudioChanged?.(user, true);
        }
      });

      this.client.on('user-left', (user, reason) => {
        this.remoteUsers.delete(user.uid);
        this.callbacks.onRemoteUserLeft?.(user, reason);
      });

      this.client.on('connection-state-change', (curState, revState, reason) => {
        this.callbacks.onConnectionStateChanged?.(curState, revState, reason);
      });

      this.client.on('token-privilege-will-expire', () => {
        console.warn('[AgoraRTC] Token privilege will expire in 30s. Triggering proactive renewal...');
        this.callbacks.onTokenPrivilegeWillExpire?.();
      });

      this.client.on('network-quality', (stats) => {
        this.callbacks.onNetworkQuality?.(stats.uplinkNetworkQuality, stats.downlinkNetworkQuality);
      });
    }

    return this.client;
  }

  /**
   * Renew Agora RTC Token when near expiration.
   */
  public async renewToken(token: string): Promise<void> {
    if (this.client && token) {
      await this.client.renewToken(token);
    }
  }

  /**
   * Join an Agora RTC Channel with short-lived token or App ID.
   */
  public async joinChannel(params: {
    appId: string;
    channelName: string;
    token?: string | null;
    uid: number;
    callType: 'voice' | 'video';
  }): Promise<{ localAudioTrack: IMicrophoneAudioTrack; localVideoTrack: ICameraVideoTrack | null }> {
    const { appId, channelName, token, uid, callType } = params;

    if (!this.client) {
      throw new Error('Agora client is not initialized');
    }

    // Join channel
    await this.client.join(appId, channelName, token || null, uid);
    this.isJoined = true;

    // Create local audio track with acoustic echo cancellation and noise suppression
    if (!this.localAudioTrack) {
      this.localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack({
        encoderConfig: 'high_quality_stereo',
        AEC: true,
        ANS: true,
        AGC: true,
      });
    }

    const tracksToPublish: any[] = [this.localAudioTrack];

    // If video call, create local video track if not already created
    if (callType === 'video') {
      if (!this.localVideoTrack) {
        try {
          this.localVideoTrack = await AgoraRTC.createCameraVideoTrack({
            encoderConfig: '720p_1',
            optimizationMode: 'detail',
          });
        } catch (videoErr) {
          console.warn('[AgoraRTC] Failed to initialize camera, proceeding with voice only:', videoErr);
        }
      }
      if (this.localVideoTrack) {
        tracksToPublish.push(this.localVideoTrack);
      }
    }

    // Publish tracks
    await this.client.publish(tracksToPublish);

    return {
      localAudioTrack: this.localAudioTrack,
      localVideoTrack: this.localVideoTrack,
    };
  }

  /**
   * Create local video preview track before joining channel.
   */
  public async createLocalVideoPreview(): Promise<ICameraVideoTrack | null> {
    if (this.localVideoTrack) return this.localVideoTrack;
    try {
      this.localVideoTrack = await AgoraRTC.createCameraVideoTrack({
        encoderConfig: '720p_1',
        optimizationMode: 'detail',
      });
      return this.localVideoTrack;
    } catch (err) {
      console.warn('[AgoraRTC] Could not create camera video preview:', err);
      return null;
    }
  }

  /**
   * Play local video track in specified DOM element or ID.
   */
  public playLocalVideo(element: HTMLElement | string) {
    if (this.localVideoTrack) {
      try {
        this.localVideoTrack.play(element, { fit: 'cover' });
      } catch (err) {
        console.warn('[AgoraRTC] Error playing local video:', err);
      }
    }
  }

  /**
   * Play remote participant's video track in specified DOM element or ID.
   */
  public playRemoteVideo(uid: number | string, element: HTMLElement | string) {
    const user = this.remoteUsers.get(uid);
    if (user && user.videoTrack) {
      try {
        user.videoTrack.play(element, { fit: 'cover' });
      } catch (err) {
        console.warn('[AgoraRTC] Error playing remote video:', err);
      }
    }
  }

  /**
   * Toggle microphone mute.
   */
  public async setMuted(muted: boolean): Promise<boolean> {
    if (!this.localAudioTrack) return false;
    await this.localAudioTrack.setEnabled(!muted);
    return muted;
  }

  /**
   * Toggle camera video on/off.
   */
  public async setCameraOff(off: boolean): Promise<boolean> {
    if (!this.localVideoTrack) return false;
    await this.localVideoTrack.setEnabled(!off);
    return off;
  }

  /**
   * Switch camera video input device (e.g. front/back camera on mobile).
   */
  public async switchCamera(deviceId?: string): Promise<void> {
    if (!this.localVideoTrack) return;
    if (deviceId) {
      await this.localVideoTrack.setDevice(deviceId);
      return;
    }

    // Toggle next available camera
    const cameras = await AgoraRTC.getCameras();
    if (cameras.length > 1) {
      const currentTrack = this.localVideoTrack.getMediaStreamTrack();
      const currentDeviceId = currentTrack.getSettings().deviceId;
      const nextCamera = cameras.find((c) => c.deviceId !== currentDeviceId) || cameras[0];
      if (nextCamera) {
        await this.localVideoTrack.setDevice(nextCamera.deviceId);
      }
    }
  }

  /**
   * Get available video input cameras.
   */
  public async getCameras() {
    return AgoraRTC.getCameras();
  }

  /**
   * Get available audio input microphones.
   */
  public async getMicrophones() {
    return AgoraRTC.getMicrophones();
  }

  /**
   * Leave channel and release all audio/video tracks.
   * Completely shuts down camera and microphone hardware lights.
   */
  public async leave(): Promise<void> {
    try {
      if (this.client && this.isJoined) {
        const tracksToUnpublish: any[] = [];
        if (this.localAudioTrack) tracksToUnpublish.push(this.localAudioTrack);
        if (this.localVideoTrack) tracksToUnpublish.push(this.localVideoTrack);

        if (tracksToUnpublish.length > 0) {
          try {
            await this.client.unpublish(tracksToUnpublish);
          } catch (_) {
            /* already unpublished */
          }
        }
      }
    } catch (_) {}

    // Stop and close audio track
    if (this.localAudioTrack) {
      try {
        this.localAudioTrack.stop();
        this.localAudioTrack.close();
      } catch (_) {}
      this.localAudioTrack = null;
    }

    // Stop and close video track
    if (this.localVideoTrack) {
      try {
        this.localVideoTrack.stop();
        this.localVideoTrack.close();
      } catch (_) {}
      this.localVideoTrack = null;
    }

    // Leave channel
    if (this.client) {
      try {
        await this.client.leave();
      } catch (_) {}
    }

    this.remoteUsers.clear();
    this.isJoined = false;
  }
}

export const agoraRtcService = new AgoraRtcService();

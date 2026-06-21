import { Camera, VideoCamera, Settings, Setting, ScryptedDeviceBase, MediaObject, MediaStreamOptions } from "@scrypted/sdk";
export declare class CiscoCamera extends ScryptedDeviceBase implements Camera, VideoCamera, Settings {
    private sessionID;
    constructor(nativeId: string);
    getSettings(): Promise<Setting[]>;
    putSetting(key: string, value: string | number | boolean): Promise<void>;
    private getSessionID;
    getVideoStream(options?: MediaStreamOptions): Promise<MediaObject>;
    getVideoStreamOptions(): Promise<MediaStreamOptions[]>;
    getPictureOptions(): Promise<void>;
    takePicture(): Promise<MediaObject>;
}
//# sourceMappingURL=CiscoCamera.d.ts.map
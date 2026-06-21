import { DeviceProvider, DeviceCreator, DeviceCreatorSettings, Setting } from "@scrypted/sdk";
import sdk from "@scrypted/sdk";
import { CiscoCamera } from "./CiscoCamera";
declare class CiscoCameraProvider extends sdk.ScryptedDeviceBase implements DeviceProvider, DeviceCreator {
    constructor();
    getDevice(nativeId: string): Promise<CiscoCamera>;
    getCreateDeviceSettings(): Promise<Setting[]>;
    createDevice(settings: DeviceCreatorSettings): Promise<string>;
}
declare const _default: CiscoCameraProvider;
export default _default;
//# sourceMappingURL=main.d.ts.map
import { DeviceProvider, ScryptedDeviceType, ScryptedInterface, DeviceDiscovery, DeviceCreator, DeviceCreatorSettings, Setting, ScryptedDeviceBase } from "@scrypted/sdk";
import sdk from "@scrypted/sdk";
import { CiscoCamera } from "./CiscoCamera";

const { deviceManager } = sdk;

class CiscoCameraProvider extends ScryptedDeviceBase implements DeviceProvider, DeviceCreator {
    constructor() {
        super();
    }

    async getDevice(nativeId: string) {
        const device = new CiscoCamera(nativeId);
        // Force update of existing devices to ensure they have the latest interfaces
        await deviceManager.onDeviceDiscovered({
            name: device.name || "Cisco Camera",
            type: ScryptedDeviceType.Camera,
            nativeId,
            interfaces: [
                ScryptedInterface.VideoCamera,
                ScryptedInterface.Settings
            ],
            info: {
                model: "CIVS-IPC-4500E",
                manufacturer: "Cisco",
            }
        });
        return device;
    }
    
    async releaseDevice(id: string, nativeId: string): Promise<void> {
        // Nothing special to do on release.
    }

    async getCreateDeviceSettings(): Promise<Setting[]> {
        return [
            {
                title: "Camera Name",
                key: "name",
                description: "The name of the camera (e.g., Driveway)",
                value: "Cisco Camera",
            },
            {
                title: "Camera IP Address",
                key: "ipAddress",
                description: "The IP address of the Cisco Camera",
            },
            {
                title: "Username",
                key: "username",
                description: "The login username",
                value: "admin",
            },
            {
                title: "Password",
                key: "password",
                description: "The login password",
                type: "password",
            }
        ];
    }

    async createDevice(settings: DeviceCreatorSettings): Promise<string> {
        const name = settings.name?.toString() || "Cisco Camera";
        const ipAddress = settings.ipAddress?.toString();
        const username = settings.username?.toString() || "admin";
        const password = settings.password?.toString();

        if (!ipAddress || !password) {
            throw new Error("IP Address and Password are required");
        }

        const nativeId = `cisco-${ipAddress.replace(/\./g, '-')}`;

        await deviceManager.onDeviceDiscovered({
            name,
            type: ScryptedDeviceType.Camera,
            nativeId,
            interfaces: [
                ScryptedInterface.VideoCamera,
                ScryptedInterface.Settings
            ],
            info: {
                model: "CIVS-IPC-4500E",
                manufacturer: "Cisco",
            }
        });

        const device = new CiscoCamera(nativeId);
        await device.storage.setItem("ipAddress", ipAddress);
        await device.storage.setItem("username", username);
        await device.storage.setItem("password", password);

        return nativeId;
    }
}

export default new CiscoCameraProvider();

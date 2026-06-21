# Scrypted Cisco 4500E Camera Plugin

This is a custom plugin for [Scrypted](https://github.com/koush/scrypted) designed specifically to handle legacy Cisco IP Cameras, such as the Cisco CIVS-IPC-4500E.

These older Cisco cameras rely on outdated browser technologies (like ActiveX and legacy Java applets) for their web interfaces, and have unstable built-in RTSP servers that often drop frames or produce visual artifacts when streamed directly. This plugin solves both of those problems by bundling a customized backend.

## Features

- **Built-in Modern Web Proxy**: The plugin hosts a modernized version of the camera's original Web UI on a custom port, stripping out the broken ActiveX controls and replacing them with a native HTML5 video player. You can configure camera settings (like motion detection and resolution) right from any modern browser.
- **Embedded `go2rtc` Service**: To solve the visual artifacting and connection instability, the plugin automatically downloads and runs `go2rtc` locally. It securely intercepts the video feed over a stable TCP connection and re-broadcasts it as an ultra-stable, artifact-free RTSP feed into Scrypted.
- **Auto-Session Management**: The plugin dynamically scrapes and maintains the required authentication `sessionID` from the camera, ensuring the video stream never times out or drops due to expired credentials.
- **Zero Configuration Files**: Everything is configured natively through the Scrypted UI.

## Installation & Deployment

Since this is a custom plugin, you'll need to deploy it directly to your Scrypted instance using the `@scrypted/cli`.

### Prerequisites
- Node.js (v18+)
- A running instance of Scrypted

### Setup Steps
1. Clone this repository:
   ```bash
   git clone https://github.com/mkelley88/scrypted-cisco-4500e.git
   cd scrypted-cisco-4500e
   ```
2. Install the necessary dependencies:
   ```bash
   npm install
   ```
3. Build the plugin:
   ```bash
   npm run build
   ```
4. Deploy it directly to your Scrypted server (replace `<IP_ADDRESS>` with the IP of your Scrypted server):
   ```bash
   npx scrypted-deploy <IP_ADDRESS>
   ```

## Configuration

Once deployed, add a new instance of the **Cisco Camera** plugin in your Scrypted dashboard.

In the plugin's "Stream Settings" page, you will find several required fields:
- **Camera IP**: The IP address of your Cisco camera.
- **Username**: The administrator username of the Cisco camera.
- **Password**: The administrator password of the Cisco camera.
- **Web Proxy Port**: The local port where the modernized Web UI should be served (Default: `3000`).
- **Web Proxy Username**: Choose a username to secure the new Web UI.
- **Web Proxy Password**: Choose a password to secure the new Web UI.

After saving your settings, simply navigate to `http://<SCRYPTED_IP>:<PROXY_PORT>` in your browser to access the modernized camera interface!



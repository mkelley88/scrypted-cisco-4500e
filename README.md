# Scrypted Cisco 4500E Camera Plugin

This is a custom plugin for [Scrypted](https://github.com/koush/scrypted) designed specifically to handle the Cisco 4500E IP Camera (CIVS-IPC-4500E). This is a 1080p POE camera with zoom lens and auto iris control and with a little help can be still useful today!

If you've looked around on YouTube or forums you'll see people accessing the camera from an old outdated browser in Windows XP just to be able to configure it such as this video by [Shiny Tech Things](https://www.youtube.com/watch?v=bL3_qv-EVFQ&t=367s).

These older Cisco cameras rely on outdated browser technologies (like ActiveX and legacy Java applets) for their web interfaces, and have unstable built-in RTSP servers that often drop frames or produce visual artifacts when streamed directly. This plugin tries to solve both of those problems by bundling a customized backend.

## Features

- **Built-in Modern Web Proxy**: The plugin hosts a modernized version of the camera's original Web UI code on a custom port. It accesses the now insecure SSL page of the camera and proxies it to an http connection. You can configure camera settings right from any modern browser.
- **Direct FFmpeg Stream Handling**: To solve the visual artifacting and connection instability, the plugin pulls the video feed over a forced TCP connection and feeds it into Scrypted's FFmpeg input, in an attempt to eliminate UDP packet loss smearing.
- **Auto-Session Management**: The plugin dynamically scrapes and maintains the required authentication `sessionID` from the camera, ensuring the video stream never times out or drops due to expired credentials.
- **Zero Configuration Files**: Everything is configured natively through the Scrypted UI.

## Disclaimer
The 4500E is is the only camera I've tested this on, but it may work with similar cameras.
Due to the age of this camera, I recommend keeping it isolated on a VLAN or otherwise blocked from the internet.
This software was built with the assistance of Gemini 3.1 Pro on Antigravity and may contain security flaws or other issues.
Consider this alpha software and feel free to open an issue or submit a pull request on the [Github page](https://github.com/mkelley88/scrypted-cisco-4500e) if you experence a problem or see something that can be fixed. 


## Install in Scrypted
Type "scrypted-cisco-camera" in Scrypted's plugin search and click install.


## Configuration

Once installed, click the "Cisco Camera" plugin in your Scrypted dashboard. Click add device and fill in the requested details.

In the plugin's "Stream Settings" page, you will find several required fields:
- **Camera IP**: The IP address of your Cisco camera.
- **Username**: The administrator username of the Cisco camera.
- **Password**: The administrator password of the Cisco camera.
- **Web Proxy Port**: The local port where the modernized Web UI should be served (Default: `3000`).
Ignore these unless you want to add a second layer of authentication to the proxy itself.
- **Web Proxy Username**: Choose a username to secure the new Web UI. (Default: "Admin")
- **Web Proxy Password**: Choose a password to secure the new Web UI. (Optional)

After saving your settings, simply navigate to `http://<SCRYPTED_IP>:<PROXY_PORT>` in your browser to access the modernized camera interface!


## Developers: For Manual Builds, Install, and Deployment

If you'd like to modify anything, you'll need to build and deploy it directly to your Scrypted instance using the `@scrypted/cli`.

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

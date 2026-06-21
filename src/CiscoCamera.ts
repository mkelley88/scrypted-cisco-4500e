import {
    VideoCamera,
    Settings,
    Setting,
    ScryptedDeviceBase,
    MediaObject,
    MediaStreamOptions,
    ResponseMediaStreamOptions,
    ScryptedInterface,
} from "@scrypted/sdk";
import sdk from "@scrypted/sdk";
import axios from "axios";
import * as express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import * as basicAuth from "basic-auth";
import * as https from "https";
import * as crypto from "crypto";
import * as http from "http";

const { mediaManager, deviceManager } = sdk;

export class CiscoCamera extends ScryptedDeviceBase implements VideoCamera, Settings {
    private expressServer?: http.Server;
    private isRestartingProxy: boolean = false;
    private cachedSessionId?: string;
    private cachedSessionTime: number = 0;

    constructor(nativeId: string) {
        super(nativeId);
        
        // Start background services asynchronously
        this.startServices().catch(e => {
            this.console.error("Failed to start services:", e);
        });
    }

    release() {
        if (this.expressServer) {
            this.console.log("Closing Express server...");
            this.expressServer.close();
        }
    }

    private async startServices() {
        await this.startExpressProxy();
    }


    private async startExpressProxy() {
        const app = express.default();
        const parsedPort = parseInt(this.storage.getItem("proxyPort") || "3000", 10);
        const port = (Number.isFinite(parsedPort) && parsedPort >= 1 && parsedPort <= 65535) ? parsedPort : 3000;
        const proxyUsername = this.storage.getItem("proxyUsername") || "admin";
        const proxyPassword = this.storage.getItem("proxyPassword");

        const ipAddress = this.storage.getItem("ipAddress");
        if (!ipAddress) {
            this.console.warn("Camera IP not configured. Express proxy will not start until IP is set.");
            return;
        }

        const CAMERA_URL = `https://${ipAddress}`;

        const legacyAgent = new https.Agent({
            rejectUnauthorized: false,
            secureOptions: crypto.constants.SSL_OP_LEGACY_SERVER_CONNECT,
            ciphers: 'DEFAULT@SECLEVEL=0',
            minVersion: 'TLSv1'
        });

        // Basic Auth Middleware
        app.use((req, res, next) => {
            if (!proxyPassword) return next(); // Skip auth if no password configured
            const user = basicAuth.default(req);
            if (!user) {
                res.set('WWW-Authenticate', 'Basic realm="Cisco Camera Web Proxy"');
                return res.status(401).send('Authentication required.');
            }
            const nameMatch = crypto.timingSafeEqual(
                Buffer.from(user.name.padEnd(256)),
                Buffer.from(proxyUsername.padEnd(256))
            );
            const passMatch = crypto.timingSafeEqual(
                Buffer.from(user.pass.padEnd(256)),
                Buffer.from(proxyPassword.padEnd(256))
            );
            if (!nameMatch || !passMatch) {
                res.set('WWW-Authenticate', 'Basic realm="Cisco Camera Web Proxy"');
                return res.status(401).send('Authentication required.');
            }
            next();
        });



        app.get(/\.(cs|html)$/, async (req, res) => {
            try {
                const headers = { ...req.headers };
                delete headers.host;
                if (headers.referer) {
                    headers.referer = headers.referer.replace(`http://${req.headers.host}`, CAMERA_URL);
                }

                const response = await axios.get(CAMERA_URL + req.originalUrl, { 
                    responseType: 'arraybuffer',
                    headers: headers,
                    maxRedirects: 0,
                    validateStatus: null,
                    httpsAgent: legacyAgent
                });
                
                const contentType = (response.headers['content-type'] as string) || '';
                if (!contentType.includes('text/html') || response.status !== 200) {
                    Object.entries(response.headers).forEach(([key, value]) => {
                        res.setHeader(key, value as string);
                    });
                    return res.status(response.status).send(response.data);
                }
                
                let html = response.data.toString('utf8');
                const sessionID = req.query.sessionID || '';
                
                const polyfill = `
<script>
    window.addEventListener('mousemove', (e) => { window.event = e; }, true);
    window.addEventListener('mousedown', (e) => { window.event = e; }, true);
    window.addEventListener('mouseup', (e) => { window.event = e; }, true);
    const originalGetElementById = document.getElementById;
    document.getElementById = function(id) {
        let el = originalGetElementById.call(document, id);
        if (!el) {
            let elements = document.getElementsByName(id);
            if (elements && elements.length > 0) return elements[0];
        }
        return el;
    };
    window.addEventListener('error', function(e) { console.warn("Camera JS Error:", e.message); });
    const originalAlert = window.alert;
    window.alert = function(msg) {
        if (typeof msg === 'string' && msg.includes('.NET SDK/Runtime')) return;
        if (originalAlert) originalAlert(msg);
    };
</script>
`;
                html = html.replace('</head>', polyfill + '</head>');
                
                html = html.replace(/<body([^>]*)onLoad="([^"]+)"/i, (match: string, before: string, onloadStr: string) => {
                    const safeLoad = onloadStr.split(';')
                        .filter((s: string) => s.trim().length > 0)
                        .map((s: string) => `try{${s}}catch(e){console.warn('onLoad error', e)}`)
                        .join(';');
                    return `<body${before}onLoad="${safeLoad}"`;
                });
                
                html = html.replace(/<(input|select)([^>]*)name="([^"]+)"([^>]*)>/ig, (match: string, tag: string, p1: string, name: string, p3: string) => {
                    if (!match.toLowerCase().includes('id=')) {
                        return `<${tag}${p1}name="${name}" id="${name}"${p3}>`;
                    }
                    return match;
                });
                
                res.setHeader('Content-Type', 'text/html');
                res.send(html);
            } catch (e: any) {
                this.console.error("Error proxying HTML/CS:", e.message);
                res.status(500).send("Error proxying HTML/CS");
            }
        });

        const cameraProxy = createProxyMiddleware({
            target: CAMERA_URL,
            changeOrigin: true,
            secure: false,
            agent: legacyAgent
        });
        app.use('/', cameraProxy);

        this.expressServer = app.listen(port, '0.0.0.0', () => {
            this.console.log(`Web Proxy running on http://localhost:${port}`);
        });
    }

    async getSettings(): Promise<Setting[]> {
        return [
            {
                title: "Camera IP Address",
                group: "Device Login",
                key: "ipAddress",
                description: "The IP address of the Cisco Camera",
                value: this.storage.getItem("ipAddress"),
            },
            {
                title: "Username",
                group: "Device Login",
                key: "username",
                description: "The login username",
                value: this.storage.getItem("username") || "admin",
            },
            {
                title: "Password",
                group: "Device Login",
                key: "password",
                description: "The login password",
                value: this.storage.getItem("password"),
                type: "password",
            },
            {
                title: "Web Proxy Port",
                group: "Web Proxy Settings",
                key: "proxyPort",
                type: "number",
                description: "The port to run the modernized Web UI Proxy on (default 3000)",
                value: this.storage.getItem("proxyPort") || "3000",
            },
            {
                title: "Web Proxy Username",
                group: "Web Proxy Settings",
                key: "proxyUsername",
                description: "Username for accessing the modernized Web UI",
                value: this.storage.getItem("proxyUsername") || "admin",
            },
            {
                title: "Web Proxy Password",
                group: "Web Proxy Settings",
                key: "proxyPassword",
                type: "password",
                description: "Password for accessing the modernized Web UI. Leave blank to disable authentication.",
                value: this.storage.getItem("proxyPassword"),
            }
        ];
    }

    async putSetting(key: string, value: string | number | boolean): Promise<void> {
        // Validate IP address format before saving
        if (key === "ipAddress") {
            const ipRegex = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
            if (!ipRegex.test(value.toString())) {
                throw new Error("Invalid IP address format. Expected format: 192.168.1.100");
            }
        }
        this.storage.setItem(key, value.toString());
        // Restart proxy if proxy settings changed
        if (key === "proxyPort" || key === "proxyUsername" || key === "proxyPassword" || key === "ipAddress") {
            this.restartProxy();
        }
    }

    private restartProxy() {
        if (this.isRestartingProxy) return;
        this.isRestartingProxy = true;

        const oldServer = this.expressServer;
        this.expressServer = undefined;

        const startNew = () => {
            this.startExpressProxy()
                .catch(e => this.console.error("Failed to restart Express server:", e))
                .finally(() => { this.isRestartingProxy = false; });
        };

        if (oldServer) {
            this.console.log("Proxy settings changed, restarting Express server...");
            oldServer.close(startNew);
        } else {
            startNew();
        }
    }

    private async getSessionID(): Promise<string> {
        const now = Date.now();
        if (this.cachedSessionId && now - this.cachedSessionTime < 4 * 60 * 1000) {
            return this.cachedSessionId;
        }

        const ipAddress = this.storage.getItem("ipAddress");
        const username = this.storage.getItem("username") || "admin";
        const password = this.storage.getItem("password");

        if (!ipAddress || !password) {
            throw new Error("Missing camera IP or password. Please update plugin settings.");
        }

        const loginUrl = `http://${ipAddress}/login.cs`;
        const data = new URLSearchParams({
            action: 'login',
            version: '1.0',
            userName: username,
            password: password
        });

        try {
            const response = await axios.post(loginUrl, data.toString(), {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                timeout: 5000
            });

            if (response.request?.res?.responseUrl) {
                const urlMatch = response.request.res.responseUrl.match(/sessionID=(\d+)/);
                if (urlMatch && urlMatch[1]) {
                    this.cachedSessionId = urlMatch[1];
                    this.cachedSessionTime = now;
                    return urlMatch[1];
                }
            }

            const bodyMatch = response.data.match(/sessionID=(\d+)/);
            if (bodyMatch && bodyMatch[1]) {
                this.cachedSessionId = bodyMatch[1];
                this.cachedSessionTime = now;
                return bodyMatch[1];
            }

            throw new Error("Could not find sessionID in login response.");
        } catch (e: any) {
            this.console.error("Login to camera failed:", e);
            throw e;
        }
    }

    async getVideoStream(options?: MediaStreamOptions): Promise<MediaObject> {
        const ipAddress = this.storage.getItem("ipAddress");
        if (!ipAddress) {
            throw new Error("Camera IP is not set.");
        }

        const sessionID = await this.getSessionID();
        const rtspUrl = `rtsp://${ipAddress}:554/StreamingSetting?version=1.0&action=getRTSPStream&ChannelID=1&ChannelName=Main&sessionID=${sessionID}#transport=tcp`;
        
        try {
            return await mediaManager.createFFmpegMediaObject({
                url: rtspUrl,
                inputArguments: [
                    "-fflags", "+genpts",
                    "-max_delay", "500000",
                    "-rtsp_transport", "tcp",
                    "-i", rtspUrl
                ]
            });
        } catch (e) {
            this.console.error("Failed to create ffmpeg media object:", e);
            throw e;
        }
    }
    
    async getVideoStreamOptions(): Promise<ResponseMediaStreamOptions[]> {
        return [
            {
                id: 'default',
                name: 'Default Stream',
                tool: 'ffmpeg',
                video: {
                    codec: 'h264',
                }
            } as any
        ];
    }
}

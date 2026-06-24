const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8000";

export class ActionStreamClient {
    socket: WebSocket | null = null;
    profileId: string;

    constructor(profileId: string) {
        this.profileId = profileId;
    }

    connect(onMessage: (data: any) => void) {
        const wsUrl = `${API_BASE_URL.replace("http", "ws")}/api/v1/ws/actions/${this.profileId}`;

        this.socket = new WebSocket(wsUrl);

        this.socket.onopen = () => {
            console.log("🔌 ActionStream connected");
        };

        this.socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                onMessage(data);
            } catch (e) {
                console.error("Invalid WS message", e);
            }
        };

        this.socket.onclose = () => {
            console.log("⚠️ ActionStream disconnected, retrying...");
            setTimeout(() => this.connect(onMessage), 3000);
        };
    }

    disconnect() {
        this.socket?.close();
        this.socket = null;
    }
}

import { useEffect, useState } from "react";
import { ActionStreamClient } from "./actionStreamClient";

export function useActionStream(profileId?: string) {
    const [liveActions, setLiveActions] = useState<any[]>([]);

    useEffect(() => {
        if (!profileId) return;

        const client = new ActionStreamClient(profileId);

        client.connect((event) => {
            if (event?.type === "ACTION_PACKET") {
                const action = event.payload;
                setLiveActions((prev) => [action, ...prev]);
                // Automatically emit VIEWED when action arrives and is seen
                emitFeedback("VIEWED", action);
            }
        });

        return () => {
            client.disconnect();
        };
    }, [profileId]);

    const emitFeedback = (eventType: string, action: any) => {
        const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8000";
        fetch(`${API_BASE_URL}/api/v1/feedback/events`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                profile_id: action.recipient_id || profileId,
                action_packet_id: action.id,
                event_type: eventType,
                context: action
            })
        }).catch(err => console.error("Feedback emit failed", err));
    };

    return { liveActions, emitFeedback };
}

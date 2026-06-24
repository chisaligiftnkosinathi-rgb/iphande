import { API_BASE_URL, fetchWithAuth } from "../../config/api";
import { ShareResponseOut } from "../types";

export const shareProfile = async (profileId: string): Promise<ShareResponseOut> => {
    const res = await fetch(`${API_BASE_URL}/share/profile/${profileId}`);
    if (!res.ok) throw new Error("Failed to generate share text");
    return res.json();
};

export const shareOpportunity = async (opportunityId: string): Promise<ShareResponseOut> => {
    const res = await fetch(`${API_BASE_URL}/share/opportunity/${opportunityId}`);
    if (!res.ok) throw new Error("Failed to generate share text");
    return res.json();
};

export const shareQuote = async (quoteId: string): Promise<ShareResponseOut> => {
    const res = await fetch(`${API_BASE_URL}/share/quote/${quoteId}`);
    if (!res.ok) throw new Error("Failed to generate share text");
    return res.json();
};

export const shareProofOfWork = async (eventId: string): Promise<ShareResponseOut> => {
    const res = await fetch(`${API_BASE_URL}/share/continuity-event/${eventId}`);
    if (!res.ok) throw new Error("Failed to generate share text");
    return res.json();
};

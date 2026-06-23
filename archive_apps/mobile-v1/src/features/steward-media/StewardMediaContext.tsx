import React, { ReactNode, createContext, useContext, useState } from 'react';
import { StewardMediaDraft, createEmptyStewardMediaDraft } from './stewardMediaDraft';

interface StewardMediaContextValue {
    draft: StewardMediaDraft;
    setDraft: (draft: StewardMediaDraft) => void;
    resetDraft: () => void;
}

const StewardMediaContext = createContext<StewardMediaContextValue | undefined>(undefined);

export const StewardMediaProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [draft, setDraft] = useState<StewardMediaDraft>(createEmptyStewardMediaDraft());

    const resetDraft = () => setDraft(createEmptyStewardMediaDraft());

    return (
        <StewardMediaContext.Provider value={{ draft, setDraft, resetDraft }}>
            {children}
        </StewardMediaContext.Provider>
    );
};

export function useStewardMedia() {
    const ctx = useContext(StewardMediaContext);
    if (!ctx) throw new Error('useStewardMedia must be used within a StewardMediaProvider');
    return ctx;
}

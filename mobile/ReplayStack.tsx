import React from 'react';
import { ReplayTimelineScreen } from './screens/ReplayTimelineScreen';

export type ReplayStackParamList = {
    ReplayTimeline: undefined;
    ReplayEventDetail: { eventId: string };
    EntityReplay: { entityId: string; entityType: string };
};

export const ReplayStack = () => {
    return <ReplayTimelineScreen />;
};

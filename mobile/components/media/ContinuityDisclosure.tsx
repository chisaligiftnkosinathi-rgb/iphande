import React from 'react';
import theme from '../../theme';
import { RealityBoundary } from '../ui/RealityBoundary';

export const ContinuityDisclosure: React.FC = () => (
    <RealityBoundary style={{ marginBottom: theme.layout.spacing.xxl }}>
        This study is based only on known business continuity and uploaded media.{"\n\n"}
        The system may misunderstand context.{"\n\n"}
        Please review carefully before approving any intent.
    </RealityBoundary>
);

import { NEED_REGISTRY } from './needRegistry';
import { VBA_CALIBRATION_REGISTRY } from './vbaCalibrationRegistry';

/**
 * Layer 16 - Dispatch Engine
 * Routes user input to active stewardship nodes (The Council).
 */
export interface StewardDispatch {
    detectedNeed: string;
    suggestedRole: string;
    activatedNodes: string[];
    questions: {
        nodeKey: string;
        prompt: string;
    }[];
}

export const dispatchCouncil = (input: string): StewardDispatch => {
    const text = input.toLowerCase();
    let needKey = 'daily_check_in';
    let roleKey = 'steward';
    let nodes: string[] = ['administration', 'growth'];

    // 1. Detect Need & Role (Simplified pattern matching for prototype)
    if (text.includes("fix") || text.includes("pipe") || text.includes("drove") || text.includes("km")) {
        needKey = 'repair_needed';
        roleKey = NEED_REGISTRY['repair_needed'].suggestedRoleKey;
        nodes = ['trade', 'finance', 'memory', 'trust'];
    } else if (text.includes("groceries") || text.includes("food") || text.includes("eat")) {
        needKey = 'food_needed';
        roleKey = NEED_REGISTRY['food_needed'].suggestedRoleKey;
        nodes = ['provision', 'finance', 'opportunity'];
    } else if (text.includes("customer") || text.includes("work") || text.includes("find")) {
        needKey = 'administration_needed'; // Or a more specific 'find_work' need
        roleKey = 'seller';
        nodes = ['visibility', 'opportunity', 'customer'];
    }

    // 2. Resolve Questions from Activated Nodes
    const questions = nodes.map(nodeKey => {
        const node = VBA_CALIBRATION_REGISTRY[nodeKey];
        return {
            nodeKey,
            // Pick the most relevant question or a default
            prompt: node?.questions[0] || `The ${node?.label} is listening.`
        };
    });

    return {
        detectedNeed: needKey,
        suggestedRole: roleKey,
        activatedNodes: nodes,
        questions
    };
};

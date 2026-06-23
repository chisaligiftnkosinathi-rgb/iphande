export interface AuditRecord {
    actor: string;
    action: string;
    timestamp: number;
    result: 'SUCCESS' | 'FAILURE';
    details?: any;
}

export class GovernanceAuditEngine {
    private records: AuditRecord[] = [];

    /**
     * Records a governance action to the audit log.
     * This creates the "institutional memory" of the SANAS system.
     */
    record(actor: string, action: string, result: 'SUCCESS' | 'FAILURE', details?: any): void {
        const entry: AuditRecord = {
            actor,
            action,
            timestamp: Date.now(),
            result,
            details
        };
        this.records.push(Object.freeze(entry));
    }

    getHistory(): AuditRecord[] {
        return [...this.records];
    }
}

export const auditEngine = new GovernanceAuditEngine();

export type EventSchema = {
    type: string;
    version: number;
    requiredFields: string[];
};

export class EventSchemaRegistry {
    private schemas: Record<string, EventSchema> = {};

    register(schema: EventSchema) {
        this.schemas[`${schema.type}@${schema.version}`] = schema;
    }

    validate(type: string, version: number, payload: any): boolean {
        const schema = this.schemas[`${type}@${version}`];
        if (!schema) return false;

        return schema.requiredFields.every((field) => field in payload);
    }
}

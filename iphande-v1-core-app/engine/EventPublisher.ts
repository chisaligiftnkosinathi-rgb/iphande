import crypto from "crypto";

export class EventPublisher {
  private endpoint: string;

  constructor() {
    this.endpoint = process.env.AXIONYX_INGEST_URL || "http://localhost:3000";
  }

  private hash(payload: any) {
    return crypto
      .createHash("sha256")
      .update(JSON.stringify(payload))
      .digest("hex");
  }

  async publishTrustCalibration(data: {
    event_id: string;
    trust_score: number;
    delta: number;
  }) {
    const event = {
      event_id: data.event_id,
      source: "iphande",
      type: "trust_calibration",
      timestamp: new Date().toISOString(),

      verification_level: "validated",

      payload: {
        trust_score: data.trust_score,
        delta: data.delta
      },

      hash: this.hash(data)
    };

    const res = await fetch(`${this.endpoint}/api/ingest`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(event)
    });

    return res.json();
  }
}

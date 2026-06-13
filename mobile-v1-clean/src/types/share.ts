export interface ShareResponseOut {
    share_text: string;
    source_type: "profile" | "opportunity" | "quote" | "proof_of_work";
    source_id: string;
    generated_from: "preserved_truth";
}

export interface ExpenseCreate {
    business_owner_id: string;
    amount: number;
    category: string;
    description: string;
    date: string; // ISO format date YYYY-MM-DD
    receipt_photo_url?: string;
}

export interface ExpenseOut extends ExpenseCreate {
    id: string;
    created_at: string;
}

export interface ExpenseSummaryOut {
    income: string; // formatted decimal
    expenses: string; // formatted decimal
    net_position: string; // formatted decimal
    start_date: string;
    end_date: string;
}

import { apiGet } from './apiClient';

export type FinancialEventType =
    | 'income_received'
    | 'expense_paid'
    | 'debt_created'
    | 'debt_paid'
    | 'stock_purchased'
    | 'asset_acquired'
    | 'customer_owed'
    | 'supplier_owed'
    | 'owner_withdrawal'
    | 'savings_set_aside';

export type AccountingCategory = 'Asset' | 'Liability' | 'Equity' | 'Income' | 'Expense';
export type CashDirection = 'inflow' | 'outflow' | 'none';

export type FinancialEvent = {
    id: string;
    business_owner_id: string;
    event_type: FinancialEventType;
    amount: string;
    currency: string;
    description: string;
    occurred_at: string;
    accounting_category: AccountingCategory;
    cash_direction: CashDirection;
    source_actor?: string | null;
    counterparty?: string | null;
    creates_obligation: boolean;
    continuity_event_id: string;
    created_at: string;
};

export type CashReplay = {
    business_owner_id: string;
    currency: string;
    inflow_total: string;
    outflow_total: string;
    net_cash: string;
    events: FinancialEvent[];
};

export type ProfitSnapshot = {
    business_owner_id: string;
    currency: string;
    income_total: string;
    expense_total: string;
    profit: string;
};

export type ObligationView = {
    business_owner_id: string;
    currency: string;
    obligation_total: string;
    obligations: FinancialEvent[];
};

export async function fetchCashReplay(businessOwnerId: string): Promise<CashReplay> {
    return apiGet<CashReplay>(`/api/v1/financial-events/business/${businessOwnerId}/cash-replay`);
}

export async function fetchProfitSnapshot(businessOwnerId: string): Promise<ProfitSnapshot> {
    return apiGet<ProfitSnapshot>(`/api/v1/financial-events/business/${businessOwnerId}/profit-snapshot`);
}

export async function fetchObligations(businessOwnerId: string): Promise<ObligationView> {
    return apiGet<ObligationView>(`/api/v1/financial-events/business/${businessOwnerId}/obligations`);
}

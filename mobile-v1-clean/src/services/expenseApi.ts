import { API_BASE_URL, fetchWithAuth } from "../config/api";
import { ExpenseCreate, ExpenseOut, ExpenseSummaryOut } from "../types";

export const createExpense = async (data: ExpenseCreate): Promise<ExpenseOut> => {
    const res = await fetch(`${API_BASE_URL}/expenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        throw new Error("Failed to create expense");
    }
    return res.json();
};

export const getExpenses = async (business_owner_id: string): Promise<ExpenseOut[]> => {
    const res = await fetch(`${API_BASE_URL}/expenses?business_owner_id=${business_owner_id}`);
    if (!res.ok) {
        throw new Error("Failed to fetch expenses");
    }
    return res.json();
};

export const getExpenseSummary = async (
    business_owner_id: string,
    start_date?: string,
    end_date?: string
): Promise<ExpenseSummaryOut> => {
    const url = new URL(`${API_BASE_URL}/expenses/summary`);
    url.searchParams.append("business_owner_id", business_owner_id);
    if (start_date) url.searchParams.append("start_date", start_date);
    if (end_date) url.searchParams.append("end_date", end_date);

    const res = await fetch(url.toString());
    if (!res.ok) {
        throw new Error("Failed to fetch expense summary");
    }
    return res.json();
};

export const getExpenseCategories = async (archetype_key?: string): Promise<string[]> => {
    const url = new URL(`${API_BASE_URL}/expenses/categories`);
    if (archetype_key) {
        url.searchParams.append("archetype_key", archetype_key);
    }
    const res = await fetch(url.toString());
    if (!res.ok) {
        throw new Error("Failed to fetch expense categories");
    }
    const data = await res.json();
    return data.categories;
};

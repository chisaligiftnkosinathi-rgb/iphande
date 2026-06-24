import { fetchWithAuth } from "../../config/api";
import { ExpenseCreate, ExpenseOut, ExpenseSummaryOut } from "../types";

export const createExpense = async (data: ExpenseCreate): Promise<ExpenseOut> => {
    return await fetchWithAuth("/expenses", {
        method: "POST",
        body: JSON.stringify(data),
    });
};

export const getExpenses = async (business_owner_id: string): Promise<ExpenseOut[]> => {
    return await fetchWithAuth(`/expenses?business_owner_id=${business_owner_id}`);
};

export const getExpenseSummary = async (
    business_owner_id: string,
    start_date?: string,
    end_date?: string
): Promise<ExpenseSummaryOut> => {
    let url = `/expenses/summary?business_owner_id=${business_owner_id}`;
    if (start_date) url += `&start_date=${start_date}`;
    if (end_date) url += `&end_date=${end_date}`;

    return await fetchWithAuth(url);
};

export const getExpenseCategories = async (archetype_key?: string): Promise<string[]> => {
    let url = `/expenses/categories`;
    if (archetype_key) {
        url += `?archetype_key=${archetype_key}`;
    }
    const data = await fetchWithAuth(url);
    return data.categories;
};

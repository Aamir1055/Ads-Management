import axios from 'axios';
import { getAuthHeader } from '../utils/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface Account {
    id: number;
    account_name: string;
    amount: number;
}

export const getAccounts = async (): Promise<Account[]> => {
    try {
        const response = await axios.get(`${API_URL}/accounts`, {
            headers: await getAuthHeader()
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching accounts:', error);
        throw error;
    }
};

export const createAccount = async (accountData: { account_name: string; amount?: number }): Promise<Account> => {
    try {
        const response = await axios.post(`${API_URL}/accounts`, accountData, {
            headers: await getAuthHeader()
        });
        return response.data;
    } catch (error) {
        console.error('Error creating account:', error);
        throw error;
    }
};

export const getAccountById = async (id: number): Promise<Account> => {
    try {
        const response = await axios.get(`${API_URL}/accounts/${id}`, {
            headers: await getAuthHeader()
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching account:', error);
        throw error;
    }
};

export const addAmount = async (
    id: number,
    amount: number
): Promise<{ success: boolean; message: string; data?: any }> => {
    try {
        const response = await axios.post(
            `${API_URL}/accounts/${id}/add-amount`,
            { amount },
            { headers: await getAuthHeader() }
        );
        return response.data;
    } catch (err: any) {
        // Map 403 Forbidden to a clear permission message for UI
        if (err?.response?.status === 403) {
            const e = new Error("You don't have permission to update this account.");
            (e as any).code = 'NO_UPDATE_PERMISSION';
            throw e;
        }
        console.error('API addAmount error:', err?.response?.data || err);
        throw err;
    }
};

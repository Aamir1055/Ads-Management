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
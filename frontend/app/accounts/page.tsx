import { useState, useEffect } from 'react';
import { getAccounts } from '../services/accountService';
import type { Account } from '../services/accountService';
import type { Card } from '../types/card';
import axios from 'axios';
import AccountModal from '../components/AccountModal';
import { RefreshCw, Plus } from 'lucide-react';
import { formatDate } from '../../src/utils/dateUtils';

export default function AccountsPage() {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
    const [accountCards, setAccountCards] = useState<Card[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadAccounts();
    }, []);

    const loadAccounts = async () => {
        try {
            setIsLoading(true);
            const data = await getAccounts();
            // accommodate API returning { success, data } or raw array
            const list = Array.isArray(data) ? data : data?.data || [];
            setAccounts(list);
        } catch (err) {
            setError('Failed to load accounts');
            console.error('Error loading accounts:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const loadAccountCards = async (accountId: number) => {
        try {
            const response = await axios.get(`/api/cards/by-account/${accountId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const cards = response.data?.data ?? response.data ?? [];
            setAccountCards(cards);
        } catch (err) {
            setError('Failed to load account cards');
            console.error('Error loading account cards:', err);
        }
    };

    const handleAccountClick = async (account: Account) => {
        setSelectedAccount(account);
        await loadAccountCards(account.id);
        setIsModalOpen(true);
    };

    const formatAmount = (amount: number | undefined) => {
        if (amount == null) return '-';
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    const formatDateForDisplay = (dateString: string | undefined) => {
        if (!dateString) return '-';
        try {
            return formatDate(dateString);
        } catch (e) {
            return dateString;
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Accounts</h1>
                    <p className="text-gray-600 mt-2">Manage your accounts and associated cards</p>
                </div>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={loadAccounts}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                    </button>
                    <button
                        onClick={() => window.scrollTo(0, 0)}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Account
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            <div className="bg-white shadow overflow-hidden sm:rounded-md">
                {isLoading ? (
                    <div className="text-center py-12">
                        <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400" />
                        <p className="text-gray-500 mt-2">Loading accounts...</p>
                    </div>
                ) : accounts.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="text-gray-400 mb-4">
                            <Plus className="h-12 w-12 mx-auto" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No accounts found</h3>
                        <p className="text-gray-500 mb-4">Create an account to start assigning cards.</p>
                    </div>
                ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {accounts.map((acc) => (
                                <tr key={acc.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900 cursor-pointer" onClick={() => handleAccountClick(acc)}>
                                            {acc.account_name}
                                        </div>
                                        <div className="text-sm text-gray-500">ID: {acc.id}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{formatAmount(acc.amount)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{formatDateForDisplay((acc as any).created_at)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex items-center space-x-3">
                                            <button
                                                onClick={() => handleAccountClick(acc)}
                                                className="text-blue-600 hover:text-blue-900 transition-colors"
                                            >
                                                View
                                            </button>
                                            {/* future: Edit/Delete actions can be added here */}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {selectedAccount && (
                <AccountModal
                    isOpen={isModalOpen}
                    onClose={() => {
                        setIsModalOpen(false);
                        setSelectedAccount(null);
                        setAccountCards([]);
                    }}
                    account={selectedAccount}
                    cards={accountCards}
                />
            )}
        </div>
    );
}
import { useEffect, useState } from 'react';
import { Dialog } from '@headlessui/react';
import { getAccounts } from '../services/accountService';
import type { Account } from '../services/accountService';

interface CardFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
    initialData?: any;
}

export default function CardForm({ isOpen, onClose, onSubmit, initialData }: CardFormProps) {
    const [formData, setFormData] = useState({
        card_name: '',
        card_number_last4: '',
        card_type: '',
        credit_limit: '',
        account_id: '',
        ...initialData
    });
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        loadAccounts();
    }, []);

    const loadAccounts = async () => {
        try {
            setLoading(true);
            const fetchedAccounts = await getAccounts();
            setAccounts(fetchedAccounts);
        } catch (err) {
            setError('Failed to load accounts');
            console.error('Error loading accounts:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <Dialog open={isOpen} onClose={onClose} className="relative z-50">
            <div className="fixed inset-0 bg-black/30" />
            <div className="fixed inset-0 overflow-y-auto">
                <div className="flex min-h-full items-center justify-center p-4">
                    <Dialog.Panel className="bg-white rounded-lg p-6 w-full max-w-md">
                        <Dialog.Title className="text-lg font-medium mb-4">
                            {initialData ? 'Edit Card' : 'Add New Card'}
                        </Dialog.Title>

                        {error && (
                            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Account *
                                    </label>
                                    <select
                                        name="account_id"
                                        value={formData.account_id}
                                        onChange={handleChange}
                                        required
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    >
                                        <option value="">Select an account</option>
                                        {accounts.map(account => (
                                            <option key={account.id} value={account.id}>
                                                {account.account_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Card Name *
                                    </label>
                                    <input
                                        type="text"
                                        name="card_name"
                                        value={formData.card_name}
                                        onChange={handleChange}
                                        required
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Last 4 Digits
                                    </label>
                                    <input
                                        type="text"
                                        name="card_number_last4"
                                        value={formData.card_number_last4}
                                        onChange={handleChange}
                                        maxLength={4}
                                        pattern="[0-9]{4}"
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Card Type
                                    </label>
                                    <select
                                        name="card_type"
                                        value={formData.card_type}
                                        onChange={handleChange}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    >
                                        <option value="">Select type</option>
                                        <option value="Visa">Visa</option>
                                        <option value="MasterCard">MasterCard</option>
                                        <option value="Amex">American Express</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Credit Limit
                                    </label>
                                    <input
                                        type="number"
                                        name="credit_limit"
                                        value={formData.credit_limit}
                                        onChange={handleChange}
                                        min="0"
                                        step="0.01"
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="mt-6 flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-4 py-2 border rounded-md text-gray-600 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
                                >
                                    {loading ? 'Loading...' : initialData ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </Dialog.Panel>
                </div>
            </div>
        </Dialog>
    );
}
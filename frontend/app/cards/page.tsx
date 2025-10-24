import { useState, useEffect } from 'react';
import axios from 'axios';
import { PlusIcon } from '@heroicons/react/24/outline';
import CardForm from '../components/CardForm';
import { Card } from '../types/card';
import { Account, getAccounts } from '../services/accountService';
import AccountModal from '../components/AccountModal';

export default function CardsPage() {
    const [cards, setCards] = useState<Card[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
    const [accountCards, setAccountCards] = useState<Card[]>([]);

    useEffect(() => {
        fetchCards();
    }, []);

    useEffect(() => {
        // load accounts created by logged-in user
        (async () => {
            try {
                const data = await getAccounts();
                if (Array.isArray(data)) setAccounts(data);
                else if (data && Array.isArray((data as any).accounts)) setAccounts((data as any).accounts);
                else setAccounts([]);
            } catch (err) {
                console.error('Failed to load accounts', err);
            }
        })();
    }, []);

    const fetchCards = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/cards', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            setCards(response.data);
        } catch (err) {
            setError('Failed to load cards');
            console.error('Error loading cards:', err);
        } finally {
            setLoading(false);
        }
    };

    const loadAccounts = async () => {
        try {
            const data = await getAccounts();
            // accounts API returns an array of accounts. Some API variants return { accounts: [...] }
            if (Array.isArray(data)) {
                setAccounts(data);
            } else if (data && typeof data === 'object' && Array.isArray((data as any).accounts)) {
                setAccounts((data as any).accounts);
            } else {
                setAccounts([]);
            }
        } catch (err) {
            console.error('Error loading accounts:', err);
        }
    };

    const loadAccountCards = async (accountId: number) => {
        try {
            const response = await axios.get(`/api/cards/by-account/${accountId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            setAccountCards(response.data);
        } catch (err) {
            console.error('Error loading account cards:', err);
            setAccountCards([]);
        }
    };

    const handleCreateCard = async (data: Partial<Card>) => {
        try {
            await axios.post('/api/cards', data, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            setIsModalOpen(false);
            fetchCards(); // Refresh the cards list
        } catch (err) {
            setError('Failed to create card');
            console.error('Error creating card:', err);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold text-gray-900">Cards</h1>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                    Add Card
                </button>
            </div>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            {/* Accounts buttons - show accounts created by the logged-in user */}
            {accounts.length > 0 && (
                <div className="mb-6">
                    <div className="flex flex-wrap gap-3">
                        {accounts.map((acct) => (
                            <button
                                key={acct.id}
                                onClick={async () => {
                                    setSelectedAccount(acct);
                                    await loadAccountCards(acct.id);
                                    setIsModalOpen(true);
                                }}
                                className="px-3 py-2 bg-white border rounded-md text-sm hover:shadow cursor-pointer"
                            >
                                {acct.account_name}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {loading ? (
                <div className="text-center py-4">Loading...</div>
            ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {cards.map((card) => (
                        <div
                            key={card.id}
                            className="bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow duration-200"
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900">{card.card_name}</h3>
                                    {card.card_number_last4 && (
                                        <p className="text-sm text-gray-500">
                                            Card ending in {card.card_number_last4}
                                        </p>
                                    )}
                                </div>
                                <span className={`px-2 py-1 text-xs font-semibold rounded ${
                                    card.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                    {card.is_active ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                            
                            <div className="mt-4 space-y-2">
                                {card.card_type && (
                                    <p className="text-sm text-gray-600">
                                        <span className="font-medium">Type:</span> {card.card_type}
                                    </p>
                                )}
                                {card.credit_limit && (
                                    <p className="text-sm text-gray-600">
                                        <span className="font-medium">Credit Limit:</span>{' '}
                                        ${card.credit_limit.toLocaleString()}
                                    </p>
                                )}
                                <p className="text-sm text-gray-600">
                                    <span className="font-medium">Balance:</span>{' '}
                                    ${card.current_balance?.toLocaleString() ?? '0'}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <CardForm
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleCreateCard}
            />
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
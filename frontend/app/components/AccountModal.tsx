import { Dialog } from '@headlessui/react';
import type { Account } from '../services/accountService';
import type { Card } from '../types/card';

interface AccountModalProps {
    isOpen: boolean;
    onClose: () => void;
    account: Account;
    cards: Card[];
}

export default function AccountModal({ isOpen, onClose, account, cards }: AccountModalProps) {
    const formatAmount = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    return (
        <Dialog open={isOpen} onClose={onClose} className="relative z-50">
            <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
            <div className="fixed inset-0 overflow-y-auto">
                <div className="flex min-h-full items-center justify-center p-4">
                    <Dialog.Panel className="w-full max-w-3xl bg-white rounded-lg p-6">
                        <Dialog.Title className="text-lg font-medium mb-4">
                            Account Details: {account.account_name}
                        </Dialog.Title>

                        <div className="bg-gray-50 rounded-lg p-4 mb-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-600">Account ID</p>
                                    <p className="text-lg font-medium">{account.id}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Total Balance</p>
                                    <p className="text-lg font-medium text-blue-600">
                                        {formatAmount(account.amount)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="mb-4">
                            <h3 className="text-lg font-medium mb-3">Associated Cards</h3>
                            {cards.length === 0 ? (
                                <p className="text-gray-600">No cards found for this account.</p>
                            ) : (
                                <div className="space-y-4">
                                    {cards.map((card) => (
                                        <div
                                            key={card.id}
                                            className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow duration-200"
                                        >
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h4 className="font-medium text-gray-900">
                                                        {card.card_name}
                                                    </h4>
                                                    {card.card_number_last4 && (
                                                        <p className="text-sm text-gray-600">
                                                            Card ending in {card.card_number_last4}
                                                        </p>
                                                    )}
                                                </div>
                                                <span
                                                    className={`px-2 py-1 text-xs font-semibold rounded ${
                                                        card.is_active
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-red-100 text-red-800'
                                                    }`}
                                                >
                                                    {card.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </div>
                                            <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <span className="text-gray-600">Type:</span>{' '}
                                                    {card.card_type || 'N/A'}
                                                </div>
                                                <div>
                                                    <span className="text-gray-600">Balance:</span>{' '}
                                                    {formatAmount(card.current_balance || 0)}
                                                </div>
                                                {card.credit_limit && (
                                                    <div>
                                                        <span className="text-gray-600">
                                                            Credit Limit:
                                                        </span>{' '}
                                                        {formatAmount(card.credit_limit)}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="mt-6 flex justify-end">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                            >
                                Close
                            </button>
                        </div>
                    </Dialog.Panel>
                </div>
            </div>
        </Dialog>
    );
}
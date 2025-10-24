import React from 'react'

const AccountModal = ({ isOpen, onClose, account, cards }) => {
  if (!isOpen || !account) return null

  const formatAmount = (amount) => {
    try {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
    } catch (e) { return amount }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="fixed inset-0 bg-black opacity-30" onClick={onClose}></div>
        <div className="relative bg-white rounded-lg shadow-xl max-w-3xl w-full z-10 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">Account: {account.account_name}</h3>
            <button className="text-sm text-gray-600" onClick={onClose}>Close</button>
          </div>

          <div className="mb-4">
            <div className="text-sm text-gray-600">Account ID: {account.id}</div>
            <div className="text-sm text-blue-600 font-semibold">Balance: {formatAmount(account.amount || 0)}</div>
          </div>

          <div>
            <h4 className="font-medium mb-2">Associated Cards</h4>
            {(!cards || cards.length === 0) ? (
              <p className="text-sm text-gray-500">No cards found for this account.</p>
            ) : (
              <div className="space-y-3">
                {cards.map((c) => (
                  <div key={c.id} className="p-3 border rounded">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">{c.card_name}</div>
                        <div className="text-sm text-gray-500">Ending {c.card_number_last4}</div>
                      </div>
                      <div className="text-sm text-gray-600">{c.card_type || 'N/A'}</div>
                    </div>
                    <div className="mt-2 text-sm text-gray-700">Balance: {Number(c.current_balance || 0).toFixed(2)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AccountModal

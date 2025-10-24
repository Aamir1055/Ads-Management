import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { RefreshCw, CreditCard, ArrowLeft } from 'lucide-react'
import cardsService from '../services/cardsService'

const AccountCards = () => {
  const { accountId } = useParams()
  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchCards = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await cardsService.getByAccount(accountId)
      const list = Array.isArray(res?.data?.cards) ? res.data.cards : (Array.isArray(res) ? res : res?.cards || [])
      setCards(list)
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load cards')
      setCards([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCards()
  }, [accountId])

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link to="/cards" className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md bg-white text-sm text-gray-700 hover:bg-gray-50">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Accounts
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <CreditCard className="h-7 w-7 text-blue-600" /> Account {accountId} - Cards
          </h1>
        </div>
        <button onClick={fetchCards} disabled={loading} className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-md bg-red-50 border border-red-200 p-4 text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      ) : cards.length === 0 ? (
        <div className="text-center py-12">
          <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No cards found for this account</h3>
          <p className="text-gray-500">Create a card and assign it to this account.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map(card => (
            <div key={card.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{card.card_name}</h3>
                <p className="text-sm text-gray-600 mb-4">Card ID: {card.id}</p>
                <div className="grid grid-cols-1 gap-2">
                  {card.card_type && (
                    <p className="text-sm text-gray-700">Type: {card.card_type}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default AccountCards

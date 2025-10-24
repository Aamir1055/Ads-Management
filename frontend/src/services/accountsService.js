import api from './api'

const ENDPOINT = '/accounts'

const accountsService = {
  createAccount: async (data) => {
    try {
      const res = await api.post(ENDPOINT, data)
      return res.data
    } catch (err) {
      console.error('API createAccount error:', err.response?.data || err)
      return err.response?.data || { success: false, message: err.message }
    }
  },

  getAll: async () => {
    try {
      const res = await api.get(ENDPOINT)
      return res.data
    } catch (err) {
      console.error('API getAll accounts error:', err.response?.data || err)
      return err.response?.data || { success: false, message: err.message }
    }
  },

  addAmount: async (id, amount) => {
    try {
      const res = await api.post(`${ENDPOINT}/${id}/add-amount`, { amount })
      return res.data
    } catch (err) {
      console.error('API addAmount error:', err.response?.data || err)
      return err.response?.data || { success: false, message: err.message }
    }
  }
}

export default accountsService

import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export const getUsers = async () => {
  return axios.get(`${API_URL}/users`);
};

export const getUserById = async (id) => {
  return axios.get(`${API_URL}/users/${id}`);
};

export const createUser = async (userData) => {
  return axios.post(`${API_URL}/users`, userData);
};

export const updateUser = async (id, userData) => {
  return axios.put(`${API_URL}/users/${id}`, userData);
};

export const deleteUser = async (id) => {
  return axios.delete(`${API_URL}/users/${id}`);
};

export const toggleUserStatus = async (id) => {
  return axios.patch(`${API_URL}/users/${id}/toggle-status`);
};

const API_BASE_URL = 'http://localhost:5000';

export default API_BASE_URL;

// Then use it in your API calls:
import API_BASE_URL from './config';

const login = async (email, password) => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password })
  });
  return response.json();
};
import axios from 'axios'

const instance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL + "/api",
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
})

export default instance
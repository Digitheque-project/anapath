import axios from 'axios';

/** Client HTTP partagé — timeout élevé pour le cold start Render (plan gratuit). */
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '/api',
  timeout: 60_000,
  headers: { 'Content-Type': 'application/json' },
});

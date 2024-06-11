export const OVERRIDE_API = false;


export const API_URL = (import.meta.env.MODE === 'development' || !OVERRIDE_API) ? 'http://localhost:8000/' : 'https://pseapi.thies.dev/'
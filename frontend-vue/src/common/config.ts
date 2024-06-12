export const ALWAYS_USE_PROD = true;

const API_DEV_URL = 'http://localhost:8000/';
const API_PROD_URL = 'https://pseapi.thies.dev/';

export const API_URL = (ALWAYS_USE_PROD ? API_PROD_URL : (
    import.meta.env.MODE === 'development' ? API_DEV_URL : API_PROD_URL
))


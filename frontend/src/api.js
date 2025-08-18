// src/api.js
import axios from "axios";

/**
 * Priorité :
 * 1) Vite: VITE_API_BASE_URL
 * 2) CRA : REACT_APP_API_BASE
 * 3) Fallback prod : Render
 * La valeur doit inclure /api à la fin
 */
const API_BASE =
  (typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_API_BASE_URL) ||
  process.env.REACT_APP_API_BASE ||
  "https://jiconnect-backend.onrender.com/api";

const api = axios.create({ baseURL: API_BASE });

export default api;
export { API_BASE };

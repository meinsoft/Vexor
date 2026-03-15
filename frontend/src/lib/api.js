import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000"
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("vexor_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("vexor_token");
      localStorage.removeItem("vexor_user");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export function login(email, password) {
  return api.post("/auth/login", { email, password });
}
export function register(email, password, company) {
  return api.post("/auth/register", { email, password, company });
}

export function analyze(email_body, sender_email, reply_to) {
  return api.post("/analyze", { email_body, sender_email, reply_to });
}

export function getMyStats() {
  return api.get("/stats/me");
}

export function getOverview() {
  return api.get("/stats/overview");
}

export function getTimeline() {
  return api.get("/stats/timeline");
}

export function createDrill(payload) {
  return api.post("/drill/create", payload);
}

export function listDrills() {
  return api.get("/drill/list");
}

export function getDrillResults(drillId) {
  return api.get(`/drill/results/${drillId}`);
}

export default api;

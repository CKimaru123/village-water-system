const BASE_URL = "http://localhost:3001/api/v1";

const getHeaders = (isFormData = false) => {
  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };
  if (!isFormData) headers["Content-Type"] = "application/json";
  return headers;
};

const request = async (method, path, body = null, isFormData = false) => {
  const options = { method, headers: getHeaders(isFormData) };
  if (body) options.body = isFormData ? body : JSON.stringify(body);
  const res = await fetch(`${BASE_URL}${path}`, options);

  // Safely parse JSON — some responses (204, empty 422s) have no body
  let data = {};
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    try { data = await res.json(); } catch (_) { data = {}; }
  }

  if (res.status === 401) {
    window.dispatchEvent(new CustomEvent("session:expired"));
    throw new Error("Session expired. Please log in again.");
  }
  if (!res.ok) throw new Error(data.message || data.error || `Request failed (${res.status})`);
  return data;
};

export const api = {
  get:    (path)         => request("GET",    path),
  post:   (path, body)   => request("POST",   path, body),
  patch:  (path, body)   => request("PATCH",  path, body),
  put:    (path, body)   => request("PUT",    path, body),
  delete: (path)         => request("DELETE", path),
  upload: (path, form)   => request("POST",   path, form, true),
};

export default api;

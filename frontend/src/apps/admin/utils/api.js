const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api/v1';

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
  const data = await res.json();
  if (res.status === 401) {
    window.dispatchEvent(new CustomEvent("session:expired"));
    throw new Error("Session expired. Please log in again.");
  }
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
};

export const adminApi = {
  get:    (path)         => request("GET",    path),
  post:   (path, body)   => request("POST",   path, body),
  patch:  (path, body)   => request("PATCH",  path, body),
  put:    (path, body)   => request("PUT",    path, body),
  delete: (path)         => request("DELETE", path),
  upload: (path, form)   => request("POST",   path, form, true),
};

export default adminApi;

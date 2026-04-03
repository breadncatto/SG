import axios from "axios";

export const api = axios.create({
  baseURL: "https://mac4tpet6z.ap-southeast-1.awsapprunner.com",
  headers: {
    "Content-Type": "application/json",
  },
});

export const setAuthToken = (token: string) => {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    localStorage.setItem("token", token);
  } else {
    delete api.defaults.headers.common["Authorization"];
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
  }
};
import useAsync from "./useAsync";

// const DEFAULT_OPTIONS = {
//   headers: { "Content-Type": "application/json" },
// };

const apiKeyStored = JSON.parse(localStorage.getItem("api-key"));

const DEFAULT_OPTIONS = {
  method: "POST",
  headers: {
    Authorization: "Bearer " + apiKeyStored,
    "Content-Type": "application/json",
  },
};

export default function useFetch(url, options = {}, dependencies = []) {
  return useAsync(() => {
    return fetch(url, { ...DEFAULT_OPTIONS, ...options }).then((res) => {
      if (res.ok) return res.json();
      return res.json().then((json) => Promise.reject(json));
    });
  }, dependencies);
}

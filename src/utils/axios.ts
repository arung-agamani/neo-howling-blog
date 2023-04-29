import a, { AxiosError } from "axios";

const axios = a.create();

axios.interceptors.request.use((config) => {
    if (process.env.NODE_ENV === "development") {
        console.log(config);
    }
    return config;
});

axios.interceptors.response.use(
    (res) => res,
    (err) => {
        if (
            err.response.status == 401 &&
            !window.location.href.endsWith("/dashboard")
        ) {
            window.location.assign("/dashboard");
        } else {
            return Promise.reject(err);
        }
    }
);

export default axios;

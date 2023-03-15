import axios, { AxiosError } from "axios";

const instance = axios.create();

instance.interceptors.request.use((config) => {
    if (process.env.NODE_ENV === "development") {
        console.log(config);
    }
    return config;
});

instance.interceptors.response.use(
    (res) => res,
    (err) => {
        if (err.response.status == 401) {
            window.location.assign("/dashboard/");
        } else {
            return Promise.reject(err);
        }
    }
);

export default instance;

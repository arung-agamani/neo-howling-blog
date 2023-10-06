import {
    configureStore,
    combineReducers,
    Reducer,
    AnyAction,
} from "@reduxjs/toolkit";
import { persistReducer } from "redux-persist";
import logger from "redux-logger";
import { userReducer } from "./slice/user";
import storage from "./storage";

type InferState<Type> = Type extends Reducer<infer S> ? S : never;

type State<
    T extends typeof reducers = typeof reducers,
    P extends keyof T = keyof T
> = {
    [K in P]: InferState<T[K]>;
};

const persistConfig = {
    key: "root",
    storage: storage,
};

const reducers = {
    user: userReducer,
};

const rootReducer = combineReducers(reducers);
const persistedReducer = persistReducer<State, AnyAction>(
    persistConfig,
    rootReducer
);
export const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({ serializableCheck: false }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

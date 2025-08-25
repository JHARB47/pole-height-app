export default useAppStore;
declare const useAppStore: import("zustand").UseBoundStore<Omit<import("zustand").StoreApi<any>, "setState" | "persist"> & {
    setState(partial: any, replace?: false): unknown;
    setState(state: any, replace: true): unknown;
    persist: {
        setOptions: (options: Partial<import("zustand/middleware").PersistOptions<any, any, unknown>>) => void;
        clearStorage: () => void;
        rehydrate: () => Promise<void> | void;
        hasHydrated: () => boolean;
        onHydrate: (fn: (state: any) => void) => () => void;
        onFinishHydration: (fn: (state: any) => void) => () => void;
        getOptions: () => Partial<import("zustand/middleware").PersistOptions<any, any, unknown>>;
    };
}>;

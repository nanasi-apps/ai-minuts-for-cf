export interface Toast {
    id: number;
    message: string;
    type: 'success' | 'error' | 'info';
    duration?: number;
}

export const useToast = () => {
    const toasts = useState<Toast[]>('toasts', () => []);

    const addToast = (message: string, type: 'success' | 'error' | 'info' = 'info', duration = 3000) => {
        const id = Date.now();
        toasts.value.push({ id, message, type, duration });

        if (duration > 0) {
            setTimeout(() => {
                removeToast(id);
            }, duration);
        }
    };

    const removeToast = (id: number) => {
        toasts.value = toasts.value.filter((t) => t.id !== id);
    };

    return {
        toasts,
        addToast,
        removeToast,
    };
};

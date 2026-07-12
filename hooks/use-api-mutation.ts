import { useState } from "react";

export const useApiMutation = (endpoint: string, method: 'POST' | 'PATCH' | 'DELETE' = 'POST') => {
    const [pending, setPending] = useState(false);

    const mutate = async (payload?: any) => {
        setPending(true);
        try {
            const options: RequestInit = {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
            };

            if (payload && (method === 'POST' || method === 'PATCH')) {
                options.body = JSON.stringify(payload);
            }

            const response = await fetch(endpoint, options);
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Request failed');
            }

            return await response.json();
        } catch (error) {
            throw error;
        } finally {
            setPending(false);
        }
    };

    return { mutate, pending };
};
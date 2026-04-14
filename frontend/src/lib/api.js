const BASE_URL = import.meta.env.DEV
    ? "http://localhost:5050/api"
    : "https://schedra-predict-plan-deliver-server.vercel.app/api";


export const api = {
    get: async (endpoint) => {
        const response = await fetch(`${BASE_URL}${endpoint}`);
        const contentType = response.headers.get("content-type");

        if (!response.ok) {
            throw new Error(`Server Error (${response.status}): Failed to fetch data. Check if backend is running.`);
        }

        if (contentType && contentType.includes("application/json")) {
            return await response.json();
        }
        return null;
    },

    post: async (endpoint, data) => {
        const response = await fetch(`${BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        const contentType = response.headers.get("content-type");

        if (!response.ok) {
            if (contentType && contentType.includes("application/json")) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Network response was not ok');
            } else {
                // If it's HTML/text, it's likely a 404/500 from the server that isn't JSON
                throw new Error(`Server Error (${response.status}): The server returned an invalid response. Please check if the backend is running and updated.`);
            }
        }

        if (contentType && contentType.includes("application/json")) {
            return await response.json();
        }
        return null;
    },

    put: async (endpoint, data) => {
        const response = await fetch(`${BASE_URL}${endpoint}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        const contentType = response.headers.get("content-type");

        if (!response.ok) {
            if (contentType && contentType.includes("application/json")) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Network response was not ok');
            } else {
                throw new Error(`Server Error (${response.status}): The server returned an invalid response.`);
            }
        }

        if (contentType && contentType.includes("application/json")) {
            return await response.json();
        }
        return null;
    },

    delete: async (endpoint) => {
        const response = await fetch(`${BASE_URL}${endpoint}`, {
            method: 'DELETE',
        });

        const contentType = response.headers.get("content-type");

        if (!response.ok) {
            if (contentType && contentType.includes("application/json")) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Network response was not ok');
            } else {
                throw new Error(`Server Error (${response.status}): Failed to delete.`);
            }
        }

        if (contentType && contentType.includes("application/json")) {
            return await response.json();
        }
        return null;
    }
};
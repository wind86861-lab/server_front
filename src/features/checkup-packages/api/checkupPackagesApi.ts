import {
    CheckupPackage,
    ClinicCheckupPackage,
    CheckupPackageFilters,
    PublicCheckupPackageFilters,
    PaginatedResponse
} from '../types/checkupPackage.types';

// Assuming a central API service exists. We'll use fetch directly with token or via an existing api instance if present.
// I will mock the base logic using fetch for now, similar to existing services.

const BASE_URL = '/api';

const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
};

const handleResponse = async (res: Response) => {
    const data = await res.json();
    if (!data.success) {
        throw new Error(data.error?.message || 'Request failed');
    }
    return data;
};

export const checkupPackagesApi = {
    // SUPER ADMIN
    getAll: async (params: CheckupPackageFilters = {}): Promise<PaginatedResponse<CheckupPackage>> => {
        const query = new URLSearchParams();
        if (params.page) query.set('page', String(params.page));
        if (params.limit) query.set('limit', String(params.limit));
        if (params.search) query.set('search', params.search);
        if (params.category) query.set('category', params.category);
        if (params.status !== undefined) query.set('status', String(params.status));

        const res = await fetch(`${BASE_URL}/admin/checkup-packages?${query}`, { headers: getHeaders() });
        const data = await handleResponse(res);
        return { items: data.data, meta: data.meta };
    },

    getById: async (id: string): Promise<CheckupPackage> => {
        const res = await fetch(`${BASE_URL}/admin/checkup-packages/${id}`, { headers: getHeaders() });
        const data = await handleResponse(res);
        return data.data;
    },

    create: async (payload: Partial<CheckupPackage>): Promise<CheckupPackage> => {
        const res = await fetch(`${BASE_URL}/admin/checkup-packages`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(payload),
        });
        const data = await handleResponse(res);
        return data.data;
    },

    update: async (id: string, payload: Partial<CheckupPackage>): Promise<CheckupPackage> => {
        const res = await fetch(`${BASE_URL}/admin/checkup-packages/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(payload),
        });
        const data = await handleResponse(res);
        return data.data;
    },

    delete: async (id: string): Promise<void> => {
        const res = await fetch(`${BASE_URL}/admin/checkup-packages/${id}`, {
            method: 'DELETE',
            headers: getHeaders(),
        });
        await handleResponse(res);
    },

    toggleStatus: async (id: string, activate: boolean): Promise<CheckupPackage> => {
        const action = activate ? 'activate' : 'deactivate';
        const res = await fetch(`${BASE_URL}/admin/checkup-packages/${id}/${action}`, {
            method: 'PATCH',
            headers: getHeaders(),
        });
        const data = await handleResponse(res);
        return data.data;
    },

    // CLINIC ADMIN
    getClinicAvailable: async (): Promise<CheckupPackage[]> => {
        const res = await fetch(`${BASE_URL}/clinic/checkup-packages/available`, { headers: getHeaders() });
        const data = await handleResponse(res);
        return data.data;
    },

    getClinicActivated: async (): Promise<ClinicCheckupPackage[]> => {
        const res = await fetch(`${BASE_URL}/clinic/checkup-packages`, { headers: getHeaders() });
        const data = await handleResponse(res);
        return data.data;
    },

    activateForClinic: async (payload: { packageId: string, clinicPrice: number, customNotes?: string }): Promise<ClinicCheckupPackage> => {
        const res = await fetch(`${BASE_URL}/clinic/checkup-packages/activate`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(payload),
        });
        const data = await handleResponse(res);
        return data.data;
    },

    updateClinicPackage: async (id: string, payload: { clinicPrice?: number, customNotes?: string }): Promise<ClinicCheckupPackage> => {
        const res = await fetch(`${BASE_URL}/clinic/checkup-packages/${id}`, {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify(payload),
        });
        const data = await handleResponse(res);
        return data.data;
    },

    deactivateForClinic: async (id: string): Promise<void> => {
        const res = await fetch(`${BASE_URL}/clinic/checkup-packages/${id}/deactivate`, {
            method: 'PATCH',
            headers: getHeaders(),
        });
        await handleResponse(res);
    },

    // PUBLIC
    getPublicList: async (params: PublicCheckupPackageFilters): Promise<ClinicCheckupPackage[]> => {
        const query = new URLSearchParams();
        query.set('clinicId', params.clinicId);
        if (params.search) query.set('search', params.search);
        if (params.category) query.set('category', params.category);
        if (params.minPrice) query.set('minPrice', String(params.minPrice));
        if (params.maxPrice) query.set('maxPrice', String(params.maxPrice));

        const res = await fetch(`${BASE_URL}/checkup-packages?${query}`);
        const data = await handleResponse(res);
        return data.data;
    },

    getPublicById: async (id: string): Promise<ClinicCheckupPackage> => {
        const res = await fetch(`${BASE_URL}/checkup-packages/${id}`);
        const data = await handleResponse(res);
        return data.data;
    }
};

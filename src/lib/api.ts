const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

let accessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
    accessToken = token;
};

export const getAccessToken = () => accessToken;

interface FetchOptions extends RequestInit {
    auth?: boolean;
}

async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
    const { auth = true, ...rest } = options;

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(rest.headers as Record<string, string>),
    };

    if (auth && accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
    }

    let response = await fetch(`${API_BASE}${path}`, {
        ...rest,
        headers,
        credentials: 'include',
    });

    // Auto-refresh on 401
    if (response.status === 401 && auth) {
        const refreshed = await refreshAccessToken();
        if (refreshed) {
            headers['Authorization'] = `Bearer ${accessToken}`;
            response = await fetch(`${API_BASE}${path}`, {
                ...rest,
                headers,
                credentials: 'include',
            });
        }
    }

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Request failed' }));
        throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    return response.json();
}

async function refreshAccessToken(): Promise<boolean> {
    try {
        const res = await fetch(`${API_BASE}/auth/refresh`, {
            method: 'POST',
            credentials: 'include',
        });
        if (res.ok) {
            const data = await res.json();
            accessToken = data.accessToken;
            return true;
        }
    } catch { }
    accessToken = null;
    return false;
}

// ─── Auth ──────────────────────────────────────────────────────────────────────
export const api = {
    auth: {
        register: (data: { name: string; email: string; password: string }) =>
            apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(data), auth: false }),
        login: (data: { email: string; password: string }) =>
            apiFetch('/auth/login', { method: 'POST', body: JSON.stringify(data), auth: false }),
        logout: () => apiFetch('/auth/logout', { method: 'POST' }),
        me: () => apiFetch<{ user: User }>('/auth/me'),
        changePassword: (data: { currentPassword: string; newPassword: string }) =>
            apiFetch('/auth/change-password', { method: 'PUT', body: JSON.stringify(data) }),
    },

    books: {
        list: (params?: Record<string, string | number>) => {
            const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '';
            return apiFetch<{ books: Book[]; pagination: Pagination }>(`/books${qs}`, { auth: false });
        },
        get: (id: string) => apiFetch<{ book: Book }>(`/books/${id}`, { auth: false }),
        genres: () => apiFetch<{ genres: Genre[] }>('/books/genres', { auth: false }),
        create: (data: any) =>
            apiFetch('/books', { method: 'POST', body: JSON.stringify(data) }),
        update: (id: string, data: any) =>
            apiFetch(`/books/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
        delete: (id: string) => apiFetch(`/books/${id}`, { method: 'DELETE' }),
        review: (id: string, data: { rating: number; title?: string; comment?: string }) =>
            apiFetch(`/books/${id}/reviews`, { method: 'POST', body: JSON.stringify(data) }),
    },

    users: {
        profile: () => apiFetch<{ user: User }>('/users/profile'),
        updateProfile: (data: Partial<User>) =>
            apiFetch('/users/profile', { method: 'PUT', body: JSON.stringify(data) }),
        orders: (params?: Record<string, string>) => {
            const qs = params ? '?' + new URLSearchParams(params).toString() : '';
            return apiFetch<{ orders: Order[]; pagination: Pagination }>(`/users/orders${qs}`);
        },
        library: () => apiFetch<{ books: Book[] }>('/users/library'),
        wishlist: () => apiFetch<{ wishlist: Book[] }>('/users/wishlist'),
    },

    wishlist: {
        toggle: (bookId: string) =>
            apiFetch<{ inWishlist: boolean; message: string }>(`/wishlist/${bookId}`, { method: 'POST' }),
    },

    orders: {
        create: (data: { items: CartItem[]; printJobs?: string[]; shippingAddress?: ShippingAddress }) =>
            apiFetch<{ order: Order }>('/orders', { method: 'POST', body: JSON.stringify(data) }),
        get: (id: string) => apiFetch<{ order: Order }>(`/orders/${id}`),
    },

    payment: {
        createRazorpayOrder: (orderId: string) =>
            apiFetch<{ orderId: string; amount: number; currency: string; key: string; user_name: string; user_email: string }>('/payment/create-razorpay-order', {
                method: 'POST',
                body: JSON.stringify({ orderId }),
            }),
        verify: (data: { razorpay_order_id: string, razorpay_payment_id: string, razorpay_signature: string }) => 
            apiFetch<{ success: boolean; orderId: string; status: string }>('/payment/verify', {
                method: 'POST',
                body: JSON.stringify(data),
            }),
    },

    admin: {
        stats: () => apiFetch('/admin/stats'),
        users: (params?: Record<string, string>) => {
            const qs = params ? '?' + new URLSearchParams(params).toString() : '';
            return apiFetch(`/admin/users${qs}`);
        },
        updateUser: (id: string, data: Partial<User>) =>
            apiFetch(`/admin/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
        deleteUser: (id: string) => apiFetch(`/admin/users/${id}`, { method: 'DELETE' }),
        orders: (params?: Record<string, string>) => {
            const qs = params ? '?' + new URLSearchParams(params).toString() : '';
            return apiFetch(`/admin/orders${qs}`);
        },
        updateOrder: (id: string, status: string) =>
            apiFetch(`/admin/orders/${id}`, { method: 'PUT', body: JSON.stringify({ status }) }),
    },

    categories: {
        getAll: () => apiFetch('/categories'),
        getOne: (id: string) => apiFetch(`/categories/${id}`),
        create: (data: any) => apiFetch('/categories', { method: 'POST', body: JSON.stringify(data) }),
        update: (id: string, data: any) => apiFetch(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
        delete: (id: string) => apiFetch(`/categories/${id}`, { method: 'DELETE' }),
    },

    upload: {
        image: (formData: FormData) => {
            const token = getAccessToken();
            return fetch(`${API_BASE}/upload`, {
                method: 'POST',
                body: formData,
                headers: token ? { 'Authorization': `Bearer ${token}` } : {},
                credentials: 'include'
            }).then(async res => {
                const data = await res.json();
                if (!res.ok) throw new Error(data.message || 'Upload failed');
                return data;
            });
        }
    },

    print: {
        upload: (formData: FormData) => {
            const token = getAccessToken();
            return fetch(`${API_BASE}/print/upload`, {
                method: 'POST',
                body: formData,
                headers: token ? { 'Authorization': `Bearer ${token}` } : {},
                credentials: 'include'
            }).then(async res => {
                const data = await res.json();
                if (!res.ok) throw new Error(data.message || 'Upload failed');
                return data;
            });
        },
        calculatePrice: (data: { pages: number; copies: number; colorMode: string; binding: string; }) =>
            apiFetch<{ price: number }>('/print/calculate-price', { method: 'POST', body: JSON.stringify(data), auth: false }),
        createJob: (data: any) =>
            apiFetch<{ job: PrintJob }>('/print/job', { method: 'POST', body: JSON.stringify(data) }),
    }
};

// ─── Types ─────────────────────────────────────────────────────────────────────
export interface User {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    role: 'USER' | 'ADMIN';
    phone?: string;
    address?: string;
    city?: string;
    country?: string;
    bio?: string;
    emailVerified?: boolean;
    createdAt?: string;
    _count?: { orders: number; wishlist: number };
}

export interface Book {
    id: string;
    title: string;
    subtitle?: string;
    author: string;
    description: string;
    shortDesc?: string;
    price: number;
    comparePrice?: number;
    coverImage?: string;
    isbn?: string;
    publisher?: string;
    publishedAt?: string;
    pages?: number;
    language?: string;
    format?: string;
    stock: number;
    sold?: number;
    rating?: number;
    reviewCount?: number;
    featured?: boolean;
    genreId?: string;
    genre?: Genre;
    tags?: string;
    inWishlist?: boolean;
    reviews?: Review[];
}

export interface Genre {
    id: string;
    name: string;
    slug: string;
    color: string;
    _count?: { books: number };
}

export interface Order {
    id: string;
    status: string;
    subtotal: number;
    tax: number;
    total: number;
    currency: string;
    createdAt: string;
    items: OrderItem[];
    user?: User;
    shippingName?: string;
    shippingEmail?: string;
    shippingAddress?: string;
    shippingCity?: string;
    shippingCountry?: string;
}

export interface OrderItem {
    id: string;
    bookId: string;
    quantity: number;
    price: number;
    book?: Book;
}

export interface CartItem {
    bookId: string;
    quantity: number;
}

export interface ShippingAddress {
    name: string;
    email: string;
    phone?: string;
    address: string;
    city: string;
    country: string;
    zip?: string;
}

export interface Pagination {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface Review {
    id: string;
    rating: number;
    title?: string;
    comment?: string;
    verified?: boolean;
    createdAt: string;
    user?: { id: string; name: string; avatar?: string };
}

export interface PrintJob {
    id: string;
    userId?: string;
    fileUrl: string;
    fileName: string;
    colorMode: string;
    binding: string;
    paperSize: string;
    pages: number;
    copies: number;
    price: number;
    status: string;
    createdAt?: string;
}

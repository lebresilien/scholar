import create from 'zustand';

interface User {
	id: string;
	name: string;
	surname: string;
	email: string;
	phone: string;
	rules: string[];
}

interface AuthSate {
	isAuthenticated: boolean;
	user: User | null;
	login: () => void;
	logout: () => void;
	edit: (user: User) => void;
}

const useAuthStore = create<AuthSate>()(set => ({
	isAuthenticated: false,
	user: null,
	login: () => set({ isAuthenticated: true }),
	logout: () => set({ isAuthenticated: false }),
	edit: (usr: User) => set({ user: usr }),
}));

export default useAuthStore;

export const getAssetUrl = (maybePath) => {
	if (!maybePath) return '';

	// Already absolute
	if (/^https?:\/\//i.test(maybePath)) return maybePath;

	// Backend returns paths like /uploads/...
	try {
		const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:18090/api/v1';
		const origin = new URL(apiBase).origin;
		return new URL(maybePath, origin).toString();
	} catch {
		return maybePath;
	}
};


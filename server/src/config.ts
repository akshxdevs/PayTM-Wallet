function requireEnv(key: string): string {
    const value = process.env[key];
    if (!value) {
        throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
}

export const JWT_SECRET = requireEnv("JWT_SECRET");
export const USER_SECRET = "user_" + JWT_SECRET;
export const MERCHANT_SECRET = "merchant_" + JWT_SECRET;

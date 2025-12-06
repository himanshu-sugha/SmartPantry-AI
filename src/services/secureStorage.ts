// Secure Storage - Wrapper for encrypted localStorage
// Uses AES-256-GCM encryption with PBKDF2 key derivation

import { EncryptionService, EncryptedData } from './encryption';

const ENCRYPTION_KEY_HINT = 'smartpantry_secure_v1';
const ENCRYPTED_KEYS_LIST = 'smartpantry_encrypted_keys';

// Generate a device-specific key (based on browser fingerprint)
function getDeviceKey(): string {
    const stored = localStorage.getItem('smartpantry_device_key');
    if (stored) return stored;

    // Generate a unique device key on first use
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    const key = Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
    localStorage.setItem('smartpantry_device_key', key);
    return key;
}

// User's encryption passphrase (stored in memory only, not localStorage)
let userPassphrase: string | null = null;

export const SecureStorage = {
    // Initialize secure storage with user passphrase
    // Called on app start or when user enables encryption
    async initialize(passphrase?: string): Promise<boolean> {
        if (passphrase) {
            userPassphrase = passphrase + getDeviceKey();
            return true;
        }

        // Use device key as default (auto-encrypts without user passphrase)
        userPassphrase = getDeviceKey();
        return true;
    },

    // Check if initialized
    isInitialized(): boolean {
        return userPassphrase !== null;
    },

    // Get combined encryption key
    getKey(): string {
        if (!userPassphrase) {
            // Auto-initialize with device key
            userPassphrase = getDeviceKey();
        }
        return userPassphrase;
    },

    // Set encrypted item
    async setItem(key: string, value: any): Promise<void> {
        try {
            const encrypted = await EncryptionService.encrypt(value, this.getKey());
            localStorage.setItem(`enc_${key}`, JSON.stringify(encrypted));

            // Track which keys are encrypted
            const encryptedKeys = JSON.parse(localStorage.getItem(ENCRYPTED_KEYS_LIST) || '[]');
            if (!encryptedKeys.includes(key)) {
                encryptedKeys.push(key);
                localStorage.setItem(ENCRYPTED_KEYS_LIST, JSON.stringify(encryptedKeys));
            }
        } catch (error) {
            console.error('SecureStorage: Encryption failed', error);
            // Fallback to plain storage if encryption fails
            localStorage.setItem(key, JSON.stringify(value));
        }
    },

    // Get decrypted item
    async getItem<T>(key: string): Promise<T | null> {
        try {
            const encryptedString = localStorage.getItem(`enc_${key}`);

            if (encryptedString) {
                const encrypted: EncryptedData = JSON.parse(encryptedString);
                return await EncryptionService.decrypt(encrypted, this.getKey());
            }

            // Check for unencrypted data (migration from old format)
            const plainData = localStorage.getItem(key);
            if (plainData) {
                try {
                    return JSON.parse(plainData) as T;
                } catch {
                    return null;
                }
            }

            return null;
        } catch (error) {
            console.error('SecureStorage: Decryption failed', error);
            return null;
        }
    },

    // Remove encrypted item
    removeItem(key: string): void {
        localStorage.removeItem(`enc_${key}`);
        localStorage.removeItem(key);

        // Update encrypted keys list
        const encryptedKeys = JSON.parse(localStorage.getItem(ENCRYPTED_KEYS_LIST) || '[]');
        const filtered = encryptedKeys.filter((k: string) => k !== key);
        localStorage.setItem(ENCRYPTED_KEYS_LIST, JSON.stringify(filtered));
    },

    // Migrate existing unencrypted data to encrypted
    async migrateToEncrypted(keys: string[]): Promise<{ migrated: number; errors: string[] }> {
        let migrated = 0;
        const errors: string[] = [];

        for (const key of keys) {
            try {
                const plainData = localStorage.getItem(key);
                if (plainData && !localStorage.getItem(`enc_${key}`)) {
                    const data = JSON.parse(plainData);
                    await this.setItem(key, data);
                    // Keep original for now (backup)
                    migrated++;
                }
            } catch (error) {
                errors.push(`Failed to migrate ${key}`);
            }
        }

        return { migrated, errors };
    },

    // Get encryption status for display
    getStatus(): {
        enabled: boolean;
        algorithm: string;
        keyDerivation: string;
        encryptedKeys: number;
    } {
        const encryptedKeys = JSON.parse(localStorage.getItem(ENCRYPTED_KEYS_LIST) || '[]');

        return {
            enabled: this.isInitialized(),
            algorithm: 'AES-256-GCM',
            keyDerivation: 'PBKDF2 (100,000 iterations, SHA-256)',
            encryptedKeys: encryptedKeys.length,
        };
    },

    // Clear all encrypted data
    clearAll(): void {
        const encryptedKeys = JSON.parse(localStorage.getItem(ENCRYPTED_KEYS_LIST) || '[]');

        for (const key of encryptedKeys) {
            localStorage.removeItem(`enc_${key}`);
        }

        localStorage.removeItem(ENCRYPTED_KEYS_LIST);
    },
};

// Auto-initialize with device key
if (typeof window !== 'undefined') {
    SecureStorage.initialize();
}

// Client-side encryption using Web Crypto API

export interface EncryptedData {
    ciphertext: string;
    iv: string;
    salt: string;
}

export const EncryptionService = {
    // Derive encryption key from passphrase
    async deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
        const encoder = new TextEncoder();
        const passphraseKey = await crypto.subtle.importKey(
            'raw',
            encoder.encode(passphrase),
            'PBKDF2',
            false,
            ['deriveBits', 'deriveKey']
        );

        return crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: salt,
                iterations: 100000,
                hash: 'SHA-256',
            },
            passphraseKey,
            { name: 'AES-GCM', length: 256 },
            false,
            ['encrypt', 'decrypt']
        );
    },

    // Encrypt data
    async encrypt(data: any, passphrase: string): Promise<EncryptedData> {
        const salt = crypto.getRandomValues(new Uint8Array(16));
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const key = await this.deriveKey(passphrase, salt);

        const encoder = new TextEncoder();
        const dataString = JSON.stringify(data);
        const encrypted = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv: iv },
            key,
            encoder.encode(dataString)
        );

        return {
            ciphertext: this.arrayBufferToBase64(encrypted),
            iv: this.arrayBufferToBase64(iv),
            salt: this.arrayBufferToBase64(salt),
        };
    },

    // Decrypt data
    async decrypt(encrypted: EncryptedData, passphrase: string): Promise<any> {
        const salt = this.base64ToArrayBuffer(encrypted.salt);
        const iv = this.base64ToArrayBuffer(encrypted.iv);
        const ciphertext = this.base64ToArrayBuffer(encrypted.ciphertext);

        const key = await this.deriveKey(passphrase, new Uint8Array(salt));

        try {
            const decrypted = await crypto.subtle.decrypt(
                { name: 'AES-GCM', iv: new Uint8Array(iv) },
                key,
                ciphertext
            );

            const decoder = new TextDecoder();
            const dataString = decoder.decode(decrypted);
            return JSON.parse(dataString);
        } catch (error) {
            throw new Error('Decryption failed. Invalid passphrase or corrupted data.');
        }
    },

    // Helper: ArrayBuffer to Base64
    arrayBufferToBase64(buffer: ArrayBuffer): string {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    },

    // Helper: Base64 to ArrayBuffer
    base64ToArrayBuffer(base64: string): ArrayBuffer {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes.buffer;
    },

    // Check if encryption is enabled
    isEncryptionEnabled(): boolean {
        return localStorage.getItem('encryption_enabled') === 'true';
    },

    // Enable encryption
    enableEncryption(passphrase: string): void {
        localStorage.setItem('encryption_enabled', 'true');
        // Store a test encrypted value to verify passphrase later
        const testData = { test: 'encryption_test' };
        this.encrypt(testData, passphrase).then(encrypted => {
            localStorage.setItem('encryption_test', JSON.stringify(encrypted));
        });
    },

    // Disable encryption
    disableEncryption(): void {
        localStorage.setItem('encryption_enabled', 'false');
        localStorage.removeItem('encryption_test');
    },

    // Verify passphrase
    async verifyPassphrase(passphrase: string): Promise<boolean> {
        const testEncrypted = localStorage.getItem('encryption_test');
        if (!testEncrypted) return false;

        try {
            const encrypted: EncryptedData = JSON.parse(testEncrypted);
            const decrypted = await this.decrypt(encrypted, passphrase);
            return decrypted.test === 'encryption_test';
        } catch {
            return false;
        }
    },
};

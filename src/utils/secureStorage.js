import { useState, useEffect, useCallback } from "react";

/**
 * A simple utility for more secure storage of API keys and sensitive data
 * Note: This provides better security than plain localStorage but is 
 * still client-side only. For production, a server-side solution is recommended.
 */

// Generate a simple device fingerprint to use as part of the encryption key
function getDeviceFingerprint() {
  const { userAgent, language, platform } = navigator;
  const screenInfo = `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`;
  const timezone = new Date().getTimezoneOffset();
  
  return `${userAgent}-${language}-${platform}-${screenInfo}-${timezone}`;
}

// Simple encryption function using XOR with device fingerprint
function encrypt(text, salt = "") {
  if (!text) return text;
  
  try {
    const fingerprint = getDeviceFingerprint() + salt;
    const encodedText = btoa(unescape(encodeURIComponent(text)));
    
    let result = "";
    for (let i = 0; i < encodedText.length; i++) {
      const charCode = encodedText.charCodeAt(i);
      const fingerprintChar = fingerprint.charCodeAt(i % fingerprint.length);
      result += String.fromCharCode(charCode ^ fingerprintChar);
    }
    
    return btoa(result);
  } catch (err) {
    console.error("Encryption error:", err);
    return text; // Fallback to unencrypted on error
  }
}

// Simple decryption function
function decrypt(encryptedText, salt = "") {
  if (!encryptedText) return encryptedText;
  
  try {
    const fingerprint = getDeviceFingerprint() + salt;
    const decoded = atob(encryptedText);
    
    let result = "";
    for (let i = 0; i < decoded.length; i++) {
      const charCode = decoded.charCodeAt(i);
      const fingerprintChar = fingerprint.charCodeAt(i % fingerprint.length);
      result += String.fromCharCode(charCode ^ fingerprintChar);
    }
    
    return decodeURIComponent(escape(atob(result)));
  } catch (err) {
    console.error("Decryption error:", err);
    return encryptedText; // Return encrypted text on error
  }
}

/**
 * Store a sensitive item in localStorage with encryption
 * @param {string} key - The localStorage key
 * @param {string} value - The value to store
 * @param {string} salt - Optional extra salt for encryption
 * @returns {void}
 */
export function secureSet(key, value, salt = "") {
  if (value === undefined || value === null) {
    localStorage.removeItem(key);
    return;
  }
  
  const encryptedValue = encrypt(value, salt);
  localStorage.setItem(key, encryptedValue);
}

/**
 * Retrieve and decrypt a sensitive item from localStorage
 * @param {string} key - The localStorage key
 * @param {string} salt - Optional salt that was used for encryption
 * @returns {string|null} - The decrypted value or null if not found
 */
export function secureGet(key, salt = "") {
  const value = localStorage.getItem(key);
  if (!value) return null;
  
  return decrypt(value, salt);
}

/**
 * Custom hook for secure storage of sensitive information
 * @param {string} key - The localStorage key
 * @param {string} defaultValue - Default value if none exists
 * @param {string} salt - Optional extra salt for encryption
 * @returns {Array} - [value, setValue, removeValue] tuple
 */
export function useSecureStorage(key, defaultValue, salt = "") {
  const [value, setValue] = useState(() => {
    const storedValue = secureGet(key, salt);
    if (storedValue != null) return storedValue;
    
    if (typeof defaultValue === "function") {
      return defaultValue();
    } else {
      return defaultValue;
    }
  });
  
  useEffect(() => {
    if (value === undefined) {
      localStorage.removeItem(key);
    } else {
      secureSet(key, value, salt);
    }
  }, [key, value, salt]);
  
  const remove = useCallback(() => {
    setValue(undefined);
  }, []);
  
  return [value, setValue, remove];
}


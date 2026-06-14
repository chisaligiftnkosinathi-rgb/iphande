// Firebase config and initialization for Expo React Native
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: 'AIzaSyDdNjAHDYutbRMFgnJIz9BnirCDR0B-zt8',
    authDomain: 'helios-prime-kdb3m.firebaseapp.com',
    projectId: 'helios-prime-kdb3m',
    storageBucket: 'helios-prime-kdb3m.firebasestorage.app',
    messagingSenderId: '179725533877',
    appId: '1:179725533877:web:8a14c73aaadea73651b4fc',
    measurementId: 'G-FEMVKBX3N6',
};

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);

import { doc, getDoc, getFirestore, setDoc, updateDoc } from 'firebase/firestore';
import { firebaseApp } from '../config/firebase';
import { StewardProfile } from '../types/steward';

const db = getFirestore(firebaseApp);

// TEMP V1 SCAFFOLD:
// Firebase Auth owns identity.
// iPhande API will become the source of truth for steward profiles.
// This Firestore write only lets us test onboarding flow now.
export const createStewardProfile = async (profile: StewardProfile): Promise<void> => {
    const docRef = doc(db, 'stewards', profile.uid);
    await setDoc(docRef, profile);
};

export const getStewardProfile = async (uid: string): Promise<StewardProfile | null> => {
    const docRef = doc(db, 'stewards', uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        return docSnap.data() as StewardProfile;
    }
    return null;
};

export const updateStewardProfile = async (uid: string, data: Partial<StewardProfile>): Promise<void> => {
    const docRef = doc(db, 'stewards', uid);
    await updateDoc(docRef, data);
};

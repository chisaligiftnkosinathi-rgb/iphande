import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../src/config/firebase';

async function seedSteward() {
    const uid = 'nN1Yv9Mh36exRJyNPEWKo8oMRFH3';

    await setDoc(
        doc(db, 'stewards', uid),
        {
            uid,
            businessName: '',
            archetype: '',
            category: '',
            mainService: '',
            whatsapp: '',
            location: '',
            activationStatus: 'active',
            onboardingComplete: false,
            visibilityEnabled: true,
            publicSlug: '',
            profilePhotoUrl: '',
            coverPhotoUrl: '',
            setupFeeProofUrl: '',
            vbaApproved: false,
            activationReviewedBy: 'manual',
            activationReviewedAt: serverTimestamp(),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        },
        { merge: true }
    );

    console.log('Steward seeded:', uid);
}

seedSteward().catch(console.error);

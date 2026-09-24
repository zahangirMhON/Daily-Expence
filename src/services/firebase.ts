import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Account, Category, Person, Transaction, Budget, RecurringExpense, Reminder, AppSettings, PromotionConfig } from '../types';

// Initialize Firebase App
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Initialize Firestore (using the specific database ID from config)
export const firestore = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

export interface SyncedFinancePayload {
  accounts: Account[];
  transactions: Transaction[];
  categories: Category[];
  people: Person[];
  budgets: Budget[];
  recurring: RecurringExpense[];
  reminders: Reminder[];
  settings?: AppSettings;
  promotion?: PromotionConfig;
  updatedAt?: number;
}

/**
 * Sign in with Google Popup
 */
export async function signInWithGoogle(): Promise<FirebaseUser | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    if (result.user) {
      // Record user profile in Firestore
      const userRef = doc(firestore, 'users', result.user.uid);
      await setDoc(
        userRef,
        {
          userId: result.user.uid,
          email: result.user.email || '',
          displayName: result.user.displayName || '',
          photoURL: result.user.photoURL || '',
          lastLoginAt: serverTimestamp(),
        },
        { merge: true }
      );
      return result.user;
    }
    return null;
  } catch (error) {
    console.error('Error signing in with Google:', error);
    throw error;
  }
}

/**
 * Sign out current user
 */
export async function logOut(): Promise<void> {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
}

/**
 * Save user financial database to Firestore
 */
export async function syncFinanceToFirestore(userId: string, data: SyncedFinancePayload): Promise<boolean> {
  try {
    if (!userId) return false;
    const financeDocRef = doc(firestore, 'users', userId, 'data', 'finance');
    
    // Clean undefined values for Firestore serialization
    const cleanPayload = JSON.parse(JSON.stringify(data));
    
    await setDoc(
      financeDocRef,
      {
        ...cleanPayload,
        userId,
        updatedAt: Date.now(),
        lastSyncedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    // Update user root doc
    const userDocRef = doc(firestore, 'users', userId);
    await setDoc(
      userDocRef,
      {
        lastSyncedAt: new Date().toISOString(),
        updatedAt: Date.now(),
      },
      { merge: true }
    );

    return true;
  } catch (error) {
    console.error('Failed to sync finance data to Firestore:', error);
    return false;
  }
}

/**
 * Load user financial database from Firestore
 */
export async function fetchFinanceFromFirestore(userId: string): Promise<SyncedFinancePayload | null> {
  try {
    if (!userId) return null;
    const financeDocRef = doc(firestore, 'users', userId, 'data', 'finance');
    const snapshot = await getDoc(financeDocRef);

    if (snapshot.exists()) {
      const data = snapshot.data() as SyncedFinancePayload;
      return data;
    }
    return null;
  } catch (error) {
    console.error('Failed to fetch finance data from Firestore:', error);
    return null;
  }
}

/**
 * Subscribe to realtime changes in Firestore
 */
export function subscribeToUserFinance(
  userId: string,
  onData: (data: SyncedFinancePayload) => void,
  onError?: (err: any) => void
) {
  if (!userId) return () => {};
  const financeDocRef = doc(firestore, 'users', userId, 'data', 'finance');
  
  return onSnapshot(
    financeDocRef,
    (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as SyncedFinancePayload;
        onData(data);
      }
    },
    (error) => {
      console.warn('Realtime sync snapshot warning:', error);
      if (onError) onError(error);
    }
  );
}

export type { FirebaseUser };

import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

interface UserProfile {
  displayName: string;
  status: string;
  email?: string;
  photoURL?: string;
}

export const updateUserProfile = async (userId: string, profile: Partial<UserProfile>) => {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, profile);
};

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);
  
  if (userDoc.exists()) {
    return userDoc.data() as UserProfile;
  }
  
  return null;
}; 
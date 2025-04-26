import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

/**
 * Sign up a new user with email, password, and username
 * @param email User's email
 * @param password User's password
 * @param username User's username
 */
export const signUp = async (email: string, password: string, username: string) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;
  
  // Store additional user data in Firestore
  await setDoc(doc(db, "users", user.uid), { 
    email, 
    username,
    createdAt: new Date().toISOString(),
    online: true,
    lastSeen: new Date().toISOString()
  });
  
  return user;
};

/**
 * Sign in a user with email/username and password
 * @param identifier User's email or username
 * @param password User's password
 */
export const login = async (identifier: string, password: string) => {
  // Check if identifier is an email or username
  let email = identifier;
  
  // If identifier is not an email, try to find the email by username
  if (!identifier.includes('@')) {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("username", "==", identifier));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      throw new Error("User not found");
    }
    
    email = querySnapshot.docs[0].data().email;
  }
  
  // Sign in with email and password
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

/**
 * Sign out the current user
 */
export const logout = async () => {
  await signOut(auth);
}; 
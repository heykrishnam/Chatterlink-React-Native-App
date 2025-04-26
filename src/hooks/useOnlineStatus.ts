import { useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';

export const useOnlineStatus = () => {
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser) return;

    const updateOnlineStatus = async (status: boolean) => {
      try {
        const userRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userRef, {
          online: status,
          lastSeen: new Date().toISOString(),
        });
      } catch (error) {
        console.error('Error updating online status:', error);
      }
    };

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        updateOnlineStatus(true);
      } else if (nextAppState === 'background' || nextAppState === 'inactive') {
        updateOnlineStatus(false);
      }
    };

    // Set initial online status
    updateOnlineStatus(true);

    // Subscribe to app state changes
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Cleanup function
    return () => {
      subscription.remove();
      if (currentUser) {
        updateOnlineStatus(false);
      }
    };
  }, [currentUser]);
}; 
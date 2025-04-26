import { collection, doc, getDoc, getDocs, addDoc, updateDoc, query, where, orderBy, limit, serverTimestamp, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../config/firebase';

// Define interfaces here instead of importing to avoid conflicts
export interface Group {
  id: string;
  name: string;
  members: string[];
  createdBy: string;
  createdAt: string;
  autoDeleteDuration?: number | null;
}

export interface GroupMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
  autoDeleteAt?: string | null;
  timeRemaining?: number | null;
}

// Create a new group
export const createGroup = async (name: string, creatorId: string, autoDeleteDuration?: number | null): Promise<string> => {
  const groupsRef = collection(db, 'groups');
  
  // Create a clean object without undefined values
  const groupData: any = {
    name,
    members: [creatorId],
    createdBy: creatorId,
    createdAt: new Date().toISOString(),
  };
  
  // Only add autoDeleteDuration if it's not null or undefined
  if (autoDeleteDuration !== null && autoDeleteDuration !== undefined) {
    groupData.autoDeleteDuration = autoDeleteDuration;
  }
  
  const docRef = await addDoc(groupsRef, groupData);
  return docRef.id;
};

// Get group details
export const getGroupDetails = async (groupId: string): Promise<Group> => {
  const groupRef = doc(db, 'groups', groupId);
  const groupDoc = await getDoc(groupRef);
  
  if (!groupDoc.exists()) {
    throw new Error('Group not found');
  }
  
  return {
    id: groupDoc.id,
    ...groupDoc.data() as Omit<Group, 'id'>
  };
};

// Get all groups for a user
export const getUserGroups = async (userEmail: string): Promise<Group[]> => {
  const groupsQuery = query(
    collection(db, 'groups'),
    where('members', 'array-contains', userEmail)
  );
  
  const groupsSnapshot = await getDocs(groupsQuery);
  return groupsSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Group));
};

// Join a group
export const joinGroup = async (groupId: string, userId: string): Promise<void> => {
  const groupRef = doc(db, 'groups', groupId);
  await updateDoc(groupRef, {
    members: arrayUnion(userId)
  });
};

// Leave a group
export const leaveGroup = async (groupId: string, userEmail: string): Promise<void> => {
  const groupRef = doc(db, 'groups', groupId);
  await updateDoc(groupRef, {
    members: arrayRemove(userEmail)
  });
};

// Get messages for a group
export const getGroupMessages = async (groupId: string): Promise<GroupMessage[]> => {
  const messagesRef = collection(db, 'groups', groupId, 'messages');
  const querySnapshot = await getDocs(messagesRef);
  
  const messages: GroupMessage[] = [];
  querySnapshot.forEach((doc) => {
    messages.push({
      id: doc.id,
      ...doc.data() as Omit<GroupMessage, 'id'>
    });
  });
  
  return messages.sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
};

// Send a message to a group
export const sendGroupMessage = async (groupId: string, message: Omit<GroupMessage, 'id'>): Promise<void> => {
  const messagesRef = collection(db, 'groups', groupId, 'messages');
  await addDoc(messagesRef, message);
};

// Delete a message
export const deleteMessage = async (messageId: string): Promise<void> => {
  const messageRef = doc(db, 'messages', messageId);
  await updateDoc(messageRef, {
    deleted: true
  });
};

export const getGroups = async (userId: string): Promise<Group[]> => {
  const groupsRef = collection(db, 'groups');
  const q = query(groupsRef, where('members', 'array-contains', userId));
  const querySnapshot = await getDocs(q);
  
  const groups: Group[] = [];
  querySnapshot.forEach((doc) => {
    groups.push({
      id: doc.id,
      ...doc.data() as Omit<Group, 'id'>
    });
  });
  
  return groups;
}; 
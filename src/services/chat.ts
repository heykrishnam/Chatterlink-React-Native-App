import { collection, addDoc, query, where, orderBy, onSnapshot, getDocs, doc, updateDoc, serverTimestamp, limit as firestoreLimit, startAfter, deleteDoc, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

export interface Message {
  id: string;
  text: string;
  senderId: string;
  timestamp: any;
  autoDeleteAt?: any;
}

export interface Chat {
  id: string;
  participants: string[];
  lastMessage?: {
    text: string;
    timestamp: any;
  };
}

export const createChat = async (participants: string[]): Promise<string> => {
  try {
    const chatRef = await addDoc(collection(db, 'chats'), {
      participants,
      createdAt: serverTimestamp(),
    });
    return chatRef.id;
  } catch (error) {
    console.error('Error creating chat:', error);
    throw error;
  }
};

export const getExistingChat = async (userId1: string, userId2: string): Promise<Chat | null> => {
  try {
    // Query for chats where both users are participants
    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', userId1)
    );
    
    const querySnapshot = await getDocs(q);
    
    // Check each chat to see if it contains both users
    for (const doc of querySnapshot.docs) {
      const chat = { id: doc.id, ...doc.data() } as Chat;
      if (chat.participants.includes(userId2)) {
        return chat;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error getting existing chat:', error);
    throw error;
  }
};

export const deleteMessage = async (chatId: string, messageId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'chats', chatId, 'messages', messageId));
  } catch (error) {
    console.error('Error deleting message:', error);
    throw error;
  }
};

export const sendMessage = async (chatId: string, text: string, senderId: string, autoDeleteAfter?: number): Promise<string> => {
  try {
    const messageData = {
      text,
      senderId,
      timestamp: serverTimestamp(),
      ...(autoDeleteAfter && { 
        autoDeleteAt: Timestamp.fromDate(new Date(Date.now() + autoDeleteAfter * 1000))
      })
    };

    const messageRef = await addDoc(collection(db, 'chats', chatId, 'messages'), messageData);

    await updateDoc(doc(db, 'chats', chatId), {
      lastMessage: {
        text,
        timestamp: serverTimestamp(),
      },
    });

    return messageRef.id;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

export const subscribeToMessages = (chatId: string, callback: (messages: Message[]) => void, messageLimit: number = 20) => {
  const q = query(
    collection(db, 'chats', chatId, 'messages'),
    orderBy('timestamp', 'desc'),
    firestoreLimit(messageLimit)
  );

  return onSnapshot(q, (snapshot) => {
    const messages: Message[] = [];
    snapshot.forEach((doc) => {
      messages.push({ id: doc.id, ...doc.data() } as Message);
    });
    // Sort messages by timestamp in ascending order for display
    callback(messages.sort((a, b) => a.timestamp?.toDate() - b.timestamp?.toDate()));
  });
};

export const loadMoreMessages = async (chatId: string, lastMessageTimestamp: any, messageLimit: number = 20): Promise<Message[]> => {
  try {
    const q = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('timestamp', 'desc'),
      startAfter(lastMessageTimestamp),
      firestoreLimit(messageLimit)
    );

    const snapshot = await getDocs(q);
    const messages: Message[] = [];
    snapshot.forEach((doc) => {
      messages.push({ id: doc.id, ...doc.data() } as Message);
    });
    return messages.sort((a, b) => a.timestamp?.toDate() - b.timestamp?.toDate());
  } catch (error) {
    console.error('Error loading more messages:', error);
    throw error;
  }
};

export const getUserChats = (userId: string, callback: (chats: Chat[]) => void) => {
  const q = query(
    collection(db, 'chats'),
    where('participants', 'array-contains', userId)
  );

  return onSnapshot(q, (snapshot) => {
    const chats: Chat[] = [];
    snapshot.forEach((doc) => {
      chats.push({ id: doc.id, ...doc.data() } as Chat);
    });
    callback(chats);
  });
}; 
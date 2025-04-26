import { useState, useEffect, useCallback } from 'react';
import { db, auth } from '../../config/firebase';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  limit,
  startAfter,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { Group, Message, MESSAGES_PER_PAGE } from '../../types/group-chat';

export const useGroupChat = (groupId: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastMessage, setLastMessage] = useState<Message | null>(null);
  const [members, setMembers] = useState<string[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<Record<string, number>>({});
  const [pendingDeletions, setPendingDeletions] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!groupId) return;

    const fetchGroupData = async () => {
      try {
        const groupDoc = await getDoc(doc(db, 'groups', groupId));
        if (groupDoc.exists()) {
          const groupData = groupDoc.data() as Group;
          setMembers(groupData.members || []);
          setIsAdmin(groupData.createdBy === auth.currentUser?.email);
        }
      } catch (error) {
        console.error('Error fetching group data:', error);
      }
    };

    fetchGroupData();
  }, [groupId]);

  useEffect(() => {
    if (!groupId) return;

    const messagesRef = collection(db, 'messages');
    const q = query(
      messagesRef,
      where('chatId', '==', groupId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newMessages: Message[] = [];
      const newMessageIds = new Set<string>();
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (!newMessageIds.has(doc.id)) {
          newMessageIds.add(doc.id);
          newMessages.push({
            id: doc.id,
            ...data,
            timestamp: data.timestamp?.toDate?.() || new Date()
          } as Message);
        }
      });

      const sortedMessages = newMessages.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      const uniqueMessages = Array.from(
        new Map(sortedMessages.map(msg => [msg.id, msg])).values()
      );
      
      setMessages(uniqueMessages);
      setLoading(false);
    }, (error) => {
      console.error('Error in messages snapshot:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [groupId]);

  const loadMoreMessages = async () => {
    if (!hasMore || loadingMore || !lastMessage) return;

    setLoadingMore(true);
    try {
      const messagesRef = collection(db, 'messages');
      const q = query(
        messagesRef,
        where('chatId', '==', groupId)
      );

      const snapshot = await getDocs(q);
      const newMessages: Message[] = [];
      const newMessageIds = new Set<string>();
      
      snapshot.forEach(doc => {
        const data = doc.data();
        if (!newMessageIds.has(doc.id)) {
          newMessageIds.add(doc.id);
          newMessages.push({
            id: doc.id,
            ...data,
            timestamp: data.timestamp?.toDate?.() || new Date()
          } as Message);
        }
      });

      const sortedMessages = newMessages.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      
      if (sortedMessages.length > 0) {
        setMessages(prev => [...prev, ...sortedMessages]);
        setLastMessage(sortedMessages[0]);
        setHasMore(sortedMessages.length === MESSAGES_PER_PAGE);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error loading more messages:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const sendMessage = async (text: string, autoDeleteTime?: Date) => {
    if (!text.trim() || !groupId) return;

    try {
      const currentUser = auth.currentUser;
      if (!currentUser || !currentUser.email) return;

      const messageData = {
        text: text.trim(),
        sender: currentUser.email,
        senderName: currentUser.displayName || currentUser.email.split('@')[0],
        timestamp: serverTimestamp(),
        readBy: [currentUser.email],
        autoDeleteTime: autoDeleteTime,
        chatId: groupId,
        type: 'text'
      };

      await addDoc(collection(db, 'messages'), messageData);
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  };

  const markMessageAsRead = async (messageId: string) => {
    try {
      const messageRef = doc(db, 'messages', messageId);
      await updateDoc(messageRef, {
        readBy: arrayUnion(auth.currentUser?.email)
      });
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const deleteMessage = async (messageId: string) => {
    try {
      const messageRef = doc(db, 'messages', messageId);
      await deleteDoc(messageRef);
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  };

  const removeMember = async (memberEmail: string) => {
    if (!isAdmin) return;

    try {
      const groupRef = doc(db, 'groups', groupId);
      await updateDoc(groupRef, {
        members: arrayRemove(memberEmail)
      });
    } catch (error) {
      console.error('Error removing member:', error);
      throw error;
    }
  };

  const leaveGroup = async () => {
    try {
      const groupRef = doc(db, 'groups', groupId);
      await updateDoc(groupRef, {
        members: arrayRemove(auth.currentUser?.email)
      });
    } catch (error) {
      console.error('Error leaving group:', error);
      throw error;
    }
  };

  const checkAndDeleteMessages = useCallback(() => {
    const currentTime = new Date().getTime();
    const messagesToDelete = new Set<string>();

    messages.forEach(message => {
      if (message.autoDeleteTime) {
        const deleteTime = new Date(message.autoDeleteTime).getTime();
        if (deleteTime <= currentTime) {
          messagesToDelete.add(message.id);
        }
      }
    });

    if (messagesToDelete.size > 0) {
      setPendingDeletions(prev => new Set([...prev, ...messagesToDelete]));
    }
  }, [messages]);

  useEffect(() => {
    const messageCheckInterval = setInterval(checkAndDeleteMessages, 60000);
    const deletionTimer = setInterval(() => {
      const currentTime = new Date().getTime();
      const newTimeRemaining: Record<string, number> = {};
      
      messages.forEach(message => {
        if (message.autoDeleteTime) {
          const deleteTime = new Date(message.autoDeleteTime).getTime();
          const remaining = deleteTime - currentTime;
          if (remaining > 0) {
            newTimeRemaining[message.id] = remaining;
          }
        }
      });
      
      setTimeRemaining(newTimeRemaining);
    }, 1000);

    return () => {
      clearInterval(messageCheckInterval);
      clearInterval(deletionTimer);
    };
  }, [messages, checkAndDeleteMessages]);

  useEffect(() => {
    if (pendingDeletions.size > 0) {
      const deleteMessages = async () => {
        const batch = Array.from(pendingDeletions).map(messageId =>
          deleteDoc(doc(db, 'messages', messageId))
        );

        try {
          await Promise.all(batch);
          setMessages(prev => prev.filter(msg => !pendingDeletions.has(msg.id)));
          setPendingDeletions(new Set());
        } catch (error) {
          console.error('Error deleting messages:', error);
        }
      };

      deleteMessages();
    }
  }, [pendingDeletions]);

  return {
    messages,
    loading,
    loadingMore,
    hasMore,
    lastMessage,
    members,
    isAdmin,
    timeRemaining,
    sendMessage,
    loadMoreMessages,
    markMessageAsRead,
    deleteMessage,
    removeMember,
    leaveGroup
  };
}; 
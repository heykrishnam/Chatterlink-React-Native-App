import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { formatTimeRemaining } from '../../utils/group-chat/formatTime';
import { MESSAGES_PER_PAGE, AUTO_DELETE_OPTIONS } from '../../utils/group-chat/constants';
import { db } from '../../config/firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  query, 
  orderBy, 
  limit,
  DocumentData,
  QueryDocumentSnapshot
} from 'firebase/firestore';

// Define interfaces to match Firebase structure
interface GroupMessage {
  id: string;
  sender: string;
  senderName: string;
  text: string;
  timestamp: number;
  deleteAt: number | null;
}

interface Group {
  id: string;
  name: string;
  createdBy: string;
  createdAt: number;
  groupId: string;
  members: string[];
}

type RouteParams = {
  groupId: string;
  groupName: string;
};

const GroupChatScreen: React.FC = () => {
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [group, setGroup] = useState<Group | null>(null);
  const [showAutoDeleteOptions, setShowAutoDeleteOptions] = useState(false);
  const [selectedAutoDeleteTime, setSelectedAutoDeleteTime] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<Record<string, number>>({});
  
  const { user } = useAuth();
  const route = useRoute();
  const navigation = useNavigation();
  const flatListRef = useRef<FlatList>(null);
  const messageCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeRemainingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const { groupId, groupName } = route.params as RouteParams;

  useEffect(() => {
    navigation.setOptions({
      title: groupName,
    });
    if (!groupId || !user) return;
    
    loadGroupDetails();
    loadMessages();
    
    // Set up intervals for checking message deletion and updating time remaining
    messageCheckIntervalRef.current = setInterval(checkAndDeleteMessages, 60000);
    timeRemainingIntervalRef.current = setInterval(updateTimeRemaining, 1000);
    
    return () => {
      if (messageCheckIntervalRef.current) clearInterval(messageCheckIntervalRef.current);
      if (timeRemainingIntervalRef.current) clearInterval(timeRemainingIntervalRef.current);
    };
  }, [groupId, user]);

  const loadGroupDetails = async () => {
    try {
      const groupDoc = await getDoc(doc(db, 'groups', groupId));
      if (groupDoc.exists()) {
        setGroup({ id: groupDoc.id, ...groupDoc.data() } as Group);
      } else {
        Alert.alert('Error', 'Group not found');
      }
    } catch (error) {
      console.error('Error loading group details:', error);
      Alert.alert('Error', 'Failed to load group details');
    }
  };

  const loadMessages = async () => {
    try {
      if (!groupId) return;
      
      const messagesQuery = query(
        collection(db, 'groups', groupId, 'messages'),
        orderBy('timestamp', 'desc'),
        limit(MESSAGES_PER_PAGE)
      );
      
      const messagesSnapshot = await getDocs(messagesQuery);
      
      const loadedMessages = messagesSnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
        id: doc.id,
        ...doc.data()
      })) as GroupMessage[];
      
      setMessages(loadedMessages);
      setLoading(false);
    } catch (error) {
      console.error('Error loading messages:', error);
      Alert.alert('Error', 'Failed to load messages');
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !groupId || !user) return;
    
    try {
      setSending(true);
      
      // Calculate delete time if auto-delete is selected
      let deleteAt: number | null = null;
      if (selectedAutoDeleteTime) {
        deleteAt = Date.now() + selectedAutoDeleteTime;
      }
      
      const messageData = {
        sender: user.email || '',
        senderName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
        text: newMessage.trim(),
        timestamp: Date.now(),
        deleteAt,
      };

      await addDoc(collection(db, 'groups', groupId, 'messages'), messageData);
      
      setNewMessage('');
      setSelectedAutoDeleteTime(null);
      
      // Scroll to bottom
      if (flatListRef.current) {
        flatListRef.current.scrollToEnd({ animated: true });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const checkAndDeleteMessages = () => {
    const now = Date.now();
    const updatedMessages = messages.filter(message => {
      if (message.deleteAt) {
        return message.deleteAt > now;
      }
      return true;
    });
    
    if (updatedMessages.length !== messages.length) {
      setMessages(updatedMessages);
    }
  };

  const updateTimeRemaining = () => {
    const now = Date.now();
    const updatedTimeRemaining: Record<string, number> = {};
    
    messages.forEach(message => {
      if (message.deleteAt) {
        const remaining = message.deleteAt - now;
        if (remaining > 0) {
          updatedTimeRemaining[message.id] = remaining;
        }
      }
    });
    
    setTimeRemaining(updatedTimeRemaining);
  };

  const renderMessage = ({ item }: { item: GroupMessage }) => {
    const isOwnMessage = item.sender === user?.email;
    const timeLeft = timeRemaining[item.id];

    return (
      <View style={[styles.messageContainer, isOwnMessage ? styles.ownMessage : styles.otherMessage]}>
        {!isOwnMessage && <Text style={styles.senderName}>{item.senderName}</Text>}
        <Text style={[styles.messageText, isOwnMessage ? styles.ownMessageText : styles.otherMessageText]}>
          {item.text}
        </Text>
        <View style={styles.messageFooter}>
          <Text style={[styles.timestamp, isOwnMessage ? styles.ownTimestamp : styles.otherTimestamp]}>
            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
          {timeLeft && (
            <Text style={styles.timeRemaining}>
              {formatTimeRemaining(timeLeft)}
            </Text>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        inverted
        contentContainerStyle={styles.messagesList}
      />
      <View style={styles.inputContainer}>
        <TouchableOpacity
          style={styles.autoDeleteButton}
          onPress={() => setShowAutoDeleteOptions(!showAutoDeleteOptions)}
        >
          <Ionicons name="timer-outline" size={24} color="#007AFF" />
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type a message..."
          multiline
        />
        <TouchableOpacity
          style={[styles.sendButton, sending && styles.sendingButton]}
          onPress={handleSendMessage}
          disabled={sending}
        >
          <Text style={styles.sendButtonText}>{sending ? 'Sending...' : 'Send'}</Text>
        </TouchableOpacity>
      </View>
      {showAutoDeleteOptions && (
        <View style={styles.autoDeleteOptions}>
          {AUTO_DELETE_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.autoDeleteOption,
                selectedAutoDeleteTime === option.value && styles.selectedAutoDeleteOption,
              ]}
              onPress={() => setSelectedAutoDeleteTime(option.value)}
            >
              <Ionicons
                name={option.icon as any}
                size={20}
                color={selectedAutoDeleteTime === option.value ? '#fff' : '#007AFF'}
              />
              <Text
                style={[
                  styles.autoDeleteOptionText,
                  selectedAutoDeleteTime === option.value && styles.selectedAutoDeleteOptionText,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesList: {
    padding: 10,
  },
  messageContainer: {
    maxWidth: '80%',
    marginVertical: 5,
    padding: 10,
    borderRadius: 10,
  },
  ownMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF',
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#E5E5EA',
  },
  senderName: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  messageText: {
    fontSize: 16,
  },
  ownMessageText: {
    color: '#fff',
  },
  otherMessageText: {
    color: '#000',
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 4,
  },
  timestamp: {
    fontSize: 10,
    marginRight: 4,
  },
  ownTimestamp: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  otherTimestamp: {
    color: '#666',
  },
  timeRemaining: {
    fontSize: 10,
    color: '#ff3b30',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    alignItems: 'center',
  },
  autoDeleteButton: {
    padding: 8,
    marginRight: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 8,
    justifyContent: 'center',
  },
  sendingButton: {
    opacity: 0.7,
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  autoDeleteOptions: {
    position: 'absolute',
    bottom: 70,
    left: 10,
    right: 10,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  autoDeleteOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 5,
  },
  selectedAutoDeleteOption: {
    backgroundColor: '#007AFF',
  },
  autoDeleteOptionText: {
    marginLeft: 10,
    color: '#007AFF',
  },
  selectedAutoDeleteOptionText: {
    color: '#fff',
  },
});

export default GroupChatScreen; 
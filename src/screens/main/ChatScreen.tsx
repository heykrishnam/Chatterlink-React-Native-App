import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { Message, subscribeToMessages, sendMessage, loadMoreMessages, deleteMessage } from '../../services/chat';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ChatStackParamList } from '../../types/navigation';
import { Ionicons } from '@expo/vector-icons';

type ChatScreenProps = NativeStackScreenProps<ChatStackParamList, 'ChatDetail'>;

const AUTO_DELETE_OPTIONS = [
  { label: '10 minutes', value: 600 },
  { label: '15 minutes', value: 900 },
  { label: '1 hour', value: 3600 },
  { label: '5 hours', value: 18000 },
  { label: '10 hours', value: 36000 },
  { label: '1 day', value: 86400 },
  { label: '5 days', value: 432000 },
];

const ChatScreen: React.FC<ChatScreenProps> = ({ route, navigation }) => {
  const { chatId, otherUserId } = route.params;
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [otherUsername, setOtherUsername] = useState<string>('');
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [autoDeleteTime, setAutoDeleteTime] = useState<number | undefined>(undefined);
  const { user } = useAuth();
  const flatListRef = useRef<FlatList>(null);
  const [showAutoDeleteMenu, setShowAutoDeleteMenu] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToMessages(
      chatId,
      (newMessages) => {
        setMessages(newMessages);
        setLoading(false);
      },
      20 // messageLimit parameter
    );

    loadOtherUser();

    return () => {
      unsubscribe();
    };
  }, [chatId]);

  const loadOtherUser = async () => {
    try {
      const userDoc = await getDoc(doc(db, 'users', otherUserId));
      if (userDoc.exists()) {
        setOtherUsername(userDoc.data().username || 'User');
      }
    } catch (error) {
      console.error('Error loading other user:', error);
      setOtherUsername('User');
    }
  };

  const handleLoadMore = async () => {
    if (!hasMoreMessages || loadingMore || messages.length === 0) return;

    setLoadingMore(true);
    try {
      const oldestMessage = messages[0];
      const olderMessages = await loadMoreMessages(chatId, oldestMessage.timestamp, 20);
      
      if (olderMessages.length < 20) {
        setHasMoreMessages(false);
      }
      
      setMessages(prevMessages => [...olderMessages, ...prevMessages]);
    } catch (error) {
      console.error('Error loading more messages:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !user) return;

    try {
      await sendMessage(chatId, newMessage.trim(), user.uid, autoDeleteTime);
      setNewMessage('');
      flatListRef.current?.scrollToEnd();
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
    }
  };

  const handleLongPressMessage = (message: Message) => {
    if (message.senderId === user?.uid) {
      setSelectedMessage(message);
      setShowDeleteModal(true);
    }
  };

  const handleDeleteMessage = async () => {
    if (!selectedMessage) return;

    try {
      await deleteMessage(chatId, selectedMessage.id);
      setShowDeleteModal(false);
      setSelectedMessage(null);
    } catch (error) {
      console.error('Error deleting message:', error);
      Alert.alert('Error', 'Failed to delete message. Please try again.');
    }
  };

  const formatTimeRemaining = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    return `${Math.floor(seconds / 86400)}d`;
  };

  const getSelectedTimeLabel = () => {
    if (!autoDeleteTime) return 'Set auto-delete';
    const option = AUTO_DELETE_OPTIONS.find(opt => opt.value === autoDeleteTime);
    return option ? option.label : 'Set auto-delete';
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMyMessage = item.senderId === user?.uid;
    const messageTime = item.timestamp?.toDate();
    const autoDeleteTime = item.autoDeleteAt?.toDate();
    const timeRemaining = autoDeleteTime ? Math.ceil((autoDeleteTime.getTime() - Date.now()) / 1000) : 0;

    return (
      <TouchableOpacity
        onLongPress={() => handleLongPressMessage(item)}
        style={[styles.messageContainer, isMyMessage ? styles.myMessage : styles.otherMessage]}
      >
        <Text style={[styles.messageText, isMyMessage ? styles.myMessageText : styles.otherMessageText]}>
          {item.text}
        </Text>
        <View style={styles.messageFooter}>
          <Text style={[styles.timestamp, isMyMessage ? styles.myTimestamp : styles.otherTimestamp]}>
            {messageTime?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
          {autoDeleteTime && timeRemaining > 0 && (
            <Text style={styles.autoDeleteText}>
              Deletes in {formatTimeRemaining(timeRemaining)}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
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
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        onLayout={() => flatListRef.current?.scrollToEnd()}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={loadingMore ? (
          <ActivityIndicator style={styles.loadingMore} />
        ) : null}
      />
      <View style={styles.inputContainer}>
        <TouchableOpacity
          style={styles.autoDeleteButton}
          onPress={() => setShowAutoDeleteMenu(true)}
        >
          <Text style={styles.autoDeleteButtonText}>{getSelectedTimeLabel()}</Text>
          <Ionicons name="chevron-up" size={16} color="#007AFF" />
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type a message..."
          multiline
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={showAutoDeleteMenu}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAutoDeleteMenu(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowAutoDeleteMenu(false)}
        >
          <View style={styles.autoDeleteMenu}>
            <View style={styles.autoDeleteMenuHeader}>
              <Text style={styles.autoDeleteMenuTitle}>Set auto-delete time</Text>
              <TouchableOpacity onPress={() => setShowAutoDeleteMenu(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            {AUTO_DELETE_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.autoDeleteMenuItem,
                  autoDeleteTime === option.value && styles.autoDeleteMenuItemSelected
                ]}
                onPress={() => {
                  setAutoDeleteTime(autoDeleteTime === option.value ? undefined : option.value);
                  setShowAutoDeleteMenu(false);
                }}
              >
                <Text style={[
                  styles.autoDeleteMenuItemText,
                  autoDeleteTime === option.value && styles.autoDeleteMenuItemTextSelected
                ]}>
                  {option.label}
                </Text>
                {autoDeleteTime === option.value && (
                  <Ionicons name="checkmark" size={20} color="#007AFF" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Delete Message?</Text>
            <Text style={styles.modalText}>This action cannot be undone.</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowDeleteModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.deleteButton]}
                onPress={handleDeleteMessage}
              >
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF',
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#E5E5EA',
  },
  messageText: {
    fontSize: 16,
  },
  myMessageText: {
    color: '#fff',
  },
  otherMessageText: {
    color: '#000',
  },
  timestamp: {
    fontSize: 12,
    marginTop: 5,
  },
  myTimestamp: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  otherTimestamp: {
    color: 'rgba(0, 0, 0, 0.5)',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
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
    justifyContent: 'center',
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  loadingMore: {
    paddingVertical: 10,
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  autoDeleteText: {
    fontSize: 10,
    color: '#FF3B30',
    marginLeft: 8,
  },
  autoDeleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
    marginBottom: 8,
  },
  autoDeleteButtonText: {
    fontSize: 14,
    color: '#007AFF',
  },
  autoDeleteMenu: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    padding: 16,
    maxHeight: '80%',
  },
  autoDeleteMenuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  autoDeleteMenuTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  autoDeleteMenuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  autoDeleteMenuItemSelected: {
    backgroundColor: '#F2F2F7',
  },
  autoDeleteMenuItemText: {
    fontSize: 16,
    color: '#000',
  },
  autoDeleteMenuItemTextSelected: {
    color: '#007AFF',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  modalText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  cancelButton: {
    backgroundColor: '#E5E5EA',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
  },
  cancelButtonText: {
    color: '#000',
    fontWeight: '600',
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default ChatScreen; 
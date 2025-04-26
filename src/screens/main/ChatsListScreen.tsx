import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { Chat, getUserChats, createChat, getExistingChat } from '../../services/chat';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChatStackParamList } from '../../types/navigation';
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit as firestoreLimit, startAfter } from 'firebase/firestore';
import { db } from '../../config/firebase';

type ChatsListScreenProps = {
  navigation: NativeStackNavigationProp<ChatStackParamList, 'ChatsList'>;
};

interface User {
  id: string;
  username?: string;
  email: string;
}

interface ChatWithUsername extends Chat {
  otherUsername?: string;
}

const ChatsListScreen: React.FC<ChatsListScreenProps> = ({ navigation }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [processingChat, setProcessingChat] = useState<string | null>(null);
  const [lastVisible, setLastVisible] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const { user } = useAuth();

  const fetchAllUsers = async (lastDoc?: any) => {
    try {
      if (!user?.email) return;

      const usersRef = collection(db, 'users');
      let q = query(
        usersRef,
        where('email', '!=', user.email),
        orderBy('email'),
        firestoreLimit(20)
      );

      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      const snapshot = await getDocs(q);
      const lastVisible = snapshot.docs[snapshot.docs.length - 1];
      setLastVisible(lastVisible);
      setHasMore(snapshot.docs.length === 20);

      const newUsers = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as User[];

      setUsers(prev => lastDoc ? [...prev, ...newUsers] : newUsers);
      setFilteredUsers(prev => lastDoc ? [...prev, ...newUsers] : newUsers);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching users:', error);
      Alert.alert('Error', 'Failed to load users. Please try again.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllUsers();
  }, []);

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      fetchAllUsers(lastVisible);
    }
  };

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = users.filter(user => 
        user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [searchQuery, users]);

  const handleUserPress = async (selectedUser: User) => {
    if (!user?.uid) {
      Alert.alert('Error', 'You must be logged in to start a chat');
      return;
    }

    setProcessingChat(selectedUser.id);
    try {
      const existingChat = await getExistingChat(user.uid, selectedUser.id);
      
      if (existingChat) {
        navigation.navigate('Chat', {
          chatId: existingChat.id,
          otherUserId: selectedUser.id
        });
      } else {
        const newChat = await createChat([user.uid, selectedUser.id]);
        navigation.navigate('Chat', {
          chatId: newChat,
          otherUserId: selectedUser.id
        });
      }
    } catch (error) {
      console.error('Error handling user press:', error);
      Alert.alert('Error', 'Failed to start chat. Please try again.');
    } finally {
      setProcessingChat(null);
    }
  };

  const renderUserItem = ({ item }: { item: User }) => (
    <TouchableOpacity
      style={styles.userItem}
      onPress={() => handleUserPress(item)}
      disabled={!!processingChat}
    >
      <View style={styles.avatarContainer}>
        <Text style={styles.avatarText}>
          {item.username?.[0]?.toUpperCase() || item.email[0].toUpperCase()}
        </Text>
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.username}>{item.username || 'User'}</Text>
        <Text style={styles.email}>{item.email}</Text>
      </View>
      {processingChat === item.id && (
        <ActivityIndicator style={styles.loadingIndicator} />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Contacts</Text>
      </View>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search users..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      <FlatList
        data={filteredUsers}
        renderItem={renderUserItem}
        keyExtractor={item => item.id}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator style={styles.loadingIndicator} />
          ) : (
            <Text style={styles.emptyText}>
              {searchQuery ? 'No users found' : 'No users available'}
            </Text>
          )
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  searchContainer: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchInput: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 10,
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    flexGrow: 1,
  },
  userItem: {
    flexDirection: 'row',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#666',
  },
  loadingIndicator: {
    position: 'absolute',
    right: 10,
    top: '50%',
    marginTop: -10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
});

export default ChatsListScreen; 
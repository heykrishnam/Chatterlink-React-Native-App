import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Alert } from 'react-native';
import { Text, List, Avatar, Searchbar, ActivityIndicator } from 'react-native-paper';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChatStackParamList } from '../types/navigation';
import { getExistingChat, createChat } from '../services/chat';

type NavigationProp = NativeStackNavigationProp<ChatStackParamList, 'ChatDetail'>;

interface User {
  id: string;
  username: string;
  email: string;
  online: boolean;
}

export default function ContactsScreen() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const { user: currentUser } = useAuth();
  const navigation = useNavigation<NavigationProp>();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '!=', currentUser?.email));
        const querySnapshot = await getDocs(q);
        
        const fetchedUsers: User[] = [];
        querySnapshot.forEach((doc) => {
          fetchedUsers.push({
            id: doc.id,
            ...doc.data() as Omit<User, 'id'>
          });
        });
        
        setUsers(fetchedUsers);
        setFilteredUsers(fetchedUsers);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [currentUser]);

  useEffect(() => {
    const filtered = users.filter(user =>
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [searchQuery, users]);

  const handleUserPress = async (user: User) => {
    if (!currentUser?.uid) return;
    
    try {
      // Check if a chat already exists between these users
      const existingChat = await getExistingChat(currentUser.uid, user.id);
      
      let chatId;
      if (existingChat) {
        chatId = existingChat.id;
      } else {
        // Create a new chat if one doesn't exist
        chatId = await createChat([currentUser.uid, user.id]);
      }
      
      // Navigate directly to the ChatDetail screen
      navigation.navigate('ChatDetail', {
        chatId,
        otherUserId: user.id,
        otherUsername: user.username
      });
    } catch (error) {
      console.error('Error handling user press:', error);
      // Show an error message to the user
      Alert.alert('Error', 'Failed to open chat. Please try again.');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Search users..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
      />

      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <List.Item
            title={item.username}
            description={item.email}
            left={() => (
              <Avatar.Text
                size={40}
                label={item.username.substring(0, 2).toUpperCase()}
              />
            )}
            right={() => (
              <View style={[
                styles.statusIndicator,
                { backgroundColor: item.online ? '#4CAF50' : '#9E9E9E' }
              ]} />
            )}
            onPress={() => handleUserPress(item)}
          />
        )}
        ListEmptyComponent={() => (
          <Text style={styles.emptyText}>No users found</Text>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBar: {
    margin: 16,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    opacity: 0.6,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 16,
    alignSelf: 'center',
  },
}); 
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image
} from 'react-native';
import { db, auth } from '../../config/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface User {
  id: string;
  uid: string;
  username: string;
  email: string;
  photoURL?: string;
}

interface CreateGroupScreenProps {
  navigation: any;
}

const CreateGroupScreen: React.FC<CreateGroupScreenProps> = ({ navigation }) => {
  const [groupName, setGroupName] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setLoading(false);
      return;
    }

    // Query all users except current user
    const usersQuery = query(
      collection(db, 'users'),
      where('uid', '!=', currentUser.uid)
    );

    const fetchUsers = async () => {
      try {
        const snapshot = await getDocs(usersQuery);
        const usersList: User[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          usersList.push({
            id: doc.id,
            ...data
          } as User);
        });
        setUsers(usersList);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching users:', error);
        Alert.alert('Error', 'Failed to load users');
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleUserSelect = (user: User) => {
    setSelectedUsers(prev => {
      const isSelected = prev.some(u => u.uid === user.uid);
      if (isSelected) {
        return prev.filter(u => u.uid !== user.uid);
      } else {
        return [...prev, user];
      }
    });
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert('Error', 'Please enter a group name');
      return;
    }

    if (selectedUsers.length < 2) {
      Alert.alert('Error', 'Please select at least 2 members');
      return;
    }

    const currentUser = auth.currentUser;
    if (!currentUser) return;

    try {
      // Create group chat document
      const groupData = {
        name: groupName.trim(),
        type: 'group',
        participants: [currentUser.uid, ...selectedUsers.map(u => u.uid)],
        participantNames: {
          [currentUser.uid]: currentUser.displayName || currentUser.email,
          ...selectedUsers.reduce((acc, user) => ({
            ...acc,
            [user.uid]: user.username
          }), {})
        },
        createdAt: serverTimestamp(),
        lastMessage: null,
        createdBy: currentUser.uid
      };

      const groupRef = await addDoc(collection(db, 'chats'), groupData);
      
      // Add initial message
      await addDoc(collection(db, 'messages'), {
        chatId: groupRef.id,
        text: `${currentUser.displayName || currentUser.email} created the group "${groupName.trim()}"`,
        sender: currentUser.uid,
        senderName: currentUser.displayName || currentUser.email,
        timestamp: serverTimestamp(),
        type: 'system'
      });

      navigation.navigate('Chat', { chatId: groupRef.id });
    } catch (error) {
      console.error('Error creating group:', error);
      Alert.alert('Error', 'Failed to create group');
    }
  };

  const filteredUsers = users.filter(user =>
    user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderUser = ({ item }: { item: User }) => {
    const isSelected = selectedUsers.some(u => u.uid === item.uid);

    return (
      <TouchableOpacity
        style={styles.userItem}
        onPress={() => handleUserSelect(item)}
      >
        <View style={styles.avatarContainer}>
          {item.photoURL ? (
            <Image
              source={{ uri: item.photoURL }}
              style={styles.avatar}
            />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarText}>
                {item.username?.charAt(0)?.toUpperCase() || '?'}
              </Text>
            </View>
          )}
          {isSelected && (
            <View style={styles.selectedIndicator}>
              <Icon name="check" size={16} color="#fff" />
            </View>
          )}
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.username}>{item.username || 'Unknown User'}</Text>
          <Text style={styles.email}>{item.email}</Text>
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
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Create New Group</Text>
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={groupName}
          onChangeText={setGroupName}
          placeholder="Enter group name"
          placeholderTextColor="#999"
        />
      </View>

      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search users..."
          placeholderTextColor="#999"
        />
      </View>

      <Text style={styles.sectionTitle}>
        Select Members ({selectedUsers.length} selected)
      </Text>

      <FlatList
        data={filteredUsers}
        renderItem={renderUser}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
      />

      <TouchableOpacity
        style={[
          styles.createButton,
          (!groupName.trim() || selectedUsers.length < 2) && styles.createButtonDisabled
        ]}
        onPress={handleCreateGroup}
        disabled={!groupName.trim() || selectedUsers.length < 2}
      >
        <Text style={styles.createButtonText}>Create Group</Text>
      </TouchableOpacity>
    </View>
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
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  inputContainer: {
    padding: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  listContainer: {
    padding: 16,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  selectedIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  email: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  createButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    margin: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  createButtonDisabled: {
    backgroundColor: '#ccc',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CreateGroupScreen; 
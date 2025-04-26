import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image
} from 'react-native';
import { db, auth } from '../../config/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface Group {
  id: string;
  name: string;
  members: string[];
  photoURL?: string;
  lastMessage?: {
    text: string;
    senderName: string;
    timestamp: Date;
  };
}

interface GroupsScreenProps {
  navigation: any;
}

const GroupsScreen: React.FC<GroupsScreenProps> = ({ navigation }) => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setLoading(false);
      return;
    }

    // Query groups where current user is a member
    const groupsQuery = query(
      collection(db, 'groups'),
      where('members', 'array-contains', currentUser.email)
    );

    const unsubscribe = onSnapshot(groupsQuery,
      (snapshot) => {
        const groupsList: Group[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          const { id, ...rest } = data;
          groupsList.push({
            ...rest,
            id: doc.id,
            lastMessage: data.lastMessage ? {
              ...data.lastMessage,
              timestamp: data.lastMessage.timestamp?.toDate?.() || null
            } : undefined
          } as Group);
        });
        // Sort groups by last message timestamp
        groupsList.sort((a, b) => {
          const timeA = a.lastMessage?.timestamp?.getTime() || 0;
          const timeB = b.lastMessage?.timestamp?.getTime() || 0;
          return timeB - timeA;
        });
        setGroups(groupsList);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching groups:', error);
        Alert.alert('Error', 'Failed to load groups');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleGroupPress = (group: Group) => {
    navigation.navigate('GroupChat', { 
      group: {
        id: group.id,
        ...group
      }
    });
  };

  const handleCreateGroup = () => {
    navigation.navigate('CreateGroup');
  };

  const handleJoinGroup = () => {
    navigation.navigate('JoinGroup');
  };

  const renderGroup = ({ item }: { item: Group }) => {
    const lastMessage = item.lastMessage;
    const lastMessageTime = lastMessage?.timestamp 
      ? new Date(lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : '';

    return (
      <TouchableOpacity
        style={styles.groupItem}
        onPress={() => handleGroupPress(item)}
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
                {item.name?.charAt(0)?.toUpperCase() || 'G'}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.groupInfo}>
          <Text style={styles.groupName}>{item.name}</Text>
          <Text style={styles.memberCount}>
            {item.members?.length || 0} members
          </Text>
          {lastMessage && (
            <View style={styles.lastMessageContainer}>
              <Text style={styles.lastMessageText} numberOfLines={1}>
                {lastMessage.senderName}: {lastMessage.text}
              </Text>
              <Text style={styles.lastMessageTime}>{lastMessageTime}</Text>
            </View>
          )}
        </View>
        <Icon name="chevron-right" size={24} color="#666" />
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
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleCreateGroup}
        >
          <Icon name="group-add" size={24} color="#fff" />
          <Text style={styles.buttonText}>Create Group</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleJoinGroup}
        >
          <Icon name="group" size={24} color="#fff" />
          <Text style={styles.buttonText}>Join Group</Text>
        </TouchableOpacity>
      </View>

      {groups.length === 0 ? (
        <View style={styles.emptyState}>
          <Icon name="groups" size={64} color="#ccc" />
          <Text style={styles.emptyStateText}>No groups found</Text>
          <Text style={styles.emptyStateSubtext}>
            Create a new group or wait to be added to one
          </Text>
        </View>
      ) : (
        <FlatList
          data={groups}
          renderItem={renderGroup}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
        />
      )}
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
  buttonContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    padding: 12,
    marginHorizontal: 8,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  listContainer: {
    padding: 16,
  },
  groupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  avatarContainer: {
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
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  memberCount: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  lastMessageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  lastMessageText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  lastMessageTime: {
    fontSize: 12,
    color: '#999',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});

export default GroupsScreen; 
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { Group, getUserGroups, createGroup, joinGroup } from '../../services/group';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainTabParamList } from '../../types/navigation';
import { Ionicons } from '@expo/vector-icons';
import { GROUP_TYPES } from '../../utils/group-chat/constants';

type GroupsScreenNavigationProp = NativeStackNavigationProp<MainTabParamList, 'Groups'>;

// Extended Group interface to include optional properties
interface ExtendedGroup extends Group {
  photoURL?: string;
  lastMessage?: {
    senderName: string;
    content: string;
  };
}

const GroupsScreen: React.FC = () => {
  const [groups, setGroups] = useState<ExtendedGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [newGroupName, setNewGroupName] = useState('');
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();
  const navigation = useNavigation<GroupsScreenNavigationProp>();

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      if (!user) return;
      const userGroups = await getUserGroups(user.uid);
      setGroups(userGroups as ExtendedGroup[]);
    } catch (error) {
      console.error('Error loading groups:', error);
      Alert.alert('Error', 'Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim() || !user) return;

    try {
      setLoading(true);
      await createGroup(newGroupName.trim(), user.uid);
      setNewGroupName('');
      setShowCreateGroup(false);
      await loadGroups();
    } catch (error) {
      console.error('Error creating group:', error);
      Alert.alert('Error', 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGroup = async (groupId: string) => {
    if (!user) return;

    try {
      setLoading(true);
      await joinGroup(groupId, user.uid);
      await loadGroups();
    } catch (error) {
      console.error('Error joining group:', error);
      Alert.alert('Error', 'Failed to join group');
    } finally {
      setLoading(false);
    }
  };

  const filteredGroups = groups.filter(group => 
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderGroupItem = ({ item }: { item: ExtendedGroup }) => (
    <TouchableOpacity
      style={styles.groupItem}
      onPress={() => {
        // Navigate to the Groups tab, which will handle the navigation to GroupChat
        navigation.navigate('Groups');
      }}
    >
      <View style={styles.groupAvatar}>
        {item.photoURL ? (
          <Image source={{ uri: item.photoURL }} style={styles.avatarImage} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
          </View>
        )}
      </View>
      <View style={styles.groupInfo}>
        <Text style={styles.groupName}>{item.name}</Text>
        <Text style={styles.memberCount}>{item.members.length} members</Text>
        {item.lastMessage && (
          <Text style={styles.lastMessage} numberOfLines={1}>
            {item.lastMessage.senderName}: {item.lastMessage.content}
          </Text>
        )}
      </View>
      {!item.members.includes(user?.uid || '') && (
        <TouchableOpacity
          style={styles.joinButton}
          onPress={() => handleJoinGroup(item.id)}
        >
          <Text style={styles.joinButtonText}>Join</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

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
        <Text style={styles.headerTitle}>Groups</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => setShowCreateGroup(!showCreateGroup)}
        >
          <Ionicons name="add-circle" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search groups..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {showCreateGroup && (
        <View style={styles.createGroupContainer}>
          <TextInput
            style={styles.input}
            placeholder="Enter group name"
            value={newGroupName}
            onChangeText={setNewGroupName}
          />
          <TouchableOpacity
            style={[styles.createGroupButton, !newGroupName.trim() && styles.disabledButton]}
            onPress={handleCreateGroup}
            disabled={!newGroupName.trim()}
          >
            <Text style={styles.createGroupButtonText}>Create Group</Text>
          </TouchableOpacity>
        </View>
      )}

      {filteredGroups.length > 0 ? (
        <FlatList
          data={filteredGroups}
          renderItem={renderGroupItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="people" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No groups found</Text>
          <Text style={styles.emptySubtext}>
            Create a new group or join an existing one
          </Text>
        </View>
      )}
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  createButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    margin: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  createGroupContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  createGroupButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  createGroupButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#ccc',
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
  groupAvatar: {
    marginRight: 12,
  },
  avatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
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
  },
  memberCount: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  joinButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  joinButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
});

export default GroupsScreen; 
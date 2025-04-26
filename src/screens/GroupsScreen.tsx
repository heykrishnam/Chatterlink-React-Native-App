import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { getGroups, createGroup, joinGroup } from '../services/group';
import { Group } from '../types/group-chat';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { AUTO_DELETE_OPTIONS } from '../utils/group-chat/constants';

type GroupsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Main'>;

const GroupsScreen: React.FC = () => {
  const navigation = useNavigation<GroupsScreenNavigationProp>();
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'join' | 'create'>('create');
  const [groupName, setGroupName] = useState('');
  const [autoDelete, setAutoDelete] = useState<number | null>(null);

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    if (!user) return;
    try {
      const userGroups = await getGroups(user.uid);
      setGroups(userGroups);
    } catch (error) {
      console.error('Error loading groups:', error);
      Alert.alert('Error', 'Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!user || !groupName.trim()) return;

    try {
      const autoDeleteValue = autoDelete === null ? undefined : autoDelete;
      await createGroup(groupName.trim(), user.uid, autoDeleteValue);
      setModalVisible(false);
      setGroupName('');
      setAutoDelete(null);
      loadGroups();
    } catch (error) {
      console.error('Error creating group:', error);
      Alert.alert('Error', 'Failed to create group');
    }
  };

  const handleJoinGroup = async () => {
    if (!user || !groupName.trim()) return;

    try {
      await joinGroup(groupName.trim(), user.uid);
      setModalVisible(false);
      setGroupName('');
      loadGroups();
    } catch (error) {
      console.error('Error joining group:', error);
      Alert.alert('Error', 'Failed to join group');
    }
  };

  const renderGroupItem = ({ item }: { item: Group }) => (
    <TouchableOpacity
      style={styles.groupItem}
      onPress={() => navigation.navigate('GroupChat', { 
        groupId: item.id,
        groupName: item.name 
      })}
    >
      <View style={styles.groupInfo}>
        <Text style={styles.groupName}>{item.name}</Text>
        <Text style={styles.memberCount}>
          {item.members.length} {item.members.length === 1 ? 'member' : 'members'}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={24} color="#666" />
    </TouchableOpacity>
  );

  const renderModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={modalVisible}
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>
            {modalType === 'create' ? 'Create New Group' : 'Join Group'}
          </Text>
          
          <TextInput
            style={styles.input}
            placeholder="Group Name"
            value={groupName}
            onChangeText={setGroupName}
            autoCapitalize="none"
          />

          {modalType === 'create' && (
            <View style={styles.autoDeleteContainer}>
              <Text style={styles.autoDeleteLabel}>Auto-delete messages after:</Text>
              <View style={styles.autoDeleteOptions}>
                {AUTO_DELETE_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.autoDeleteOption,
                      autoDelete === option.value && styles.autoDeleteOptionSelected,
                    ]}
                    onPress={() => setAutoDelete(option.value)}
                  >
                    <Ionicons
                      name={option.icon as any}
                      size={20}
                      color={autoDelete === option.value ? '#fff' : '#007AFF'}
                    />
                    <Text
                      style={[
                        styles.autoDeleteOptionText,
                        autoDelete === option.value && styles.autoDeleteOptionTextSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => {
                setModalVisible(false);
                setGroupName('');
                setAutoDelete(null);
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.modalButton, styles.confirmButton]}
              onPress={modalType === 'create' ? handleCreateGroup : handleJoinGroup}
              disabled={!groupName.trim()}
            >
              <Text style={styles.confirmButtonText}>
                {modalType === 'create' ? 'Create' : 'Join'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
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
        <Text style={styles.title}>Groups</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            setModalType('create');
            setModalVisible(true);
          }}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={groups}
        renderItem={renderGroupItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No groups yet</Text>
            <TouchableOpacity
              style={styles.joinButton}
              onPress={() => {
                setModalType('join');
                setModalVisible(true);
              }}
            >
              <Text style={styles.joinButtonText}>Join a Group</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {renderModal()}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
  },
  groupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  memberCount: {
    fontSize: 14,
    color: '#666',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    fontSize: 16,
  },
  autoDeleteContainer: {
    marginBottom: 20,
  },
  autoDeleteLabel: {
    fontSize: 16,
    marginBottom: 12,
    color: '#666',
  },
  autoDeleteOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  autoDeleteOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  autoDeleteOptionSelected: {
    backgroundColor: '#007AFF',
  },
  autoDeleteOptionText: {
    marginLeft: 4,
    color: '#007AFF',
  },
  autoDeleteOptionTextSelected: {
    color: '#fff',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#FF3B30',
  },
  confirmButton: {
    backgroundColor: '#007AFF',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
  },
  joinButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  joinButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default GroupsScreen; 
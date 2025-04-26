import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { GroupsStackParamList } from '../../types/navigation';
import { createGroup } from '../../services/group';
import { MAX_GROUP_NAME_LENGTH } from '../../utils/group-chat/constants';

type CreateGroupScreenNavigationProp = NativeStackNavigationProp<GroupsStackParamList, 'CreateGroup'>;

const CreateGroupScreen: React.FC = () => {
  const [groupName, setGroupName] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigation = useNavigation<CreateGroupScreenNavigationProp>();

  const handleCreateGroup = async () => {
    if (!groupName.trim() || !user?.email) return;

    try {
      setLoading(true);
      const groupId = await createGroup(groupName.trim(), user.email);
      Alert.alert('Success', 'Group created successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Error creating group:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create New Group</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Enter group name"
        value={groupName}
        onChangeText={setGroupName}
        maxLength={MAX_GROUP_NAME_LENGTH}
        autoCapitalize="none"
      />
      
      <Text style={styles.characterCount}>
        {groupName.length}/{MAX_GROUP_NAME_LENGTH} characters
      </Text>
      
      <Text style={styles.infoText}>
        Note: The group name will be used as the unique identifier for the group.
        Choose a name that is easy to remember and share with others.
      </Text>
      
      <TouchableOpacity
        style={[styles.createButton, !groupName.trim() && styles.disabledButton]}
        onPress={handleCreateGroup}
        disabled={!groupName.trim() || loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.createButtonText}>Create Group</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 8,
  },
  characterCount: {
    fontSize: 12,
    color: '#666',
    marginBottom: 20,
    textAlign: 'right',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  createButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
});

export default CreateGroupScreen; 
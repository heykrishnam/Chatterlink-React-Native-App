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
import { joinGroup, getGroupDetails } from '../../services/group';

type JoinGroupScreenNavigationProp = NativeStackNavigationProp<GroupsStackParamList, 'JoinGroup'>;

const JoinGroupScreen: React.FC = () => {
  const [groupName, setGroupName] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigation = useNavigation<JoinGroupScreenNavigationProp>();

  const handleJoinGroup = async () => {
    if (!groupName.trim() || !user?.email) return;

    try {
      setLoading(true);
      
      // First check if the group exists
      const group = await getGroupDetails(groupName.trim());
      if (!group) {
        Alert.alert('Error', 'Group not found. Please check the group name and try again.');
        return;
      }
      
      // Check if user is already a member
      if (group.members.includes(user.email)) {
        Alert.alert('Info', 'You are already a member of this group.');
        navigation.goBack();
        return;
      }
      
      // Join the group
      await joinGroup(groupName.trim(), user.email);
      Alert.alert('Success', 'You have joined the group successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Error joining group:', error);
      Alert.alert('Error', 'Failed to join group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Join Group</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Enter group name"
        value={groupName}
        onChangeText={setGroupName}
        autoCapitalize="none"
      />
      
      <Text style={styles.infoText}>
        Enter the exact group name to join. Group names are case-sensitive.
      </Text>
      
      <TouchableOpacity
        style={[styles.joinButton, !groupName.trim() && styles.disabledButton]}
        onPress={handleJoinGroup}
        disabled={!groupName.trim() || loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.joinButtonText}>Join Group</Text>
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
    marginBottom: 20,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  joinButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  joinButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
});

export default JoinGroupScreen; 
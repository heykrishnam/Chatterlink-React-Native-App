import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator
} from 'react-native';
import { db, auth } from '../../config/firebase';
import { collection, query, where, getDocs, updateDoc, doc, arrayUnion, serverTimestamp, addDoc } from 'firebase/firestore';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface JoinGroupScreenProps {
  navigation: any;
}

const JoinGroupScreen: React.FC<JoinGroupScreenProps> = ({ navigation }) => {
  const [groupId, setGroupId] = useState('');
  const [loading, setLoading] = useState(false);

  const handleJoinGroup = async () => {
    if (!groupId.trim()) {
      Alert.alert('Error', 'Please enter a group name');
      return;
    }

    setLoading(true);
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setLoading(false);
      return;
    }

    try {
      // Query the group by name
      const groupsQuery = query(
        collection(db, 'groups'),
        where('name', '==', groupId.trim())
      );

      const snapshot = await getDocs(groupsQuery);
      
      if (snapshot.empty) {
        Alert.alert('Error', 'Group not found. Please check the group name and try again.');
        setLoading(false);
        return;
      }

      const groupDoc = snapshot.docs[0];
      const groupData = groupDoc.data();

      // Check if user is already a member
      if (groupData.members.includes(currentUser.email)) {
        Alert.alert('Error', 'You are already a member of this group');
        setLoading(false);
        return;
      }

      // Add user to the group
      await updateDoc(doc(db, 'groups', groupDoc.id), {
        members: arrayUnion(currentUser.email)
      });

      // Add system message
      await addDoc(collection(db, 'messages'), {
        chatId: groupDoc.id,
        text: `${currentUser.displayName || currentUser.email} joined the group`,
        sender: currentUser.email,
        senderName: currentUser.displayName || currentUser.email,
        timestamp: serverTimestamp(),
        type: 'system'
      });

      Alert.alert('Success', 'Successfully joined the group!');
      navigation.navigate('GroupChat', {
        group: {
          id: groupDoc.id,
          ...groupData
        }
      });
    } catch (error) {
      console.error('Error joining group:', error);
      Alert.alert('Error', 'Failed to join group. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Join Group</Text>
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={groupId}
          onChangeText={setGroupId}
          placeholder="Enter group name"
          placeholderTextColor="#999"
        />
      </View>

      <TouchableOpacity
        style={[styles.joinButton, loading && styles.joinButtonDisabled]}
        onPress={handleJoinGroup}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Icon name="group" size={24} color="#fff" />
            <Text style={styles.joinButtonText}>Join Group</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    padding: 16,
    margin: 16,
    borderRadius: 8,
  },
  joinButtonDisabled: {
    backgroundColor: '#ccc',
  },
  joinButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default JoinGroupScreen; 
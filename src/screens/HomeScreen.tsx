import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Card, Button } from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from '../types/navigation';

type Props = BottomTabScreenProps<MainTabParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const { user } = useAuth();

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.welcome}>
        Welcome to WeVitChat
      </Text>
      
      <Text variant="titleMedium" style={styles.subtitle}>
        Your secure messaging platform
      </Text>

      <View style={styles.cardsContainer}>
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium">Direct Messages</Text>
            <Text variant="bodyMedium">Chat privately with other users</Text>
          </Card.Content>
          <Card.Actions>
            <Button onPress={() => navigation.navigate('Chat')}>
              Open Chats
            </Button>
          </Card.Actions>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium">Find Users</Text>
            <Text variant="bodyMedium">Search and connect with other users</Text>
          </Card.Content>
          <Card.Actions>
            <Button onPress={() => navigation.navigate('Search')}>
              Search Users
            </Button>
          </Card.Actions>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium">Groups</Text>
            <Text variant="bodyMedium">Join and participate in group conversations</Text>
          </Card.Content>
          <Card.Actions>
            <Button onPress={() => navigation.navigate('Groups')}>
              View Groups
            </Button>
          </Card.Actions>
        </Card>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  welcome: {
    textAlign: 'center',
    marginVertical: 20,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 30,
    opacity: 0.7,
  },
  cardsContainer: {
    gap: 20,
  },
  card: {
    marginBottom: 15,
  },
}); 
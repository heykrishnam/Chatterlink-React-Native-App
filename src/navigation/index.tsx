import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../contexts/AuthContext';
import { RootStackParamList, AuthStackParamList, MainTabParamList, ChatStackParamList, ServicesStackParamList, GroupsStackParamList } from '../types/navigation';
import { View, Text } from 'react-native';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Ionicons } from '@expo/vector-icons';

// Import screens
import LoginScreen from '../screens/auth/LoginScreen';
import SignUpScreen from '../screens/auth/SignUpScreen';
import HomeScreen from '../screens/HomeScreen';
import ChatsListScreen from '../screens/main/ChatsListScreen';
import ChatDetailScreen from '../screens/main/ChatScreen';
import ContactsScreen from '../screens/main/ContactsScreen';
import ServicesScreen from '../screens/main/ServicesScreen';
import AIAssistantScreen from '../screens/main/AIAssistantScreen';
import GroupsScreen from '../screens/main/GroupsScreen';
import GroupChatScreen from '../screens/main/GroupChatScreen';
import CreateGroupScreen from '../screens/main/CreateGroupScreen';
import JoinGroupScreen from '../screens/main/JoinGroupScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();
const ChatStack = createNativeStackNavigator<ChatStackParamList>();
const ServicesStack = createNativeStackNavigator<ServicesStackParamList>();
const GroupsStack = createNativeStackNavigator<GroupsStackParamList>();

const AuthNavigator = () => {
  return (
    <AuthStack.Navigator>
      <AuthStack.Screen 
        name="Login" 
        component={LoginScreen}
        options={{ headerShown: false }}
      />
      <AuthStack.Screen 
        name="SignUp" 
        component={SignUpScreen}
        options={{ headerShown: false }}
      />
    </AuthStack.Navigator>
  );
};

// Custom tab bar icon component
const TabBarIcon = ({ name, color, size }: { name: string, color: string, size: number }) => {
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color, fontSize: size * 0.8 }}>{name.charAt(0)}</Text>
    </View>
  );
};

const ChatNavigator = () => {
  const [usernames, setUsernames] = useState<Record<string, string>>({});

  const loadUsername = async (userId: string) => {
    if (usernames[userId]) return;
    
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        setUsernames(prev => ({
          ...prev,
          [userId]: userDoc.data().username || 'User'
        }));
      }
    } catch (error) {
      console.error('Error loading username:', error);
    }
  };

  return (
    <ChatStack.Navigator>
      <ChatStack.Screen 
        name="ChatsList" 
        component={ChatsListScreen}
        options={{ headerShown: false }}
      />
      <ChatStack.Screen 
        name="ChatDetail" 
        component={ChatDetailScreen}
        options={({ route }) => {
          const { otherUserId } = route.params;
          // Load username if not already loaded
          if (!usernames[otherUserId]) {
            loadUsername(otherUserId);
          }
          
          return {
            title: usernames[otherUserId] || 'Chat',
          };
        }}
      />
      <ChatStack.Screen 
        name="Contacts" 
        component={ContactsScreen}
        options={{ title: 'Contacts' }}
      />
    </ChatStack.Navigator>
  );
};

const ServicesNavigator = () => {
  return (
    <ServicesStack.Navigator>
      <ServicesStack.Screen 
        name="ServicesList" 
        component={ServicesScreen}
        options={{ headerShown: false }}
      />
      <ServicesStack.Screen 
        name="AIAssistant" 
        component={AIAssistantScreen}
        options={{ title: 'AI Assistant' }}
      />
      <ServicesStack.Screen 
        name="BreachDirectory" 
        component={ServicesScreen} // TODO: Replace with BreachDirectoryScreen
        options={{ title: 'Breach Directory' }}
      />
    </ServicesStack.Navigator>
  );
};

const GroupsNavigator = () => {
  return (
    <GroupsStack.Navigator>
      <GroupsStack.Screen 
        name="GroupsList" 
        component={GroupsScreen}
        options={{ headerShown: false }}
      />
      <GroupsStack.Screen 
        name="GroupChat" 
        component={GroupChatScreen}
        options={({ route }) => ({
          title: route.params.groupName || 'Group Chat',
          headerBackTitle: 'Back'
        })}
      />
      <GroupsStack.Screen 
        name="CreateGroup" 
        component={CreateGroupScreen}
        options={{ title: 'Create Group' }}
      />
      <GroupsStack.Screen 
        name="JoinGroup" 
        component={JoinGroupScreen}
        options={{ title: 'Join Group' }}
      />
    </GroupsStack.Navigator>
  );
};

const MainNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Chat') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          } else if (route.name === 'Services') {
            iconName = focused ? 'flash' : 'flash-outline';
          } else if (route.name === 'Groups') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Chat" component={ChatNavigator} />
      <Tab.Screen name="Services" component={ServicesNavigator} />
      <Tab.Screen name="Groups" component={GroupsNavigator} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

export const Navigation = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return null; // Or a loading screen
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {user ? (
          <Stack.Screen 
            name="Main" 
            component={MainNavigator}
            options={{ headerShown: false }}
          />
        ) : (
          <Stack.Screen 
            name="Auth" 
            component={AuthNavigator}
            options={{ headerShown: false }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}; 
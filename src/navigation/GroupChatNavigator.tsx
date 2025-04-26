import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import GroupsScreen from '../screens/group-chat/GroupsScreen';
import GroupChatScreen from '../screens/group-chat/GroupChatScreen';
import CreateGroupScreen from '../screens/group-chat/CreateGroupScreen';
import JoinGroupScreen from '../screens/group-chat/JoinGroupScreen';

export type GroupChatStackParamList = {
  Groups: undefined;
  GroupChat: { group: any };
  CreateGroup: undefined;
  JoinGroup: undefined;
};

const Stack = createStackNavigator<GroupChatStackParamList>();

const GroupChatNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#fff' }
      }}
    >
      <Stack.Screen name="Groups" component={GroupsScreen} />
      <Stack.Screen name="GroupChat" component={GroupChatScreen} />
      <Stack.Screen name="CreateGroup" component={CreateGroupScreen} />
      <Stack.Screen name="JoinGroup" component={JoinGroupScreen} />
    </Stack.Navigator>
  );
};

export default GroupChatNavigator; 
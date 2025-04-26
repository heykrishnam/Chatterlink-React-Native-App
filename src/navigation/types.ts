export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Chat: { userId: string; userName: string };
  GroupChat: { groupId: string; groupName: string };
};

export type ChatStackParamList = {
  ChatList: undefined;
  Chat: { userId: string; userName: string };
  GroupChat: { groupId: string; groupName: string };
};

export type MainTabParamList = {
  Chats: undefined;
  Groups: undefined;
  Profile: undefined;
}; 
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Login: undefined;
  SignUp: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  SignUp: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Chat: undefined;
  Services: undefined;
  Groups: undefined;
  Profile: undefined;
};

export type ChatStackParamList = {
  ChatsList: undefined;
  ChatDetail: {
    chatId: string;
    otherUserId: string;
    otherUsername?: string;
  };
  Contacts: undefined;
};

export type ServicesStackParamList = {
  ServicesList: undefined;
  AIAssistant: undefined;
  BreachDirectory: undefined;
};

export type GroupsStackParamList = {
  GroupsList: undefined;
  GroupChat: {
    groupId: string;
    groupName: string;
  };
  CreateGroup: undefined;
  JoinGroup: undefined;
}; 
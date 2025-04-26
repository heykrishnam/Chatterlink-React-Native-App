import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';

interface BotMessage {
  id: string;
  text: string;
  senderId: string;
  timestamp: Date;
  isBot: boolean;
}

const AIAssistantScreen: React.FC = () => {
  const [messages, setMessages] = useState<BotMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const { user } = useAuth();
  const flatListRef = useRef<FlatList<BotMessage>>(null);

  // Bot response patterns and their corresponding responses
  const botPatterns = [
    {
      pattern: /hello|hi|hey/i,
      responses: [
        "Hello! How can I help you today?",
        "Hi there! What can I do for you?",
        "Hey! How may I assist you?"
      ]
    },
    {
      pattern: /how are you/i,
      responses: [
        "I'm doing well, thank you for asking! How can I help you?",
        "I'm great! How about you?",
        "All systems operational! How can I assist you today?"
      ]
    },
    {
      pattern: /bye|goodbye/i,
      responses: [
        "Goodbye! Have a great day!",
        "See you later! Take care!",
        "Bye! Come back if you need anything else!"
      ]
    },
    {
      pattern: /help|support/i,
      responses: [
        "I can help you with various tasks. Just ask me anything!",
        "I'm here to assist you. What do you need help with?",
        "How can I support you today?"
      ]
    },
    {
      pattern: /thank|thanks/i,
      responses: [
        "You're welcome!",
        "Glad I could help!",
        "Anytime! Let me know if you need anything else!"
      ]
    },
    {
      pattern: /what can you do|capabilities|features/i,
      responses: [
        "I can help you with various tasks like answering questions, providing information, and assisting with basic queries. What would you like to know?",
        "I'm capable of answering questions, providing support, and helping with general inquiries. How can I assist you?",
        "I can assist you with information, answer questions, and provide support. What would you like help with?"
      ]
    },
    {
      pattern: /name|who are you/i,
      responses: [
        "I'm your AI Assistant, here to help and support you!",
        "You can call me AI Assistant. I'm here to assist you!",
        "I'm an AI Assistant, ready to help you with whatever you need!"
      ]
    },
    {
      pattern: /time|date/i,
      responses: [
        `The current time is ${new Date().toLocaleTimeString()}`,
        `Today's date is ${new Date().toLocaleDateString()}`,
        `It's ${new Date().toLocaleString()}`
      ]
    },
    {
      pattern: /weather/i,
      responses: [
        "I'm sorry, I don't have access to real-time weather data. You might want to check a weather service for that information.",
        "I can't provide weather information directly. Please check a weather service for current conditions.",
        "For weather information, I recommend checking a dedicated weather service or app."
      ]
    },
    {
      pattern: /joke|funny/i,
      responses: [
        "Why don't programmers like nature? It has too many bugs!",
        "What do you call a bear with no teeth? A gummy bear!",
        "Why did the scarecrow win an award? Because he was outstanding in his field!"
      ]
    }
  ];

  // Default response if no pattern matches
  const defaultResponses = [
    "I'm not sure I understand. Could you rephrase that?",
    "I didn't catch that. Can you try asking in a different way?",
    "I'm still learning. Could you try asking something else?",
    "I'm not sure how to respond to that. Could you try a different question?"
  ];

  const getBotResponse = (message: string): string => {
    // Check each pattern
    for (const { pattern, responses } of botPatterns) {
      if (pattern.test(message)) {
        // Return a random response from the matching pattern
        return responses[Math.floor(Math.random() * responses.length)];
      }
    }
    
    // If no pattern matches, return a random default response
    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
  };

  const handleSend = async () => {
    if (!inputMessage.trim() || !user) return;

    const userMessage: BotMessage = {
      id: Date.now().toString(),
      text: inputMessage.trim(),
      senderId: user.uid,
      timestamp: new Date(),
      isBot: false
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Simulate bot typing delay
    setTimeout(() => {
      const botResponse: BotMessage = {
        id: (Date.now() + 1).toString(),
        text: getBotResponse(inputMessage.trim()),
        senderId: 'bot',
        timestamp: new Date(),
        isBot: true
      };

      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000); // Random delay between 1-2 seconds
  };

  const renderMessage = ({ item }: { item: BotMessage }) => {
    const isMyMessage = !item.isBot;

    return (
      <View style={[styles.messageContainer, isMyMessage ? styles.myMessage : styles.botMessage]}>
        <Text style={[styles.messageText, isMyMessage ? styles.myMessageText : styles.botMessageText]}>
          {item.text}
        </Text>
        <Text style={[styles.timestamp, isMyMessage ? styles.myTimestamp : styles.botTimestamp]}>
          {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => {
          if (flatListRef.current) {
            flatListRef.current.scrollToEnd();
          }
        }}
      />
      {isTyping && (
        <View style={styles.typingContainer}>
          <Text style={styles.typingText}>AI Assistant is typing...</Text>
          <ActivityIndicator size="small" color="#007AFF" style={styles.typingIndicator} />
        </View>
      )}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={inputMessage}
          onChangeText={setInputMessage}
          placeholder="Type a message..."
          multiline
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  messagesList: {
    padding: 10,
  },
  messageContainer: {
    maxWidth: '80%',
    marginVertical: 5,
    padding: 10,
    borderRadius: 10,
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF',
  },
  botMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#E5E5EA',
  },
  messageText: {
    fontSize: 16,
  },
  myMessageText: {
    color: '#fff',
  },
  botMessageText: {
    color: '#000',
  },
  timestamp: {
    fontSize: 12,
    marginTop: 5,
  },
  myTimestamp: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  botTimestamp: {
    color: 'rgba(0, 0, 0, 0.5)',
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  typingText: {
    fontSize: 14,
    color: '#666',
    marginRight: 10,
  },
  typingIndicator: {
    marginLeft: 5,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default AIAssistantScreen; 
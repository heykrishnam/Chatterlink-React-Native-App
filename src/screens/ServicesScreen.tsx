import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, TextInput, Button, List, Divider } from 'react-native-paper';
import type { DrawerScreenProps } from '@react-navigation/drawer';

type RootDrawerParamList = {
  Services: undefined;
};

type Props = DrawerScreenProps<RootDrawerParamList, 'Services'>;

// Simple rule-based chatbot responses
const botRules = {
  password: 'Make sure to use strong passwords with at least 12 characters, including numbers, symbols, and mixed case letters.',
  phishing: 'Be cautious of unexpected emails. Never click on suspicious links or download attachments from unknown sources.',
  security: 'Enable two-factor authentication whenever possible and keep your software up to date.',
  privacy: 'Regularly review your privacy settings on social media and be careful about sharing personal information online.',
  default: 'I can help you with password security, phishing prevention, general security tips, and privacy concerns. What would you like to know about?'
};

export default function ServicesScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [breachResults, setBreachResults] = useState<string[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ text: string; isBot: boolean }>>([
    { text: botRules.default, isBot: true }
  ]);
  const [loading, setLoading] = useState(false);

  const handleBreachCheck = async () => {
    if (!email) return;

    setLoading(true);
    try {
      const response = await fetch('https://breachdirectory.p.rapidapi.com/', {
        method: 'GET',
        headers: {
          'X-RapidAPI-Host': 'breachdirectory.p.rapidapi.com',
          'X-RapidAPI-Key': 'YOUR_RAPID_API_KEY'
        },
        params: { func: 'auto', term: email }
      });

      const data = await response.json();
      if (data.success) {
        setBreachResults(data.result.map((breach: any) => 
          `${breach.name}: ${breach.date}`
        ));
      } else {
        setBreachResults(['No breaches found']);
      }
    } catch (error) {
      console.error('Error checking breaches:', error);
      setBreachResults(['Error checking breaches']);
    } finally {
      setLoading(false);
    }
  };

  const handleChatSubmit = () => {
    if (!chatInput.trim()) return;

    const userMessage = chatInput.trim().toLowerCase();
    setChatMessages(prev => [...prev, { text: chatInput, isBot: false }]);
    setChatInput('');

    // Simple rule-based response
    let botResponse = botRules.default;
    Object.entries(botRules).forEach(([key, response]) => {
      if (userMessage.includes(key)) {
        botResponse = response;
      }
    });

    setTimeout(() => {
      setChatMessages(prev => [...prev, { text: botResponse, isBot: true }]);
    }, 500);
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Title title="AI Cybersecurity Bot" />
        <Card.Content>
          <View style={styles.chatContainer}>
            {chatMessages.map((message, index) => (
              <View
                key={index}
                style={[
                  styles.message,
                  message.isBot ? styles.botMessage : styles.userMessage
                ]}
              >
                <Text>{message.text}</Text>
              </View>
            ))}
          </View>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={chatInput}
              onChangeText={setChatInput}
              placeholder="Ask about security..."
            />
            <Button onPress={handleChatSubmit}>Send</Button>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Title title="Breach Directory" />
        <Card.Content>
          <TextInput
            label="Email Address"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            style={styles.input}
          />
          <Button
            mode="contained"
            onPress={handleBreachCheck}
            loading={loading}
            style={styles.button}
          >
            Check Breaches
          </Button>
          {breachResults.map((result, index) => (
            <List.Item
              key={index}
              title={result}
              left={props => <List.Icon {...props} icon="alert" />}
            />
          ))}
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginBottom: 16,
  },
  chatContainer: {
    marginBottom: 16,
  },
  message: {
    padding: 8,
    marginVertical: 4,
    maxWidth: '80%',
    borderRadius: 8,
  },
  botMessage: {
    backgroundColor: '#E3F2FD',
    alignSelf: 'flex-start',
  },
  userMessage: {
    backgroundColor: '#E8F5E9',
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
}); 
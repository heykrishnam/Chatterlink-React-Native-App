import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ServicesStackParamList } from '../../types/navigation';

type ServicesScreenNavigationProp = NativeStackNavigationProp<ServicesStackParamList, 'ServicesList'>;

const ServicesScreen: React.FC = () => {
  const navigation = useNavigation<ServicesScreenNavigationProp>();

  const handleAIBotPress = () => {
    navigation.navigate('AIAssistant');
  };

  const handleBreachDirectoryPress = () => {
    navigation.navigate('BreachDirectory');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Services</Text>
      </View>

      <View style={styles.servicesContainer}>
        <TouchableOpacity
          style={styles.serviceCard}
          onPress={handleAIBotPress}
        >
          <View style={styles.serviceIcon}>
            <Text style={styles.serviceIconText}>AI</Text>
          </View>
          <View style={styles.serviceInfo}>
            <Text style={styles.serviceTitle}>AI Assistant</Text>
            <Text style={styles.serviceDescription}>
              Chat with our AI assistant for help and information
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.serviceCard}
          onPress={handleBreachDirectoryPress}
        >
          <View style={styles.serviceIcon}>
            <Text style={styles.serviceIconText}>BD</Text>
          </View>
          <View style={styles.serviceInfo}>
            <Text style={styles.serviceTitle}>Breach Directory</Text>
            <Text style={styles.serviceDescription}>
              Access and manage breach directory information
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  servicesContainer: {
    padding: 15,
  },
  serviceCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  serviceIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  serviceIconText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  serviceInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  serviceTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: 14,
    color: '#666',
  },
});

export default ServicesScreen; 
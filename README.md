# WeVitChat - React Native Chat App

A secure messaging app built with React Native, Expo, and Firebase.

## Features

- User Authentication (Email/Username + Password)
- Direct Messaging
- Group Chats
- Message Auto-Delete Timer
- Online/Offline Status
- AI Cybersecurity Bot
- Breach Directory Check
- Profile Management

## Tech Stack

- React Native with Expo
- Firebase (Authentication + Firestore)
- React Navigation (Drawer + Stack)
- React Native Paper (UI Components)
- TypeScript

## Prerequisites

- Node.js (v14 or later)
- npm or yarn
- Expo CLI
- Firebase Account
- RapidAPI Account (for Breach Directory)

## Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd wevitchat
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Create a Firebase project and enable:
   - Authentication (Email/Password)
   - Firestore Database

4. Create a `.env` file in the root directory:
```
FIREBASE_API_KEY=your_api_key
FIREBASE_AUTH_DOMAIN=your_auth_domain
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_storage_bucket
FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
FIREBASE_APP_ID=your_app_id
RAPID_API_KEY=your_rapid_api_key
```

5. Update Firebase configuration in `src/config/firebase.ts`

6. Start the development server:
```bash
npm start
# or
yarn start
```

## Firebase Security Rules

Add these rules to your Firestore:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /messages/{messageId} {
      allow read, write: if request.auth != null;
    }
    
    match /groups/{groupId} {
      allow read: if request.auth != null && request.auth.uid in resource.data.members;
      allow write: if request.auth != null;
    }
  }
}
```

## Features Overview

### Authentication
- Login with email or username
- Signup with email, username, and password
- Password reset functionality

### Messaging
- Direct messages between users
- Group chat creation and management
- Message auto-delete timer options
- Real-time message updates
- Online/offline status tracking

### Security Features
- AI-powered security chatbot
- Email breach checking via BreachDirectory API
- Secure authentication flow
- Protected routes and data access

### Profile Management
- Update username
- Change password
- View account details
- Manage notification settings

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Firebase for backend services
- Expo for React Native development
- React Navigation for routing
- React Native Paper for UI components
- RapidAPI for breach checking service #   C h a t t e r l i n k - R e a c t - N a t i v e - A p p  
 
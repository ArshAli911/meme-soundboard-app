# Meme Sound Share Application

This is a full-stack mobile application (React Native frontend, Node.js/Express backend) that allows users to discover, preview, download, and share bite-sized "meme" audio clips. It supports offline playback and features an administrative interface for managing the sound library.

## Project Structure

```
meme-sound application/
├── meme-soundboard-app/  # React Native Frontend (Expo)
│   ├── android/          # Native Android files
│   ├── ios/              # Native iOS files
│   ├── assets/
│   │   └── sounds/       # Optional local default sounds
│   ├── src/
│   │   ├── api/          # Network layer (API calls to backend)
│   │   │   └── soundApi.ts
│   │   ├── models/       # Data models (TypeScript interfaces)
│   │   │   └── Sound.ts
│   │   ├── data/         # Repository layer
│   │   │   ├── local/
│   │   │   │   └── soundStorage.ts
│   │   │   ├── remote/
│   │   │   │   └── soundRemoteSource.ts
│   │   │   └── repository/
│   │   │       └── soundRepository.ts
│   │   ├── viewmodels/   # ViewModels (Business Logic)
│   │   │   └── soundViewModel.ts
│   │   ├── screens/
│   │   │   ├── HomeScreen/
│   │   │   ├── FavoritesScreen/
│   │   │   ├── PlayerScreen/
│   │   │   └── UploadScreen/
│   │   ├── components/
│   │   ├── navigation/
│   │   ├── utils/
│   │   ├── constants/
│   │   ├── context/
│   │   ├── store/
│   │   └── hooks/
│   ├── App.tsx
│   ├── app.json
│   ├── package.json
│   ├── tsconfig.json
│   └── yarn.lock
├── meme-sound-backend/   # Node.js/Express Backend
│   ├── models/
│   │   └── Sound.js      # Mongoose schema for sound metadata
│   ├── .env              # Environment variables (AWS keys, MongoDB URI)
│   ├── index.js          # Main Express server, S3 & MongoDB integration
│   └── package.json
└── README.md
```

## Features

### Frontend (React Native)
- **Browse & Preview Sounds:** Displays a list of sounds; tap to preview playback.
- **Navigation:** Seamless navigation between Home, Favorites, Player, and Upload screens.
- **State Management:** Uses Zustand for efficient and centralized data handling.
- **Audio Playback:** Integrates `expo-av` for sound playback.
- **Firebase Integration:** Connected to Firebase for potential future services like Authentication and Push Notifications.

### Backend (Node.js/Express + AWS S3 + MongoDB)
- **Sound Storage:** Stores audio files efficiently on AWS S3.
- **Metadata Management:** Stores sound metadata (title, tags, category, URL) in MongoDB.
- **Sound Upload API:** Endpoint for uploading audio files and their metadata.
- **Sound Listing/Search API:** Endpoint to retrieve and filter sounds.
- **Signed URL Generation:** Can generate secure, temporary URLs for private S3 files.

## Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or Yarn
- Expo CLI (`npm install -g expo-cli`)
- AWS Account and S3 Bucket setup
- MongoDB Atlas account (or local MongoDB instance) for database
- Firebase Project setup with Firestore, Storage, and Cloud Functions enabled.

### 1. Backend Setup

1.  **Navigate to the backend directory:**
    ```sh
    cd meme-sound-backend
    ```

2.  **Install backend dependencies:**
    ```sh
    npm install
    ```

3.  **Create a `.env` file:**
    In the `meme-sound-backend` directory, create a file named `.env` and populate it with your credentials:
    ```
    AWS_ACCESS_KEY_ID=YOUR_AWS_ACCESS_KEY_ID
    AWS_SECRET_ACCESS_KEY=YOUR_AWS_SECRET_ACCESS_KEY
    AWS_REGION=YOUR_AWS_REGION
    S3_BUCKET=YOUR_S3_BUCKET_NAME
    MONGO_URI=YOUR_MONGODB_CONNECTION_STRING
    PORT=5000
    ```
    *Replace placeholders with your actual values.*

4.  **Start the backend server:**
    ```sh
    npm start
    ```
    The server will typically run on `http://localhost:5000` (or the PORT you specify).

### 2. Frontend Setup

1.  **Navigate to the frontend directory:**
    ```sh
    cd meme-soundboard-app
    ```

2.  **Install frontend dependencies:**
    ```sh
    yarn install # or npm install
    ```

3.  **Configure Firebase:**
    Open `meme-soundboard-app/src/config/firebaseConfig.ts` and replace the placeholder values with your Firebase project's web app configuration:
    ```typescript
    const firebaseConfig = {
      apiKey: "YOUR_API_KEY",
      authDomain: "YOUR_AUTH_DOMAIN",
      projectId: "YOUR_PROJECT_ID",
      storageBucket: "YOUR_STORAGE_BUCKET",
      messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
      appId: "YOUR_APP_ID",
      measurementId: "YOUR_MEASUREMENT_ID", // Optional
    };

    export default firebaseConfig;
    ```

4.  **Update API Base URL (if backend is not local):**
    If your backend is deployed, update `API_BASE_URL` in `meme-soundboard-app/src/constants/config.ts` to point to your deployed backend URL.

5.  **Start the Expo development server:**
    ```sh
    expo start
    ```
    This will open a new tab in your browser with the Expo Dev Tools. You can scan the QR code with your phone (using the Expo Go app) or run it on an Android/iOS emulator.

## Development

- **Frontend:** React Native, Expo, TypeScript, Zustand, React Navigation, expo-av.
- **Backend:** Node.js, Express, AWS SDK, Multer, Mongoose, MongoDB.

## Future Enhancements
- User authentication (e.g., Firebase Auth or JWT integration).
- Admin dashboard for sound curation.
- Offline playback and caching using `expo-file-system` and local storage.
- Advanced search with dedicated search engines.
- Push notifications for new content.

Enjoy building your Meme Sound Share App! 
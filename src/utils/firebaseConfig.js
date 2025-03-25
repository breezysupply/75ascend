// Check if we're in a development environment
const isDevelopment = import.meta.env.DEV || process.env.NODE_ENV === 'development';

// Create mock implementations for development
const createDefaultData = () => ({
  currentDay: 1,
  startDate: new Date().toISOString(),
  history: [],
  dailyLogs: []
});

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAUx_UgOzsZRttMjAXwNYMv65_-35lCwLk",
  authDomain: "ascend-bd295.firebaseapp.com",
  projectId: "ascend-bd295",
  storageBucket: "ascend-bd295.firebasestorage.app",
  messagingSenderId: "764804246454",
  appId: "1:764804246454:web:b683e9863247c89d772f17",
  measurementId: "G-S6HFJSWCG3"
};

// Firebase instances
let app;
let auth;
let db;
let googleAuthProvider;

// Initialize Firebase
export async function initializeApp() {
  if (typeof window === 'undefined') return; // Skip on server-side

  try {
    const { initializeApp } = await import('firebase/app');
    const { getAuth, GoogleAuthProvider } = await import('firebase/auth');
    const { getFirestore } = await import('firebase/firestore');

    // Only initialize if not already initialized
    if (!app) {
      app = initializeApp(firebaseConfig);
      auth = getAuth(app);
      db = getFirestore(app);
      googleAuthProvider = new GoogleAuthProvider();
    }

    return { app, auth, db };
  } catch (error) {
    console.error('Error initializing Firebase:', error);
    throw error;
  }
}

// Authentication and data service
export const dataService = {
  getCurrentUser: () => {
    if (typeof window === 'undefined') return null;
    return auth?.currentUser || null;
  },

  signIn: async () => {
    const { signInWithPopup } = await import('firebase/auth');
    if (!auth || !googleAuthProvider) await initializeApp();
    return signInWithPopup(auth, googleAuthProvider);
  },

  signOut: async () => {
    const { signOut } = await import('firebase/auth');
    if (!auth) await initializeApp();
    return signOut(auth);
  },

  getUserData: async () => {
    if (!auth?.currentUser) return null;
    
    try {
      const { doc, getDoc } = await import('firebase/firestore');
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      
      if (userDoc.exists()) {
        return userDoc.data();
      }
      
      // Return default data for new users
      return {
        currentDay: 1,
        startDate: new Date().toISOString(),
        history: [],
        dailyLogs: []
      };
    } catch (error) {
      console.error('Error getting user data:', error);
      throw error;
    }
  },
  
  saveUserData: async (data) => {
    try {
      // In development, save to localStorage
      if (isDevelopment) {
        console.log('Development mode: Saving user data to localStorage');
        localStorage.setItem('75ascend-data', JSON.stringify(data));
        return true;
      }
      
      await initializeApp();
      
      // Get the current user
      const user = await dataService.getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      // Save the data to Firestore
      const { setDoc, doc } = await import('firebase/firestore');
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, { userData: data }, { merge: true });
      
      console.log('User data saved successfully');
      return true;
    } catch (error) {
      console.error('Error saving user data:', error);
      throw error;
    }
  },
  
  signUp: async () => {
    // With Google Auth, sign up is the same as sign in
    return dataService.signIn();
  }
}; 
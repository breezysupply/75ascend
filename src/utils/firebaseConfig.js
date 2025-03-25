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
let firebaseApp;
let firebaseAuth;
let firebaseDb;
let googleAuthProvider;
let isFirebaseInitialized = false;

// Initialize Firebase
export async function initializeApp() {
  // Skip Firebase configuration in development mode
  if (isDevelopment) {
    console.log('Development mode: Skipping Firebase configuration');
    return;
  }
  
  // If already initialized, don't do it again
  if (isFirebaseInitialized) {
    return;
  }
  
  try {
    console.log('Initializing Firebase...');
    
    // Import Firebase modules
    const { initializeApp } = await import('firebase/app');
    const { getAuth, GoogleAuthProvider, signInWithPopup, signOut: firebaseSignOut } = await import('firebase/auth');
    const { getFirestore, doc, getDoc, setDoc } = await import('firebase/firestore');
    
    // Initialize Firebase
    firebaseApp = initializeApp(firebaseConfig);
    firebaseAuth = getAuth(firebaseApp);
    firebaseDb = getFirestore(firebaseApp);
    googleAuthProvider = new GoogleAuthProvider();
    
    console.log('Firebase initialized successfully');
    isFirebaseInitialized = true;
  } catch (error) {
    console.error('Error initializing Firebase:', error);
    throw error;
  }
}

// Helper function to ensure Firebase is initialized
const ensureFirebaseInitialized = async () => {
  if (isDevelopment) return;
  
  if (!isFirebaseInitialized) {
    await initializeApp();
  }
  
  if (!isFirebaseInitialized) {
    throw new Error('Firebase not initialized properly');
  }
};

// Authentication and data service
export const dataService = {
  getUserData: async () => {
    try {
      // In development, return simulated data
      if (isDevelopment) {
        console.log('Development mode: Returning simulated user data');
        const savedData = localStorage.getItem('75ascend-data');
        if (savedData) {
          return JSON.parse(savedData);
        }
        
        // Return default data structure for a new user
        return createDefaultData();
      }
      
      // If we can't initialize Firebase, return default data
      try {
        await ensureFirebaseInitialized();
      } catch (error) {
        console.error('Failed to initialize Firebase:', error);
        return createDefaultData();
      }
      
      try {
        // First check if the user is authenticated
        const user = await dataService.getCurrentUser();
        if (!user) {
          throw new Error('User not authenticated');
        }
        
        // Get the user's data from Firestore
        const { getDoc, doc } = await import('firebase/firestore');
        const userDocRef = doc(firebaseDb, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          return userDoc.data().userData;
        } else {
          // User exists but has no data yet, return default structure
          return createDefaultData();
        }
      } catch (error) {
        console.error('Error getting user data:', error);
        
        // If there's an authentication error, redirect to login
        if (error.message.includes('not authenticated')) {
          // Redirect to login page
          window.location.href = '/login';
          return null;
        }
        
        // For other errors, return default data
        return createDefaultData();
      }
    } catch (error) {
      console.error('Error in getUserData:', error);
      return createDefaultData();
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
      
      await ensureFirebaseInitialized();
      
      // Get the current user
      const user = await dataService.getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      // Save the data to Firestore
      const { setDoc, doc } = await import('firebase/firestore');
      const userDocRef = doc(firebaseDb, 'users', user.uid);
      await setDoc(userDocRef, { userData: data }, { merge: true });
      
      console.log('User data saved successfully');
      return true;
    } catch (error) {
      console.error('Error saving user data:', error);
      throw error;
    }
  },
  
  signIn: async () => {
    try {
      // In development, simulate a successful sign-in
      if (isDevelopment) {
        console.log('Development mode: Simulating sign-in');
        localStorage.setItem('75ascend-auth', JSON.stringify({ email: 'dev@example.com' }));
        return { email: 'dev@example.com' };
      }
      
      await ensureFirebaseInitialized();
      
      console.log('Attempting to sign in with Google');
      
      // Sign in with Google popup
      const { signInWithPopup } = await import('firebase/auth');
      const result = await signInWithPopup(firebaseAuth, googleAuthProvider);
      
      console.log('Sign in successful');
      return result.user;
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  },
  
  signUp: async () => {
    // With Google Auth, sign up is the same as sign in
    return dataService.signIn();
  },
  
  signOut: async () => {
    try {
      // In development, clear localStorage auth
      if (isDevelopment) {
        console.log('Development mode: Simulating sign out');
        localStorage.removeItem('75ascend-auth');
        return true;
      }
      
      await ensureFirebaseInitialized();
      
      // Sign out from Firebase
      const { signOut } = await import('firebase/auth');
      await signOut(firebaseAuth);
      
      console.log('User signed out successfully');
      return true;
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  },
  
  getCurrentUser: async () => {
    try {
      // In development, return a mock user
      if (isDevelopment) {
        console.log('Development mode: Returning mock user');
        const savedAuth = localStorage.getItem('75ascend-auth');
        if (savedAuth) {
          const parsedAuth = JSON.parse(savedAuth);
          return { uid: 'dev-user-123', email: parsedAuth.email };
        }
        return null;
      }
      
      await ensureFirebaseInitialized();
      
      // Get the current user from Firebase
      return firebaseAuth.currentUser;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }
}; 
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
  authDomain: "ascend-bd295.web.app",
  projectId: "ascend-bd295",
  storageBucket: "ascend-bd295.firebasestorage.app",
  messagingSenderId: "764804246454",
  appId: "1:764804246454:web:b683e9863247c89d772f17",
  measurementId: "G-S6HFJSWCG3"
};

let app;
let auth;
let db;
let googleAuthProvider;

// Add a delay utility
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Add debug logging utility
const logDebug = (message, data = null) => {
  console.log(`[Firebase Debug] ${message}`, data || '');
};

// Add error logging utility
const logError = (message, error) => {
  console.error(`[Firebase Error] ${message}:`, error);
  console.error('Stack trace:', error.stack);
};

// Initialize Firebase
export async function initializeFirebase() {
  if (typeof window === 'undefined') {
    logDebug('Skipping Firebase init - server side');
    return null;
  }
  
  try {
    logDebug('Starting Firebase initialization');
    const { initializeApp, getApps } = await import('firebase/app');
    const { getAuth } = await import('firebase/auth');
    const { getFirestore } = await import('firebase/firestore');
    
    if (!getApps().length) {
      logDebug('No existing Firebase apps, initializing new app');
      app = initializeApp(firebaseConfig);
    } else {
      logDebug('Using existing Firebase app');
      app = getApps()[0];
    }
    
    if (!auth) {
      logDebug('Initializing auth');
      auth = getAuth(app);
    }
    if (!db) {
      logDebug('Initializing Firestore');
      db = getFirestore(app);
    }
    
    logDebug('Firebase initialization complete', { 
      hasAuth: !!auth, 
      hasDb: !!db,
      currentUser: auth?.currentUser?.uid 
    });
    
    return { app, auth, db };
  } catch (error) {
    logError('Firebase initialization failed', error);
    throw error;
  }
}

// Update waitForAuthInit to handle the auth state more reliably
export function waitForAuthInit() {
  return new Promise((resolve) => {
    if (!auth) {
      initializeFirebase().then(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
          unsubscribe();
          resolve(user);
        });
      });
    } else {
      const unsubscribe = auth.onAuthStateChanged((user) => {
        unsubscribe();
        resolve(user);
      });
    }
  });
}

// Update handleAuthState to be more robust
export async function handleAuthState(isLoginPage = false) {
  if (typeof window === 'undefined') return;

  try {
    logDebug('Starting auth state check', { isLoginPage });
    await initializeFirebase();
    const { getAuth } = await import('firebase/auth');
    const auth = getAuth();
    
    const currentPath = window.location.pathname;
    logDebug('Current path', currentPath);
    
    return new Promise((resolve) => {
      let handled = false;
      
      const unsubscribe = auth.onAuthStateChanged((user) => {
        logDebug('Auth state changed', { 
          hasUser: !!user, 
          userId: user?.uid,
          handled 
        });
        
        if (handled) return;
        handled = true;
        unsubscribe();

        if (user && isLoginPage) {
          logDebug('Authenticated user on login page, redirecting to home');
          window.location.replace('/');
        } else if (!user && !isLoginPage) {
          logDebug('Unauthenticated user on protected page, redirecting to login');
          window.location.replace('/login');
        }
        resolve(user);
      });

      // Add timeout
      setTimeout(() => {
        if (!handled) {
          logDebug('Auth state check timed out');
          handled = true;
          unsubscribe();
          resolve(null);
        }
      }, 5000);
    });
  } catch (error) {
    logError('Auth state handling failed', error);
    return null;
  }
}

// Authentication and data service
export const dataService = {
  getCurrentUser: async () => {
    await initializeFirebase();
    const { getAuth } = await import('firebase/auth');
    const auth = getAuth();
    return auth.currentUser;
  },

  signIn: async () => {
    try {
      logDebug('Starting sign in process');
      await initializeFirebase();
      const { GoogleAuthProvider, signInWithRedirect, getAuth } = await import('firebase/auth');
      auth = getAuth();
      
      // Always create a new provider instance
      googleAuthProvider = new GoogleAuthProvider();
      
      // Configure auth persistence
      const { browserLocalPersistence, setPersistence } = await import('firebase/auth');
      await setPersistence(auth, browserLocalPersistence);
      
      // Simplified OAuth parameters
      googleAuthProvider.setCustomParameters({
        prompt: 'select_account'
      });
      
      logDebug('Starting redirect sign-in');
      await signInWithRedirect(auth, googleAuthProvider);
    } catch (error) {
      logError('Sign in failed', error);
      throw error;
    }
  },

  signOut: async () => {
    try {
      logDebug('Starting sign out process');
      await initializeFirebase();
      const { getAuth } = await import('firebase/auth');
      auth = getAuth();
      await auth.signOut();
      
      logDebug('Clearing Firebase instances');
      app = null;
      auth = null;
      db = null;
      googleAuthProvider = null;
      
      logDebug('Redirecting to login page');
      window.location.replace('/login');
      return true;
    } catch (error) {
      logError('Sign out failed', error);
      throw error;
    }
  },

  getUserData: async () => {
    try {
      await initializeFirebase();
      if (!auth?.currentUser) return null;
      
      const { doc, getDoc } = await import('firebase/firestore');
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      
      if (userDoc.exists()) {
        return userDoc.data().userData;
      }
      
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
      
      await initializeFirebase();
      
      // Get the current user
      const user = await dataService.getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      // Save the data to Firestore
      const { doc, setDoc } = await import('firebase/firestore');
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
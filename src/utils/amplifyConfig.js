// Check if we're in a development environment
const isDevelopment = import.meta.env.DEV || process.env.NODE_ENV === 'development';

// Create mock implementations for development
const createDefaultData = () => ({
  currentDay: 1,
  startDate: new Date().toISOString(),
  history: [],
  dailyLogs: []
});

// Variables for AWS services
let Amplify;
let fetchAuthSession, signIn, signUp, confirmSignUp, signOut;
let DynamoDBClient, DynamoDBDocumentClient, GetCommand, PutCommand;
let dynamoClient, docClient;

// Flag to track if Amplify has been initialized
let isAmplifyInitialized = false;

// Update these values with your actual Cognito settings
const COGNITO_DOMAIN = 'https://75-ascend-user.auth.us-east-1.amazoncognito.com';
const CLIENT_ID = 'npcbekfimfiri9g1kfsinhmo5'; // Your actual client ID
const REDIRECT_URI = 'https://main.d1oas7a4pwxwes.amplifyapp.com'; // Your app's URL

// Update the initializeApp function to separate auth from DynamoDB
export async function initializeApp() {
  // Skip Amplify configuration in development mode
  if (isDevelopment) {
    console.log('Development mode: Skipping AWS Amplify configuration');
    return;
  }
  
  // If already initialized, don't do it again
  if (isAmplifyInitialized) {
    return;
  }
  
  try {
    console.log('Initializing AWS Amplify...');
    
    // Import Amplify modules statically
    try {
      // Use a more reliable import approach
      const { Amplify: AmplifyModule } = await import('aws-amplify');
      Amplify = AmplifyModule;
      
      const authModule = await import('aws-amplify/auth');
      fetchAuthSession = authModule.fetchAuthSession;
      signIn = authModule.signIn;
      signUp = authModule.signUp;
      confirmSignUp = authModule.confirmSignUp;
      signOut = authModule.signOut;
      
      // Import DynamoDB modules
      const { DynamoDBClient: DDBClient } = await import('@aws-sdk/client-dynamodb');
      DynamoDBClient = DDBClient;
      
      const { 
        DynamoDBDocumentClient: DDBDocClient,
        GetCommand: GetCmd,
        PutCommand: PutCmd
      } = await import('@aws-sdk/lib-dynamodb');
      
      DynamoDBDocumentClient = DDBDocClient;
      GetCommand = GetCmd;
      PutCommand = PutCmd;
      
      // Configure Amplify with your Cognito User Pool and Identity Pool
      Amplify.configure({
        Auth: {
          Cognito: {
            userPoolId: 'us-east-1_ylst7UO8Z',
            userPoolClientId: 'npcbekfimfiri9g1kfsinhmo5',
            identityPoolId: 'us-east-1:73439648-aa6e-4041-8d98-8faf35d7219e',
            region: 'us-east-1',
            loginWith: {
              email: true
            }
          }
        }
      });
      
      console.log('AWS Amplify initialized with Cognito User Pool');
      isAmplifyInitialized = true;
    } catch (importError) {
      console.error('Failed to import AWS modules:', importError);
      throw importError;
    }
  } catch (error) {
    console.error('Error initializing AWS Amplify:', error);
    console.error('Error details:', error);
    throw error;
  }
}

// Add a new function to initialize DynamoDB after authentication
async function initializeDynamoDB() {
  if (isDevelopment) return;
  
  if (dynamoClient) return; // Already initialized
  
  try {
    const session = await fetchAuthSession();
    
    if (!session.credentials) {
      console.error('No credentials available in the session');
      throw new Error('No credentials available');
    }
    
    dynamoClient = new DynamoDBClient({ 
      region: "us-east-1",
      credentials: session.credentials
    });
    
    docClient = DynamoDBDocumentClient.from(dynamoClient);
    console.log('DynamoDB client initialized successfully');
    return true;
  } catch (credError) {
    console.error('Error getting credentials for DynamoDB:', credError);
    throw credError;
  }
}

const TABLE_NAME = "75ascend-user-data"; // Your DynamoDB table name

// Helper function to ensure Amplify is initialized
const ensureAmplifyInitialized = async () => {
  if (isDevelopment) return;
  
  if (!isAmplifyInitialized) {
    await initializeApp();
  }
  
  if (!isAmplifyInitialized) {
    throw new Error('AWS Amplify not initialized properly');
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
      
      // If we can't initialize Amplify, return default data
      try {
        await ensureAmplifyInitialized();
      } catch (error) {
        console.error('Failed to initialize Amplify:', error);
        return createDefaultData();
      }
      
      try {
        // First check if the user is authenticated
        const user = await dataService.getCurrentUser();
        if (!user) {
          throw new Error('User not authenticated');
        }
        
        // Initialize DynamoDB on demand
        await initializeDynamoDB();
        
        // Get the user's data from DynamoDB
        const userId = user.sub;
        const command = new GetCommand({
          TableName: TABLE_NAME,
          Key: { userId }
        });
        
        const response = await docClient.send(command);
        
        if (response.Item) {
          return response.Item.data;
        } else {
          // User exists but has no data yet, return default structure
          return createDefaultData();
        }
      } catch (error) {
        console.error('Error getting user data:', error);
        
        // If there's a credential error, redirect to login
        if (error.message.includes('Credential is missing') || 
            error.message.includes('not initialized properly')) {
          // Clear any auth tokens that might be invalid
          try {
            await dataService.signOut();
          } catch (signOutError) {
            console.error('Error during sign out:', signOutError);
          }
          
          // Redirect to login page
          window.location.href = '/login';
          return null;
        }
        
        // For other errors, return a default structure
        return createDefaultData();
      }
    } catch (error) {
      console.error('Error getting user data:', error);
      return createDefaultData(); // Return default data instead of throwing
    }
  },
  
  saveUserData: async (data) => {
    try {
      // In development, just use localStorage
      if (isDevelopment) {
        console.log('Development mode: Using localStorage instead of DynamoDB');
        localStorage.setItem('75ascend-data', JSON.stringify(data));
        return data;
      }
      
      await ensureAmplifyInitialized();
      
      // Get the current user
      const user = await dataService.getCurrentUser();
      const userId = user?.sub;
      
      if (!userId) {
        throw new Error('No authenticated user');
      }
      
      // Save to DynamoDB
      const command = new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          userId: userId,
          data: data,
          updatedAt: new Date().toISOString()
        }
      });
      
      await docClient.send(command);
      
      // Also save to localStorage as backup/for development
      localStorage.setItem('75ascend-data', JSON.stringify(data));
      
      return data;
    } catch (error) {
      console.error('Error saving user data:', error);
      
      // Fallback to localStorage for development/testing
      localStorage.setItem('75ascend-data', JSON.stringify(data));
      
      return data;
    }
  },
  
  signIn: async (username, password) => {
    try {
      // In development, simulate a successful sign-in
      if (isDevelopment) {
        console.log('Development mode: Simulating sign-in');
        localStorage.setItem('75ascend-auth', JSON.stringify({ username }));
        return { username };
      }
      
      await ensureAmplifyInitialized();
      
      console.log('Attempting to sign in user:', username);
      
      // Fix client ID mismatch - ensure we're using the correct one
      if (Amplify.getConfig().Auth?.Cognito?.userPoolClientId !== 'npcbekfimfiri9g1kfsinhmo5') {
        console.warn('Client ID mismatch detected, reconfiguring Amplify');
        Amplify.configure({
          Auth: {
            Cognito: {
              userPoolId: 'us-east-1_ylst7UO8Z',
              userPoolClientId: 'npcbekfimfiri9g1kfsinhmo5',
              identityPoolId: 'us-east-1:73439648-aa6e-4041-8d98-8faf35d7219e',
              region: 'us-east-1',
              loginWith: {
                email: true
              }
            }
          }
        });
      }
      
      // Sign in the user
      const result = await signIn({ username, password });
      console.log('Sign in successful, getting session...');
      
      // Wait a moment to ensure credentials are propagated
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Explicitly fetch the session to ensure credentials are available
      const session = await fetchAuthSession({ forceRefresh: true });
      console.log('Session obtained:', session ? 'Yes' : 'No');
      
      if (!session || !session.tokens) {
        console.error('No session or tokens after sign in');
        throw new Error('Authentication failed - no session available');
      }
      
      console.log('User authenticated successfully');
      
      // Initialize DynamoDB with the new credentials
      try {
        await initializeDynamoDB();
      } catch (dbError) {
        console.warn('DynamoDB initialization failed, but user is authenticated:', dbError);
        // Continue anyway since the user is authenticated
      }
      
      return result;
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  },
  
  signUp: async (email, password) => {
    try {
      // In development, simulate successful sign-up
      if (isDevelopment) {
        console.log('Development mode: Simulating successful sign-up');
        localStorage.setItem('75ascend-dev-auth', JSON.stringify({ 
          email, 
          needsConfirmation: true 
        }));
        return { success: true };
      }
      
      await ensureAmplifyInitialized();
      
      console.log('Signing up with:', { username: email });
      const result = await signUp({
        username: email,
        password,
        options: {
          userAttributes: {
            email
          }
        }
      });
      
      return { success: true, user: result.user };
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  },
  
  confirmSignUp: async (email, code) => {
    try {
      // In development, simulate successful confirmation
      if (isDevelopment) {
        console.log('Development mode: Simulating successful confirmation');
        const auth = JSON.parse(localStorage.getItem('75ascend-dev-auth') || '{}');
        auth.needsConfirmation = false;
        localStorage.setItem('75ascend-dev-auth', JSON.stringify(auth));
        return { success: true };
      }
      
      await ensureAmplifyInitialized();
      
      const result = await confirmSignUp({
        username: email,
        confirmationCode: code
      });
      
      return { success: true, result };
    } catch (error) {
      console.error('Error confirming sign up:', error);
      throw error;
    }
  },
  
  signOut: async () => {
    try {
      // In development, simulate successful sign-out
      if (isDevelopment) {
        console.log('Development mode: Simulating successful sign-out');
        localStorage.removeItem('75ascend-dev-auth');
        return { success: true };
      }
      
      await ensureAmplifyInitialized();
      
      await signOut();
      return { success: true };
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
        return { sub: 'dev-user-123', email: 'dev@example.com' };
      }
      
      await ensureAmplifyInitialized();
      
      try {
        const session = await fetchAuthSession();
        
        if (!session.tokens) {
          console.log('No tokens in session');
          return null;
        }
        
        // Get user info from the ID token
        const idToken = session.tokens.idToken;
        const payload = idToken.payload;
        
        return {
          sub: payload.sub,
          email: payload.email,
          // Add any other user attributes you need
        };
      } catch (error) {
        console.error('Error getting current user:', error);
        
        // If there's an authentication error, return null instead of throwing
        if (error.message.includes('not authenticated') || 
            error.message.includes('No current user') ||
            error.message.includes('not from a supported provider')) {
          return null;
        }
        
        throw error;
      }
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }
}; 
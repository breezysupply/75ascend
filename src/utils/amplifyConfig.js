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
const CLIENT_ID = '31gir3ub0es6l03j3vkah2jbnf'; // Your actual client ID
const REDIRECT_URI = 'https://main.d1oas7a4pwxwes.amplifyapp.com'; // Your app's URL

// This function will be called by the Astro pages
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
    
    // Import Amplify dynamically with error handling
    let amplifyModule;
    try {
      amplifyModule = await import('aws-amplify');
      Amplify = amplifyModule.Amplify;
    } catch (importError) {
      console.error('Failed to import AWS Amplify:', importError);
      // Continue with other imports to see if they work
    }
    
    // Import auth functions dynamically with error handling
    let authModule;
    try {
      authModule = await import('aws-amplify/auth');
      fetchAuthSession = authModule.fetchAuthSession;
      signIn = authModule.signIn;
      signUp = authModule.signUp;
      confirmSignUp = authModule.confirmSignUp;
      signOut = authModule.signOut;
    } catch (importError) {
      console.error('Failed to import auth module:', importError);
      // Continue with other imports
    }
    
    // Only proceed with DynamoDB setup if auth was successful
    if (authModule) {
      try {
        // Import DynamoDB modules dynamically
        const dynamoDBClientModule = await import('@aws-sdk/client-dynamodb');
        DynamoDBClient = dynamoDBClientModule.DynamoDBClient;
        
        const dynamoDBDocumentClientModule = await import('@aws-sdk/lib-dynamodb');
        DynamoDBDocumentClient = dynamoDBDocumentClientModule.DynamoDBDocumentClient;
        GetCommand = dynamoDBDocumentClientModule.GetCommand;
        PutCommand = dynamoDBDocumentClientModule.PutCommand;
        
        // Initialize DynamoDB client
        dynamoClient = new DynamoDBClient({ region: "us-east-1" });
        docClient = DynamoDBDocumentClient.from(dynamoClient);
      } catch (importError) {
        console.error('Failed to import DynamoDB modules:', importError);
      }
    }
    
    // Only configure Amplify if it was successfully imported
    if (Amplify) {
      // Configure Amplify with your Cognito User Pool details
      Amplify.configure({
        Auth: {
          Cognito: {
            userPoolId: 'us-east-1_ylst7UO8Z',
            userPoolClientId: '31gir3ub0es6l03j3vkah2jbnf',
            region: 'us-east-1',
            loginWith: {
              email: true
            }
          }
        }
      });
      
      console.log('AWS Amplify initialized with Cognito User Pool');
      isAmplifyInitialized = true;
    }
  } catch (error) {
    console.error('Error initializing AWS Amplify:', error);
    console.error('Error details:', error);
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
          userData: data,
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
  
  signIn: async (email, password) => {
    try {
      // In development, simulate successful sign-in
      if (isDevelopment) {
        console.log('Development mode: Simulating successful sign-in');
        localStorage.setItem('75ascend-dev-auth', JSON.stringify({ email }));
        return { success: true, user: { username: email } };
      }
      
      await ensureAmplifyInitialized();
      
      console.log('Signing in with:', { username: email });
      const result = await signIn({
        username: email,
        password
      });
      
      return { success: true, user: result };
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
      // In development, return simulated user
      if (isDevelopment) {
        console.log('Development mode: Returning simulated user');
        const auth = JSON.parse(localStorage.getItem('75ascend-dev-auth') || '{}');
        if (auth.email) {
          return { sub: 'dev-user-id', email: auth.email };
        }
        return null;
      }
      
      await ensureAmplifyInitialized();
      
      try {
        const session = await fetchAuthSession();
        if (session.tokens) {
          const idToken = session.tokens.idToken;
          return {
            sub: idToken.payload.sub,
            email: idToken.payload.email
          };
        }
      } catch (error) {
        console.log('No active session:', error);
      }
      
      return null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }
}; 
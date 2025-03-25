// Check if we're in a development environment
const isDevelopment = import.meta.env.DEV || process.env.NODE_ENV === 'development';

// Only import AWS dependencies if not in development mode
let Amplify, fetchAuthSession, signIn, signUp, confirmSignUp, signOut;
let DynamoDBClient, DynamoDBDocumentClient, GetCommand, PutCommand;
let dynamoClient, docClient;

// Create mock implementations for development
const createDefaultData = () => ({
  currentDay: 1,
  startDate: new Date().toISOString(),
  history: [],
  dailyLogs: []
});

// This function will be called by the Astro pages
export function initializeApp() {
  // Skip Amplify configuration in development mode
  if (isDevelopment) {
    console.log('Development mode: Skipping AWS Amplify configuration');
    return;
  }
  
  // In production, we'll load Amplify synchronously to ensure it's available
  try {
    // Import Amplify synchronously
    const amplifyModule = require('aws-amplify');
    Amplify = amplifyModule.Amplify;
    
    // Import auth functions synchronously
    const authModule = require('aws-amplify/auth');
    fetchAuthSession = authModule.fetchAuthSession;
    signIn = authModule.signIn;
    signUp = authModule.signUp;
    confirmSignUp = authModule.confirmSignUp;
    signOut = authModule.signOut;
    
    // Import DynamoDB modules synchronously
    const dynamoDBClientModule = require('@aws-sdk/client-dynamodb');
    DynamoDBClient = dynamoDBClientModule.DynamoDBClient;
    
    const dynamoDBDocumentClientModule = require('@aws-sdk/lib-dynamodb');
    DynamoDBDocumentClient = dynamoDBDocumentClientModule.DynamoDBDocumentClient;
    GetCommand = dynamoDBDocumentClientModule.GetCommand;
    PutCommand = dynamoDBDocumentClientModule.PutCommand;
    
    // Initialize DynamoDB client
    dynamoClient = new DynamoDBClient({ region: "us-east-1" });
    docClient = DynamoDBDocumentClient.from(dynamoClient);
    
    // Configure Amplify with your Cognito User Pool details
    Amplify.configure({
      Auth: {
        region: 'us-east-1',
        userPoolId: 'us-east-1_yLst7UDB2',
        userPoolWebClientId: 'npcbekf1mfir19g1kfsinmo5',
        oauth: {
          domain: 'd841iy8p4kdic.cloudfront.net',
          scope: ['email', 'profile', 'openid'],
          redirectSignIn: 'https://d841iy8p4kdic.cloudfront.net',
          redirectSignOut: 'https://main.d1oas7a4pwxwes.amplifyapp.com',
          responseType: 'code'
        }
      }
    });
    
    console.log('AWS Amplify initialized with Cognito User Pool');
  } catch (error) {
    console.error('Error initializing AWS Amplify:', error);
  }
}

const TABLE_NAME = "75ascend-user-data"; // Your DynamoDB table name

// Replace with the correct Auth methods for AWS Amplify v6+
export const dataService = {
  getUserData: async () => {
    try {
      // In development, just use localStorage
      if (isDevelopment) {
        console.log('Development mode: Using localStorage instead of DynamoDB');
        const data = localStorage.getItem('75ascend-data');
        if (data) {
          return JSON.parse(data);
        }
        
        // Create default data if none exists
        const defaultData = createDefaultData();
        localStorage.setItem('75ascend-data', JSON.stringify(defaultData));
        return defaultData;
      }
      
      // First check if user is authenticated
      const session = await fetchAuthSession();
      const userId = session.tokens?.idToken?.payload?.sub;
      
      if (!userId) {
        throw new Error('No authenticated user');
      }
      
      // Fetch user data from DynamoDB
      const command = new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          userId: userId
        }
      });
      
      const response = await docClient.send(command);
      
      // If user data exists in DynamoDB, return it
      if (response.Item) {
        return response.Item.userData;
      }
      
      // If no data exists yet, return default data structure
      const defaultData = createDefaultData();
      
      // Save default data to DynamoDB
      await dataService.saveUserData(defaultData);
      
      return defaultData;
    } catch (error) {
      console.error('Error getting user data:', error);
      
      // Fallback to localStorage for development/testing
      const data = localStorage.getItem('75ascend-data');
      if (data) {
        return JSON.parse(data);
      }
      
      // Create default data if none exists
      const defaultData = createDefaultData();
      localStorage.setItem('75ascend-data', JSON.stringify(defaultData));
      return defaultData;
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
      
      // First check if user is authenticated
      const session = await fetchAuthSession();
      const userId = session.tokens?.idToken?.payload?.sub;
      
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
      
      const result = await signIn({ username: email, password });
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
        localStorage.setItem('75ascend-dev-auth', JSON.stringify({ email, needsConfirmation: true }));
        return { success: true, user: { username: email } };
      }
      
      // Make sure signUp is defined
      if (!signUp) {
        throw new Error('Authentication not initialized properly');
      }
      
      const result = await signUp({
        username: email,
        password,
        attributes: {
          email
        }
      });
      return { success: true, user: result };
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
      
      await confirmSignUp({
        username: email,
        confirmationCode: code
      });
      return { success: true };
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
      
      const session = await fetchAuthSession();
      return session.tokens?.idToken?.payload;
    } catch (error) {
      console.error('No authenticated user:', error);
      return null;
    }
  }
}; 
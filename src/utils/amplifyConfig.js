// Check if we're in a development environment
const isDevelopment = import.meta.env.DEV || process.env.NODE_ENV === 'development';

// Create mock implementations for development
const createDefaultData = () => ({
  currentDay: 1,
  startDate: new Date().toISOString(),
  history: [],
  dailyLogs: []
});

// Flag to track if auth client has been initialized
let isAuthInitialized = false;
let authClient = null;
let DynamoDBClient, DynamoDBDocumentClient, GetCommand, PutCommand;
let dynamoClient, docClient;

// Update these values with your actual Cognito settings
const COGNITO_DOMAIN = 'https://75-ascend-user.auth.us-east-1.amazoncognito.com';
const CLIENT_ID = 'npcbekf1mfir19g1kfsinmo5'; // Your actual client ID
const REDIRECT_URI = 'https://main.d1oas7a4pwxwes.amplifyapp.com'; // Your app's URL

// This function will be called by the Astro pages
export async function initializeApp() {
  // Skip configuration in development mode
  if (isDevelopment) {
    console.log('Development mode: Skipping AWS configuration');
    return;
  }
  
  // If already initialized, don't do it again
  if (isAuthInitialized) {
    return;
  }
  
  try {
    console.log('Initializing authentication...');
    
    // Import AWS Amplify dynamically
    const amplifyModule = await import('aws-amplify');
    const Amplify = amplifyModule.Amplify;
    
    // Import auth functions dynamically
    const authModule = await import('aws-amplify/auth');
    const fetchAuthSession = authModule.fetchAuthSession;
    const signIn = authModule.signIn;
    const signUp = authModule.signUp;
    const confirmSignUp = authModule.confirmSignUp;
    const signOut = authModule.signOut;
    
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
    
    // Configure Amplify with your Cognito User Pool details
    Amplify.configure({
      Auth: {
        region: 'us-east-1',
        userPoolId: 'us-east-1_ylst7UO8Z',
        userPoolWebClientId: 'npcbekf1mfir19g1kfsinmo5'
      }
    });
    
    console.log('Authentication initialized with Cognito User Pool');
    isAuthInitialized = true;
  } catch (error) {
    console.error('Error initializing authentication:', error);
    console.error('Error details:', error.stack);
  }
}

const TABLE_NAME = "75ascend-user-data"; // Your DynamoDB table name

// Helper function to ensure auth is initialized
const ensureAuthInitialized = async () => {
  if (isDevelopment) return;
  
  if (!isAuthInitialized) {
    await initializeApp();
  }
  
  if (!authClient) {
    throw new Error('Authentication not initialized properly');
  }
};

// Authentication and data service
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
      
      await ensureAuthInitialized();
      
      // Get the current user
      const user = await dataService.getCurrentUser();
      const userId = user?.sub;
      
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
      
      await ensureAuthInitialized();
      
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
      
      await ensureAuthInitialized();
      
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
        localStorage.setItem('75ascend-dev-auth', JSON.stringify({ 
          email, 
          needsConfirmation: true 
        }));
        return { success: true };
      }
      
      await ensureAuthInitialized();
      
      console.log('Signing up with:', { username: email });
      const result = await signUp({
        username: email,
        password,
        attributes: {
          email
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
      
      // For OpenID Connect, confirmation is typically handled by the hosted UI
      console.warn('Confirmation is handled by the Cognito hosted UI');
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
      
      await ensureAuthInitialized();
      
      // Redirect to the Cognito sign-out URL
      const logoutUrl = authClient.endSessionUrl({
        state: 'some-state',
        post_logout_redirect_uri: window.location.origin
      });
      
      window.location.href = logoutUrl;
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
      
      await ensureAuthInitialized();
      
      // Check if we have a token in the URL (after redirect from Cognito)
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      
      if (code) {
        // Exchange the code for tokens
        const tokens = await authClient.callback(
          window.location.origin,
          { code },
          { state: params.get('state') }
        );
        
        // Store the tokens
        localStorage.setItem('75ascend-tokens', JSON.stringify(tokens));
        
        // Remove the code from the URL
        window.history.replaceState({}, document.title, window.location.pathname);
        
        // Return the user info from the ID token
        return tokens.claims();
      }
      
      // Check if we have stored tokens
      const tokensStr = localStorage.getItem('75ascend-tokens');
      if (tokensStr) {
        const tokens = JSON.parse(tokensStr);
        return tokens.claims();
      }
      
      return null;
    } catch (error) {
      console.error('No authenticated user:', error);
      return null;
    }
  }
}; 
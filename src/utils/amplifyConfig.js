import { Amplify, Auth } from 'aws-amplify';
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";

// Initialize DynamoDB client
const dynamoClient = new DynamoDBClient({ region: "us-east-1" });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const TABLE_NAME = "75ascend-user-data"; // Your DynamoDB table name

export function initializeApp() {
  // Configure Amplify with your Cognito User Pool details
  Amplify.configure({
    Auth: {
      region: 'us-east-1', // Replace with your region if different
      userPoolId: 'us-east-1_yLst7UDB2', // From your screenshot
      userPoolWebClientId: 'npcbekf1mfir19g1kfsinmo5', // From your screenshot
      oauth: {
        domain: 'd841iy8p4kdic.cloudfront.net', // From your screenshot
        scope: ['email', 'profile', 'openid'],
        redirectSignIn: 'https://d841iy8p4kdic.cloudfront.net', // Update with your app URL
        redirectSignOut: 'https://d841iy8p4kdic.cloudfront.net', // Update with your app URL
        responseType: 'code'
      }
    },
    identityPoolId: 'YOUR_IDENTITY_POOL_ID', // Create an identity pool in Cognito
    identityPoolRegion: 'us-east-1'
  });
  
  console.log('AWS Amplify initialized with Cognito User Pool');
}

// Replace mock implementations with actual AWS Auth calls and DynamoDB operations
export const dataService = {
  getUserData: async () => {
    try {
      // First check if user is authenticated
      const user = await Auth.currentAuthenticatedUser();
      const userId = user.attributes.sub;
      
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
      const defaultData = {
        currentDay: 1,
        startDate: new Date().toISOString(),
        history: [],
        dailyLogs: []
      };
      
      // Save default data to DynamoDB
      await dataService.saveUserData(defaultData);
      
      return defaultData;
    } catch (error) {
      console.error('Error getting user data:', error);
      
      // Fallback to localStorage for development/testing
      const data = localStorage.getItem('75ascend-data');
      return data ? JSON.parse(data) : null;
    }
  },
  
  saveUserData: async (data) => {
    try {
      // First check if user is authenticated
      const user = await Auth.currentAuthenticatedUser();
      const userId = user.attributes.sub;
      
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
      
      throw error;
    }
  },
  
  signIn: async (email, password) => {
    try {
      const user = await Auth.signIn(email, password);
      return { success: true, user };
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  },
  
  signUp: async (email, password) => {
    try {
      const { user } = await Auth.signUp({
        username: email,
        password,
        attributes: {
          email
        }
      });
      return { success: true, user };
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  },
  
  confirmSignUp: async (email, code) => {
    try {
      await Auth.confirmSignUp(email, code);
      return { success: true };
    } catch (error) {
      console.error('Error confirming sign up:', error);
      throw error;
    }
  },
  
  signOut: async () => {
    try {
      await Auth.signOut();
      return { success: true };
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  },
  
  getCurrentUser: async () => {
    try {
      const user = await Auth.currentAuthenticatedUser();
      return user;
    } catch (error) {
      console.error('No authenticated user:', error);
      return null;
    }
  }
}; 
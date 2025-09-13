// Example function to register FCM token with backend after login
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import axios from 'axios';

export async function registerForPushNotificationsAsync(appJwt) {
  let token;
  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      alert('Failed to get push token for push notification!');
      return;
    }
    token = (await Notifications.getExpoPushTokenAsync()).data;
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  if (token) {
    try {
      await axios.post(`${process.env.EXPO_PUBLIC_API_BASE || 'http://localhost:4000'}/tokens/register`, { token }, {
        headers: { Authorization: `Bearer ${appJwt}` }
      });
      console.log('registered token with backend');
    } catch (err) {
      console.error('register token error', err);
    }
  }
  return token;
}

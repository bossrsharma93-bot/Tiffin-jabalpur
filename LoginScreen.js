import React, { useState, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, Alert } from 'react-native';
import Header from '../components/Header';
import Button from '../components/Button';
import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';
import firebaseConfig from '../firebaseConfig';
import * as firebase from 'firebase/app';
import { getAuth, signInWithPhoneNumber } from 'firebase/auth';
import Constants from 'expo-constants';

// Initialize firebase app (web SDK style) - requires expo dev client or web support
if (!firebase.getApps || !firebase.getApps().length) {
  try { firebase.initializeApp(firebaseConfig); } catch (e) { /* ignore */ }
}
const auth = getAuth();

export default function LoginScreen({ navigation }) {
  const recaptchaVerifier = useRef(null);
  const [phone, setPhone] = useState('');
  const [verificationId, setVerificationId] = useState(null);
  const [code, setCode] = useState('');

  const send = async () => {
    if (!phone || phone.length < 10) return Alert.alert('Enter valid phone');
    try {
      const confirmation = await signInWithPhoneNumber(auth, phone, recaptchaVerifier.current);
      setVerificationId(confirmation.verificationId || null);
      Alert.alert('OTP sent');
    } catch (err) {
      console.error('send otp', err);
      Alert.alert('Failed to send OTP', err.message || String(err));
    }
  };

  const verify = async () => {
    try {
      // verify code - create credential then get idToken and send to backend
      // In web SDK flow you'd confirm with confirmation result; expo native flow differs - adapt accordingly
      Alert.alert('Verify', 'Complete client-side verification and then call /auth/fbtoken to receive app JWT.');
      navigation.replace('Home');
    } catch (err) {
      console.error('verify otp', err);
      Alert.alert('Failed', err.message || String(err));
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <Header title="Welcome" />
      <FirebaseRecaptchaVerifierModal ref={recaptchaVerifier} firebaseConfig={firebaseConfig} />
      <View style={styles.body}>
        <Text style={styles.h1}>Sign in with Phone</Text>
        <TextInput placeholder="+91XXXXXXXXXX" value={phone} onChangeText={setPhone} style={styles.input} keyboardType="phone-pad" />
        {!verificationId && <Button title="Send OTP" onPress={send} />}
        {verificationId && (
          <>
            <TextInput placeholder="OTP code" value={code} onChangeText={setCode} style={styles.input} keyboardType="numeric" />
            <Button title="Verify and Continue" onPress={verify} style={{ marginTop: 12 }} />
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { padding: 20 },
  h1: { fontSize: 22, fontWeight: '700', marginVertical: 12 },
  input: { borderWidth: 1, borderColor: '#eee', padding: 12, borderRadius: 8, marginVertical: 8 }
});

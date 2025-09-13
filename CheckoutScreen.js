import React from 'react';
import { View, Text, Alert } from 'react-native';
import Header from '../components/Header';
import Button from '../components/Button';

export default function CheckoutScreen({ route, navigation }) {
  const cart = route.params?.cart || [];
  const subtotal = cart.reduce((s, i)=> s + i.price, 0);

  const payUPI = () => {
    Alert.alert('UPI flow', 'This will open UPI app. Implement intent on native side.');
  };

  const payRazor = () => {
    Alert.alert('Razorpay', 'This will call /payments/create_link and open payment link.');
  };

  return (
    <View style={{ flex: 1 }}>
      <Header title="Checkout" />
      <View style={{ padding: 16 }}>
        <Text style={{ fontWeight: '700' }}>Subtotal: ₹{subtotal}</Text>
        <Button title="Pay via UPI (Manual)" onPress={payUPI} style={{ marginTop: 12 }} />
        <Button title="Pay via Razorpay" onPress={payRazor} style={{ marginTop: 12 }} />
        <Button title="Choose Address" onPress={() => navigation.navigate('PickAddress')} style={{ marginTop: 12 }} />
      </View>
    </View>
  );
}

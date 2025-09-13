import React from 'react';
import { View, Text, Alert } from 'react-native';
import Header from '../components/Header';
import Button from '../components/Button';

export default function AddressPicker({ navigation }) {
  const pick = () => {
    Alert.alert('Map picker', 'Implement react-native-maps map and let user drop a pin. This is a placeholder.');
  };

  return (
    <View style={{ flex: 1 }}>
      <Header title="Pick Address" />
      <View style={{ padding: 16 }}>
        <Text style={{ marginBottom: 12 }}>Select your delivery location on the map.</Text>
        <Button title="Open Map (placeholder)" onPress={pick} />
        <Button title="Use current location" onPress={() => Alert.alert('GPS', 'Implement geolocation permissions and fetch current pos.')} style={{ marginTop: 12 }} />
      </View>
    </View>
  );
}

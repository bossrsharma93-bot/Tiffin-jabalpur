import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import Header from '../components/Header';
import Card from '../components/Card';
import Button from '../components/Button';

const SAMPLE = [
  { id: '1', name: 'Veg Thali', price: 99 },
  { id: '2', name: 'Paneer Sabzi', price: 129 },
  { id: '3', name: 'Dal Fry + Rice', price: 89 }
];

export default function MenuScreen({ navigation }) {
  const [cart, setCart] = useState([]);

  const add = (item) => setCart(prev => [...prev, item]);

  return (
    <View style={{ flex: 1 }}>
      <Header title="Menu" />
      <FlatList data={SAMPLE} keyExtractor={i=>i.id} contentContainerStyle={{ padding: 16 }} renderItem={({item})=>(
        <Card>
          <Text style={{ fontWeight: '700' }}>{item.name}</Text>
          <Text>₹{item.price}</Text>
          <Button title="Add" onPress={()=>add(item)} style={{ marginTop: 8 }} />
        </Card>
      )} />
      <View style={{ padding: 16 }}>
        <Button title="Go to Cart" onPress={() => navigation.navigate('Cart', { cart })} />
      </View>
    </View>
  );
}

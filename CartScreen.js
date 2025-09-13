import React from 'react';
import { View, Text, FlatList } from 'react-native';
import Header from '../components/Header';
import Button from '../components/Button';

export default function CartScreen({ route, navigation }) {
  const cart = route.params?.cart || [];
  const subtotal = cart.reduce((s, i)=> s + i.price, 0);

  return (
    <View style={{ flex: 1 }}>
      <Header title="Your Cart" />
      <View style={{ padding: 16 }}>
        <FlatList data={cart} keyExtractor={(i,idx)=>String(idx)} renderItem={({item})=>(
          <View style={{ padding: 8 }}>
            <Text style={{ fontWeight: '700' }}>{item.name}</Text>
            <Text>₹{item.price}</Text>
          </View>
        )} />
        <Text style={{ fontWeight: '700', marginTop: 12 }}>Subtotal: ₹{subtotal}</Text>
        <Button title="Checkout" onPress={() => navigation.navigate('Checkout', { cart })} style={{ marginTop: 12 }} />
      </View>
    </View>
  );
}

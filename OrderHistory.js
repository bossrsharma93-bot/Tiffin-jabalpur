import React from 'react';
import { View, Text, FlatList } from 'react-native';
import Header from '../components/Header';
import Card from '../components/Card';

const SAMPLE = [
  { id: '101', items: ['Veg Thali'], total: 99, status: 'delivered' },
  { id: '102', items: ['Paneer Sabzi'], total: 129, status: 'paid' }
];

export default function OrderHistory() {
  return (
    <View style={{ flex: 1 }}>
      <Header title="Your Orders" />
      <FlatList data={SAMPLE} keyExtractor={i=>i.id} contentContainerStyle={{ padding: 16 }} renderItem={({item})=>(
        <Card>
          <Text style={{ fontWeight: '700' }}>Order #{item.id}</Text>
          <Text>{item.items.join(', ')}</Text>
          <Text>Status: {item.status}</Text>
          <Text>Total: ₹{item.total}</Text>
        </Card>
      )} />
    </View>
  );
}

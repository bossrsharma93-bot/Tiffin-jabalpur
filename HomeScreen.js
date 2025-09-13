import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import Header from '../components/Header';
import Card from '../components/Card';

export default function HomeScreen({ navigation }) {
  return (
    <View style={{ flex: 1 }}>
      <Header title="Tiffin Marketplace" />
      <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
        <Text style={styles.h1}>Popular Today</Text>
        {[1,2,3,4].map(i => (
          <TouchableOpacity key={i} onPress={() => navigation.navigate('Menu')}>
            <Card>
              <Text style={styles.itemTitle}>Delicious Tiffin {i}</Text>
              <Text>Home-style meals delivered hot</Text>
            </Card>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#F7F7F7' },
  h1: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  itemTitle: { fontSize: 16, fontWeight: '700' }
});

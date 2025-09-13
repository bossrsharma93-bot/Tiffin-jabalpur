import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import theme from '../theme';

export default function Header({ title }) {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 40,
    paddingBottom: 10,
    backgroundColor: '#FF3B30',
    alignItems: 'center'
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700'
  }
});

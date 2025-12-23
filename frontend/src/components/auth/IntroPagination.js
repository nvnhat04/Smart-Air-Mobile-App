import { StyleSheet, View } from 'react-native';

export default function IntroPagination({ total, currentIndex }) {
  return (
    <View style={styles.pagination}>
      {Array.from({ length: total }).map((_, index) => (
        <View
          key={index}
          style={[styles.dot, currentIndex === index && styles.dotActive]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#cbd5e1',
    marginHorizontal: 4,
  },
  dotActive: {
    width: 24,
    backgroundColor: '#3b82f6',
  },
});



import { Feather } from '@expo/vector-icons';
import { StyleSheet, Text, View, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export default function IntroSlide({ title, description, icon, color }) {
  return (
    <View style={styles.slide}>
      <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
        <Feather name={icon} size={80} color={color} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  slide: {
    width,
    paddingHorizontal: 40,
    paddingTop: 120,
    alignItems: 'center',
  },
  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
  },
});



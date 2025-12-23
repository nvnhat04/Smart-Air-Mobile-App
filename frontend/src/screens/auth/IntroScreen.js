import { useNavigation } from '@react-navigation/native';
import { useRef, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import IntroPagination from '../../components/auth/IntroPagination';
import IntroSlide from '../../components/auth/IntroSlide';
import { Feather } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const slides = [
  {
    id: 1,
    title: 'Theo dõi chất lượng không khí',
    description: 'Cập nhật chỉ số AQI, PM2.5 theo thời gian thực tại vị trí của bạn',
    icon: 'wind',
    color: '#3b82f6',
  },
  {
    id: 2,
    title: 'Dự báo & Phân tích',
    description: 'Xem dự báo không khí 7 ngày tới và phân tích mức độ phơi nhiễm của bạn',
    icon: 'trending-up',
    color: '#8b5cf6',
  },
  {
    id: 3,
    title: 'Khuyến cáo sức khỏe',
    description: 'Nhận lời khuyên dựa trên Bộ Y tế và tìm địa điểm có không khí sạch',
    icon: 'heart',
    color: '#ef4444',
  },
];

export default function IntroScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef(null);
  const navigation = useNavigation();

  const handleScroll = (event) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / width);
    setCurrentIndex(index);
  };

  const scrollToIndex = (index) => {
    scrollViewRef.current?.scrollTo({ x: index * width, animated: true });
    setCurrentIndex(index);
  };

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      scrollToIndex(currentIndex + 1);
    } else {
      navigation.navigate('Login');
    }
  };

  const handleSkip = () => {
    navigation.navigate('Login');
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
        <Text style={styles.skipText}>Bỏ qua</Text>
      </TouchableOpacity>

      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {slides.map((slide) => (
          <IntroSlide
            key={slide.id}
            title={slide.title}
            description={slide.description}
            icon={slide.icon}
            color={slide.color}
          />
        ))}
      </ScrollView>

      <IntroPagination total={slides.length} currentIndex={currentIndex} />

      <TouchableOpacity style={styles.button} onPress={handleNext}>
        <Text style={styles.buttonText}>
          {currentIndex === slides.length - 1 ? 'Bắt đầu' : 'Tiếp theo'}
        </Text>
        <Feather name="arrow-right" size={20} color="#fff" style={{ marginLeft: 8 }} />
      </TouchableOpacity>

      <View style={styles.branding}>
        <Text style={styles.brandText}>SmartAir</Text>
        <Text style={styles.brandSubtext}>Giải pháp theo dõi không khí thông minh</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  skipButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  skipText: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '600',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    marginHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 20,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  branding: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  brandText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 4,
  },
  brandSubtext: {
    fontSize: 12,
    color: '#94a3b8',
  },
});



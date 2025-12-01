import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { Feather } from '@expo/vector-icons';

export default function NewsScreen() {
  const newsDataRaw = [
    {
      id: 1,
      title: 'Không khí lạnh tràn về, bụi mịn PM2.5 giảm mạnh tại Hà Nội',
      source: 'VnExpress',
      date: '2024-11-24',
      category: 'Thời tiết',
      img: '❄️',
      summary:
        'Đợt không khí lạnh mạnh khiến nhiệt độ giảm 5-7°C, chất lượng không khí được cải thiện đáng kể.',
      readTime: '3 phút đọc',
      views: '2.4k',
    },
    {
      id: 2,
      title: 'Cảnh báo: Chỉ số UV đạt ngưỡng rất cao tại các tỉnh miền Trung',
      source: 'AirVisual',
      date: '2024-11-24',
      category: 'Cảnh báo',
      img: '☀️',
      summary:
        'Chỉ số UV lên tới 11-12, người dân cần hạn chế ra ngoài từ 11h-15h và sử dụng kem chống nắng.',
      readTime: '2 phút đọc',
      views: '3.1k',
    },
    {
      id: 3,
      title: 'Top 7 loại cây lọc không khí tốt nhất cho phòng ngủ và văn phòng',
      source: 'Sức khỏe & Đời sống',
      date: '2024-11-23',
      category: 'Sống xanh',
      img: '🌿',
      summary:
        'Cây trầu bà, lưỡi hổ, cây kim tiền... là những lựa chọn lý tưởng giúp lọc không khí và tạo oxy.',
      readTime: '5 phút đọc',
      views: '5.7k',
    },
    {
      id: 4,
      title: 'Quy định mới về khí thải xe máy sẽ có hiệu lực từ tháng 1/2025',
      source: 'Báo Giao Thông',
      date: '2024-11-22',
      category: 'Chính sách',
      img: '🛵',
      summary:
        'Tiêu chuẩn khí thải Euro 5 bắt buộc với xe máy mới, nhằm giảm thiểu ô nhiễm không khí đô thị.',
      readTime: '4 phút đọc',
      views: '1.8k',
    },
    {
      id: 5,
      title: 'Nghiên cứu: Ô nhiễm không khí làm tăng 20% nguy cơ mắc bệnh hô hấp',
      source: 'Tạp chí Y học',
      date: '2024-11-21',
      category: 'Sức khỏe',
      img: '🏥',
      summary:
        'Các chuyên gia khuyến cáo đeo khẩu trang N95 khi AQI trên 150 và tăng cường ăn thực phẩm giàu chất chống oxi hóa.',
      readTime: '6 phút đọc',
      views: '4.2k',
    },
    {
      id: 6,
      title: 'Hà Nội triển khai 50 trạm quan trắc chất lượng không khí tự động',
      source: 'Thanh Niên',
      date: '2024-11-20',
      category: 'Công nghệ',
      img: '📡',
      summary:
        'Hệ thống trạm mới sẽ cung cấp dữ liệu real-time, giúp người dân chủ động phòng tránh ô nhiễm.',
      readTime: '3 phút đọc',
      views: '2.9k',
    },
    {
      id: 7,
      title: 'Mùa đông năm nay dự báo ít sương mù, AQI trung bình ở mức tốt',
      source: 'Khí tượng Thủy văn',
      date: '2024-11-19',
      category: 'Thời tiết',
      img: '🌫️',
      summary:
        'Điều kiện khí tượng thuận lợi với gió mùa đông bắc mạnh sẽ giúp giảm ô nhiễm không khí.',
      readTime: '4 phút đọc',
      views: '3.5k',
    },
    {
      id: 8,
      title: 'Hướng dẫn chi tiết: Cách đọc và hiểu chỉ số AQI trên bản đồ',
      source: 'SmartAir Guide',
      date: '2024-11-18',
      category: 'Hướng dẫn',
      img: '📊',
      summary:
        'Giải thích ý nghĩa từng mức AQI và khuyến cáo sức khỏe tương ứng cho từng nhóm người.',
      readTime: '5 phút đọc',
      views: '6.3k',
    },
  ];

  const categories = [
    'Tất cả',
    'Thời tiết',
    'Cảnh báo',
    'Sống xanh',
    'Chính sách',
    'Sức khỏe',
    'Công nghệ',
    'Hướng dẫn',
  ];

  const [filter, setFilter] = useState('Tất cả');
  const [bookmarked, setBookmarked] = useState([]);
  const [showFilterModal, setShowFilterModal] = useState(false);

  const sortedNews = useMemo(
    () =>
      [...newsDataRaw].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      ),
    [],
  );

  const filteredNews =
    filter === 'Tất cả'
      ? sortedNews
      : sortedNews.filter((n) => n.category === filter);

  const toggleBookmark = (id) => {
    setBookmarked((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    const diffTime = today.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Hôm nay';
    if (diffDays === 1) return 'Hôm qua';
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return date.toLocaleDateString('vi-VN');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Tin tức</Text>
        </View>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilterModal(true)}
          activeOpacity={0.7}
        >
          <Feather name="filter" size={18} color="#2563eb" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesWrapper}
        >
          {categories.map((cat) => {
            const isActive = filter === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryChip,
                  isActive && styles.categoryChipActive,
                ]}
                onPress={() => setFilter(cat)}
              >
                <Text
                  style={[
                    styles.categoryText,
                    isActive && styles.categoryTextActive,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.newsCountRow}>
          <Text style={styles.newsCountText}>
            {filteredNews.length} bài viết{' '}
            {filter !== 'Tất cả' ? `trong "${filter}"` : ''}
          </Text>
        </View>

        {filteredNews.map((news) => {
          const isBookmarked = bookmarked.includes(news.id);
          return (
            <View key={news.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.emojiWrapper}>
                  <Text style={styles.emoji}>{news.img}</Text>
                </View>
                <View style={styles.cardHeaderContent}>
                  <View style={styles.chipRow}>
                    <Text style={styles.categoryBadge}>{news.category}</Text>
                    <Text style={styles.dateText}>{formatDate(news.date)}</Text>
                  </View>
                  <Text style={styles.cardTitle}>{news.title}</Text>
                </View>
              </View>

              <Text style={styles.summary}>{news.summary}</Text>

              <View style={styles.cardFooter}>
                <View style={styles.footerLeft}>
                  <Text style={styles.sourceText}>{news.source}</Text>
                  <Text style={styles.dotDivider}>•</Text>
                  <Text style={styles.metaText}>{news.readTime}</Text>
                  <Text style={styles.dotDivider}>•</Text>
                  <Text style={styles.metaText}>{news.views} lượt xem</Text>
                </View>

                <View style={styles.footerRight}>
                  <TouchableOpacity style={styles.iconCircleSecondary}>
                    <Feather name="external-link" size={15} color="#0f172a" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.iconCircleSecondary}>
                    <Feather name="share-2" size={15} color="#0f172a" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => toggleBookmark(news.id)}
                    style={[
                      styles.iconCirclePrimary,
                      isBookmarked && styles.iconCirclePrimaryActive,
                    ]}
                  >
                    <Feather
                      name={isBookmarked ? 'bookmark' : 'bookmark'}
                      size={15}
                      color={isBookmarked ? '#b45309' : '#1d4ed8'}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowFilterModal(false)}
        >
          <View style={styles.filterModal} onStartShouldSetResponder={() => true}>
            <View style={styles.filterModalHeader}>
              <Text style={styles.filterModalTitle}>Bộ lọc</Text>
              <TouchableOpacity
                onPress={() => setShowFilterModal(false)}
                style={styles.filterModalClose}
              >
                <Feather name="x" size={20} color="#64748b" />
              </TouchableOpacity>
            </View>
            <View style={styles.filterModalContent}>
              <Text style={styles.filterSectionTitle}>Sắp xếp theo</Text>
              <TouchableOpacity style={styles.filterOption}>
                <Text style={styles.filterOptionText}>Mới nhất</Text>
                <Feather name="check" size={18} color="#2563eb" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.filterOption}>
                <Text style={styles.filterOptionText}>Phổ biến nhất</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.filterOption}>
                <Text style={styles.filterOptionText}>Xem nhiều nhất</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    paddingTop: 50,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    justifyContent: 'space-between',
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0f172a',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    color: '#64748b',
  },
  scrollContent: {
    paddingBottom: 24,
  },
  categoriesWrapper: {
    marginBottom: 12,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#ffffff',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  categoryChipActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  categoryTextActive: {
    color: '#ffffff',
  },
  newsCountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  newsCountText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  emojiWrapper: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  emoji: {
    fontSize: 30,
  },
  cardHeaderContent: {
    flex: 1,
  },
  chipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  categoryBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1d4ed8',
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    marginRight: 8,
  },
  dateText: {
    fontSize: 10,
    color: '#94a3b8',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  summary: {
    fontSize: 13,
    color: '#4b5563',
    marginBottom: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 10,
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sourceText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563eb',
  },
  metaText: {
    fontSize: 11,
    color: '#94a3b8',
  },
  footerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dotDivider: {
    fontSize: 12,
    color: '#cbd5e1',
    marginHorizontal: 4,
  },
  iconCircleSecondary: {
    width: 30,
    height: 30,
    borderRadius: 999,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCirclePrimary: {
    width: 30,
    height: 30,
    borderRadius: 999,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCirclePrimaryActive: {
    backgroundColor: '#fef3c7',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  filterModal: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingBottom: 32,
    paddingHorizontal: 20,
    maxHeight: '70%',
  },
  filterModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  filterModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
  },
  filterModalClose: {
    width: 32,
    height: 32,
    borderRadius: 999,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterModalContent: {
    gap: 12,
  },
  filterSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
  },
  filterOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
});




import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getAQIColor } from '../../utils/aqiUtils';

const AQIChart = ({ data, maxAqi, selectedIdx, onSelectBar }) => {
  return (
    <View style={styles.chartContainer}>
      {data.map((item, idx) => {
        const adjustedAqi = item.aqi;
        const height = Math.max((adjustedAqi / maxAqi) * 140, 8);
        const isSelected = idx === selectedIdx;
        const isPast = item.type === 'past';
        const isPresent = item.type === 'present';

        return (
          <TouchableOpacity
            key={item.key}
            style={styles.barWrapper}
            onPress={() => onSelectBar(idx)}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.bar,
                {
                  height,
                  backgroundColor: getAQIColor(adjustedAqi),
                  opacity: isSelected ? 1 : 0.6,
                  borderWidth: isPresent ? 2 : 0,
                  borderColor: isPresent ? '#ffffff' : 'transparent',
                },
              ]}
            />
            <Text
              style={[
                styles.dateLabel,
                isSelected && styles.dateLabelActive,
                isPast && styles.dateLabelPast,
                isPresent && styles.dateLabelPresent,
              ]}
            >
              {item.date}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 180,
    paddingHorizontal: 8,
    marginTop: 20,
  },
  barWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  bar: {
    width: 14,
    borderRadius: 4,
    marginBottom: 6,
  },
  dateLabel: {
    fontSize: 9,
    color: '#94a3b8',
    fontWeight: '500',
    marginTop: 4,
  },
  dateLabelActive: {
    color: '#1e293b',
    fontWeight: '700',
  },
  dateLabelPast: {
    color: '#cbd5e1',
  },
  dateLabelPresent: {
    color: '#1e40af',
    fontWeight: '700',
  },
});

export default AQIChart;

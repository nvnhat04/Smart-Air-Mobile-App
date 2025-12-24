import { Feather } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { scaleFont } from '../../constants/responsive';
import { getAQIColor } from '../../utils';

export default function HistoryItemCard({ item }) {
  // Timestamp from server: "2025-12-07T13:08:25.378251+07:00" (new format with timezone)
  // or "2025-11-30T14:25:59.106000" (old format without timezone - UTC)
  const timestampStr = item.timestamp;
  let dateStr = '';
  let timeStr = '';
  
  if (timestampStr && timestampStr.includes('T')) {
    const [datePart, timePartFull] = timestampStr.split('T');
    const [year, month, day] = datePart.split('-');
    dateStr = `${day}/${month}/${year}`;
    
    // Check if timestamp has timezone info (+07:00 or -XX:XX)
    const hasTimezone = timePartFull.includes('+') || (timePartFull.match(/-/g) || []).length > 0;
    
    if (hasTimezone) {
      // New format with timezone: "13:08:25.378251+07:00"
      // Remove timezone: split by + or - (for negative timezones)
      let timePart = timePartFull;
      if (timePart.includes('+')) {
        timePart = timePart.split('+')[0];
      } else if (timePart.lastIndexOf('-') > 0) {
        timePart = timePart.substring(0, timePart.lastIndexOf('-'));
      }
      
      // Remove milliseconds if present
      if (timePart.includes('.')) {
        timePart = timePart.split('.')[0];
      }
      
      const [hour, minute] = timePart.split(':');
      timeStr = `${hour}:${minute}`;
    } else {
      // Old format without timezone (UTC): "14:25:59.106000"
      // Need to add 7 hours for Vietnam time
      let timePart = timePartFull;
      if (timePart.includes('.')) {
        timePart = timePart.split('.')[0];
      }
      
      const [hour, minute, second] = timePart.split(':');
      const vnDate = new Date(`${datePart}T${timePart}Z`); // Parse as UTC
      const vnHour = vnDate.getHours().toString().padStart(2, '0');
      const vnMinute = vnDate.getMinutes().toString().padStart(2, '0');
      timeStr = `${vnHour}:${vnMinute}`;
      // Update dateStr in case it changed after adding 7 hours
      const vnDay = vnDate.getDate().toString().padStart(2, '0');
      const vnMonth = (vnDate.getMonth() + 1).toString().padStart(2, '0');
      const vnYear = vnDate.getFullYear();
      dateStr = `${vnDay}/${vnMonth}/${vnYear}`;
    }
  } else {
    // Fallback to Date parsing
    const date = new Date(timestampStr);
    dateStr = date.toLocaleDateString('vi-VN');
    timeStr = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  }

  return (
    <View style={styles.historyCard}>
      <View style={styles.historyCardHeader}>
        <View style={[styles.historyCardAqiBadge, { backgroundColor: getAQIColor(item.aqi || 0) }]}>
          <Text style={styles.historyCardAqiText}>{item.aqi || 0}</Text>
        </View>
        <View style={styles.historyCardHeaderText}>
          <Text style={styles.historyCardDate}>{dateStr}</Text>
          <Text style={styles.historyCardTime}>{timeStr}</Text>
        </View>
      </View>
      
      <View style={styles.historyCardBody}>
        <View style={styles.historyCardRow}>
          <Feather name="map-pin" size={scaleFont(14)} color="#64748b" />
          <Text style={styles.historyCardLocation} numberOfLines={2}>
            {item.address || 'Không có địa chỉ'}
          </Text>
        </View>
        
        {item.pm25 && (
          <View style={styles.historyCardRow}>
            <Feather name="wind" size={scaleFont(14)} color="#64748b" />
            <Text style={styles.historyCardMeta}>
              PM2.5: {item.pm25.toFixed(1)} µg/m³
            </Text>
          </View>
        )}
        
        {item.weather && (
          <View style={styles.historyCardRow}>
            <Feather name="cloud" size={scaleFont(14)} color="#64748b" />
            <Text style={styles.historyCardMeta}>
              {item.weather.temp}°C • {item.weather.description}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  historyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  historyCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  historyCardAqiBadge: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyCardAqiText: {
    fontSize: scaleFont(18),
    fontWeight: '800',
    color: '#ffffff',
  },
  historyCardHeaderText: {
    flex: 1,
  },
  historyCardDate: {
    fontSize: scaleFont(15),
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 2,
  },
  historyCardTime: {
    fontSize: scaleFont(12),
    color: '#64748b',
    fontWeight: '500',
  },
  historyCardBody: {
    gap: 8,
  },
  historyCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  historyCardLocation: {
    flex: 1,
    fontSize: scaleFont(13),
    color: '#334155',
    fontWeight: '500',
    lineHeight: scaleFont(18),
  },
  historyCardMeta: {
    fontSize: scaleFont(13),
    color: '#64748b',
  },
});


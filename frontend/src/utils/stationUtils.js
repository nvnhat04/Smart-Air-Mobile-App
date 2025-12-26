import GoodIcon from '../components/icon/good';
import MaroonIcon from '../components/icon/maroon';
import OrangeIcon from '../components/icon/orange';
import PurpleIcon from '../components/icon/purple';
import RedIcon from '../components/icon/red';
import YellowIcon from '../components/icon/yellow';
import { getAQIColor } from './aqiUtils';

/**
 * Get AQI badge colors (background and text)
 */
export const getAQIBadgeColor = (score) => {
  if (score <= 50) return { bg: '#dcfce7', text: '#166534' };
  if (score <= 100) return { bg: '#fef9c3', text: '#854d0e' };
  if (score <= 150) return { bg: '#ffedd5', text: '#9a3412' };
  if (score <= 200) return { bg: '#fee2e2', text: '#b91c1c' };
  return { bg: '#ede9fe', text: '#5b21b6' };
};

/**
 * Get AQI icon component based on score
 */
export const getAQIIcon = (score) => {
  if (score <= 50) return <GoodIcon width={90} height={90} />;
  if (score <= 100) return <YellowIcon width={90} height={90} />;
  if (score <= 150) return <OrangeIcon width={90} height={90} />;
  if (score <= 200) return <RedIcon width={90} height={90} />;
  if (score <= 300) return <PurpleIcon width={90} height={90} />;
  return <MaroonIcon width={90} height={90} />;
};

/**
 * Generate mock weekly data (fallback)
 */
export const generateWeeklyData = (baseColor) => {
  const daysShort = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  const today = new Date();

  return Array.from({ length: 7 }).map((_, idx) => {
    const d = new Date(today);
    d.setDate(today.getDate() + idx);
    const dayOfWeek = d.getDay();
    const dateStr = `${String(d.getDate()).padStart(2, '0')}/${String(
      d.getMonth() + 1,
    ).padStart(2, '0')}`;

    const val = 20 + Math.floor(Math.random() * 130);

    return {
      label: daysShort[dayOfWeek],
      date: dateStr,
      temp: 27 + Math.floor(Math.random() * 6),
      aqi: val,
    };
  });
};

/**
 * Format timestamp to display format
 */
export const formatTimestamp = (ts, fallbackDate, fallbackTime) => {
  if (!ts) return { time: '', date: fallbackDate };
  try {
    const d = new Date(ts);
    const time = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const date = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    return { time, date };
  } catch (e) {
    return { time: fallbackTime, date: fallbackDate };
  }
};

export { getAQIColor };


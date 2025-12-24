import { width } from './deviceDimensions';
import { PixelRatio } from 'react-native';

const fontScale = PixelRatio.getFontScale();

// Base guideline width (iPhone 6/7/8)
const guidelineBaseWidth = 375;

/**
 * Scale theo kích thước màn hình
 */
export function scale(size) {
  return (width / guidelineBaseWidth) * size;
}

/**
 * Scale vừa phải (UI spacing)
 */
export function moderateScale(size, factor = 0.5) {
  return size + (scale(size) - size) * factor;
}

/**
 * ✅ Scale CHUẨN cho FONT
 * - Tôn trọng cỡ chữ hệ thống
 * - Tránh vỡ layout khi bật Large Text
 */
export function scaleFont(size) {
  return Math.round((width / guidelineBaseWidth) * size / fontScale);
}

export { width };

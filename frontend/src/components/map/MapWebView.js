import React, { forwardRef } from 'react';
import { WebView } from 'react-native-webview';

/**
 * MapWebView - wrapper WebView để nhúng Leaflet map
 * - Nhận sẵn HTML (leafletHTML) để chủ động dùng cùng source như MapScreen hiện tại
 * - onReady: callback khi load xong
 * - onMessage: callback nhận message từ WebView
 * - style: cho phép pass style từ MapScreen (styles.webview)
 */
function MapWebView({ leafletHTML, onReady, onMessage, style }, ref) {
  return (
    <WebView
      ref={ref}
      originWhitelist={['*']}
      source={{ html: leafletHTML }}
      style={style || { flex: 1 }}
      allowsInlineMediaPlayback={true}
      mediaPlaybackRequiresUserAction={false}
      allowsFullscreenVideo={false}
      javaScriptEnabled={true}
      domStorageEnabled={true}
      mixedContentMode="always"
      onLoad={onReady}
      onMessage={onMessage}
    />
  );
}

export default forwardRef(MapWebView);

import React, { useMemo, useRef } from 'react';
import { WebView } from 'react-native-webview';
import { BASE_URL } from '../../services/api';

// Generate Leaflet HTML with dynamic BASE_URL
const generateLeafletHTML = (baseUrl) => `
<!DOCTYPE html>
<html lang="vi">
  <head>
    <meta charset="utf-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
    />
    <link
      rel="stylesheet"
      href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
    />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <style>
      html,
      body,
      #map {
        height: 100%;
        margin: 0;
        padding: 0;
      }
      body {
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI',
          sans-serif;
      }
      .leaflet-control-zoom { display: none !important; }
      @keyframes ping {
        0% { transform: scale(1); opacity: 0.9; }
        75%, 100% { transform: scale(2); opacity: 0; }
      }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script>
      const map = L.map('map', { zoomControl: false }).setView([21.0285, 105.8542], 11);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap'
      }).addTo(map);

      let wmsLayer = null;
      let currentDate = new Date().toISOString().split('T')[0].replace(/-/g, ''); // YYYYMMDD
      
      function createWmsLayer(dateStr) {
        if (wmsLayer) {
          try { map.removeLayer(wmsLayer); } catch (e) {}
        }
        
        // Chuyển đổi date format nếu cần (YYYY-MM-DD -> YYYYMMDD)
        const dateParam = dateStr ? dateStr.replace(/-/g, '') : currentDate;
        
        // Sử dụng TiTiler server với AQI colormap
        wmsLayer = L.tileLayer(
          '${baseUrl}/pm25/tiles/{z}/{x}/{y}.png?date=' + dateParam + '&colormap_name=aqi',
          {
            maxZoom: 18,
            transparent: true,
            opacity: 0.6,
            attribution: '&copy; SmartAQ PM2.5',
            crossOrigin: true
          }
        );
        wmsLayer.addTo(map);
      }
      createWmsLayer();

      const stations = [
        { id: 1, name: 'Vị trí của bạn', aqi: 141, lat: 21.038511, lng: 105.784817 },
        { id: 2, name: 'Trạm Hà Đông', aqi: 91, lat: 20.980549, lng: 105.777182 },
        { id: 3, name: 'Trạm Thanh Xuân', aqi: 81, lat: 20.999001, lng: 105.801448 },
        { id: 4, name: 'Trạm Bắc Ninh', aqi: 87, lat: 21.121444, lng: 106.111273 },
        { id: 5, name: 'Trạm Gia Lâm', aqi: 49, lat: 21.039937, lng: 105.921001 },
        { id: 6, name: 'Trạm Ecopark', aqi: 40, lat: 20.946839, lng: 105.952934 },
        { id: 7, name: 'Trạm Việt Trì', aqi: 108, lat: 21.323284, lng: 105.429681 },
        { id: 8, name: 'Trạm Lục Ngạn', aqi: 88, lat: 21.275277, lng: 106.449584 },
        { id: 9, name: 'Trạm Chí Linh', aqi: 101, lat: 21.141819, lng: 106.384886 }
      ];

      function getAqiColor(aqi) {
        if (aqi <= 50) return '#22c55e';
        if (aqi <= 100) return '#eab308';
        if (aqi <= 150) return '#f97316';
        return '#ef4444';
      }

      function getStatusText(aqi) {
        if (aqi <= 50) return 'Tốt';
        if (aqi <= 100) return 'Trung bình';
        if (aqi <= 150) return 'Kém';
        if (aqi <= 200) return 'Xấu';
        return 'Nguy hại';
      }

      stations.forEach((s) => {
        const color = getAqiColor(s.aqi);
        const pingHtml =
          s.aqi > 150
            ? '<div style="position:absolute;inset:0;border-radius:999px;background:rgba(239,68,68,0.4);animation:ping 1.2s infinite;"></div>'
            : '';

        const iconHtml =
          '<div style="position:relative;width:40px;height:40px;display:flex;align-items:center;justify-content:center;">' +
          pingHtml +
          '<div style="position:relative;width:32px;height:32px;border-radius:999px;border:3px solid #ffffff;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#ffffff;background:' +
          color +
          ';">' +
          s.aqi +
          '</div></div>';

        const icon = L.divIcon({
          html: iconHtml,
          className: '',
          iconAnchor: [0, 0]
        });

        const marker = L.marker([s.lat, s.lng], { icon }).addTo(map);
        marker.on('click', function () {
          try {
            if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
              window.ReactNativeWebView.postMessage(
                JSON.stringify({
                  type: 'station_click',
                  payload: { ...s, status: getStatusText(s.aqi) }
                })
              );
            }
            map.setView([s.lat, s.lng], 12);
          } catch (err) {
            console.error('postMessage error', err);
          }
        });
      });

      window.__setMapCenter = function (lat, lng) {
        try {
          map.setView([lat, lng], 12);
        } catch (e) {
          console.error('setMapCenter error', e);
        }
      };

      window.__setWmsDate = function (isoDate) {
        try {
          if (isoDate) {
            // isoDate có thể là YYYY-MM-DD hoặc YYYYMMDD
            createWmsLayer(isoDate);
          }
        } catch (e) {
          console.error('setWmsDate error', e);
        }
      };

      map.on('click', function (e) {
        try {
          map.setView(e.latlng, 12);
        } catch (err) {
          console.error('map click error', err);
        }
      });
    </script>
  </body>
</html>
`;

function MapWebViewInner({ onStationSelect, onReady }, ref) {
  const localRef = useRef(null);
  
  // Generate HTML with current BASE_URL
  const leafletHTML = useMemo(() => generateLeafletHTML(BASE_URL), []);

  return (
    <WebView
      ref={ref || localRef}
      originWhitelist={['*']}
      source={{ html: leafletHTML }}
      style={{ flex: 1 }}
      onLoadEnd={onReady}
      onMessage={(event) => {
        try {
          const data = JSON.parse(event.nativeEvent.data);
          if (data.type === 'station_click' && onStationSelect) {
            onStationSelect(data.payload);
          }
        } catch {
          // ignore
        }
      }}
    />
  );
}

export default React.forwardRef(MapWebViewInner);

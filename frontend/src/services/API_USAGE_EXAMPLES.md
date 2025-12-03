/**
 * Example usage of the API service in React Native / Expo screens
 * 
 * This file shows how to integrate the api.js service into your screens.
 * You can adapt these patterns to your actual screen files.
 */

// ============================================================================
// EXAMPLE 1: Fetch stations in MapScreen.js
// ============================================================================

/*
import api from '../services/api';

export default function MapScreen() {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStations = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await api.getStations();
        setStations(data.stations || []);
      } catch (err) {
        console.error('Failed to fetch stations', err);
        setError(err.message);
        // fallback to mock data if API fails
        setStations(baseStationMarkers);
      } finally {
        setLoading(false);
      }
    };

    fetchStations();
  }, []);

  // ... rest of component
  // Now use `stations` state instead of the hardcoded baseStationMarkers array
}
*/

// ============================================================================
// EXAMPLE 2: Fetch current AQI in DetailStationScreen.js
// ============================================================================

/*
import api from '../services/api';

export default function DetailStationScreen({ route }) {
  const station = route.params?.station;
  const [aqiData, setAqiData] = useState(null);

  useEffect(() => {
    const fetchAQI = async () => {
      if (!station) return;
      try {
        const data = await api.getCurrentAQI(station.lat, station.lng);
        setAqiData(data);
      } catch (err) {
        console.error('Failed to fetch AQI', err);
      }
    };

    fetchAQI();
  }, [station]);

  return (
    <View>
      <Text>{station?.name}</Text>
      {aqiData && <Text>Nearest: {aqiData.nearest?.name} ({aqiData.distance_m}m away)</Text>}
    </View>
  );
}
*/

// ============================================================================
// EXAMPLE 3: Fetch forecast in AnalyticExposureScreen.js
// ============================================================================

/*
import api from '../services/api';

export default function AnalyticExposureScreen() {
  const [forecast, setForecast] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchForecast = async () => {
      setLoading(true);
      try {
        const data = await api.getForecast();
        setForecast(data.forecast || []);
      } catch (err) {
        console.error('Failed to fetch forecast', err);
      } finally {
        setLoading(false);
      }
    };

    fetchForecast();
  }, []);

  return (
    <ScrollView>
      {forecast.map((item, idx) => (
        <View key={idx}>
          <Text>{item.date}: AQI {item.avg_aqi}</Text>
        </View>
      ))}
    </ScrollView>
  );
}
*/

// ============================================================================
// EXAMPLE 4: Fetch news in NewsScreen.js
// ============================================================================

/*
import api from '../services/api';

export default function NewsScreen() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true);
      try {
        const data = await api.getNews();
        setNews(data.news || []);
      } catch (err) {
        console.error('Failed to fetch news', err);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  return (
    <ScrollView>
      {news.map((item) => (
        <View key={item._id || item.id}>
          <Text style={{ fontWeight: 'bold' }}>{item.title}</Text>
          <Text>{item.summary}</Text>
        </View>
      ))}
    </ScrollView>
  );
}
*/

// ============================================================================
// EXAMPLE 5: Send message in AIChatScreen.js
// ============================================================================

/*
import api from '../services/api';

export default function AIChatScreen() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sessionId] = useState(Math.random().toString(36).substr(2, 9));
  const [loading, setLoading] = useState(false);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = { type: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const data = await api.postChat(input, sessionId);
      const botMsg = { type: 'bot', text: data.reply };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      console.error('Failed to send chat', err);
      setMessages(prev => [...prev, { type: 'bot', text: 'Error: ' + err.message }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      <ScrollView>
        {messages.map((msg, idx) => (
          <View key={idx} style={{ padding: 8 }}>
            <Text style={{ fontWeight: 'bold' }}>{msg.type === 'user' ? 'You' : 'Bot'}:</Text>
            <Text>{msg.text}</Text>
          </View>
        ))}
      </ScrollView>
      <TextInput
        value={input}
        onChangeText={setInput}
        placeholder="Type your message..."
      />
      <TouchableOpacity onPress={handleSendMessage} disabled={loading}>
        <Text>Send</Text>
      </TouchableOpacity>
    </View>
  );
}
*/

export {};

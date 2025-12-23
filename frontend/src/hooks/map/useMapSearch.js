import { useEffect, useState } from 'react';
import { searchLocation } from '../../services/mapService';
import { config } from '../../config';

const NOMINATIM_ENDPOINT = config.NOMINATIM_ENDPOINT + '/search';

/**
 * Hook to manage location search functionality
 * Handles search query, results, loading, and error states
 * Uses debouncing (450ms) and abort controller for cleanup
 */
export default function useMapSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);

  // Tìm kiếm địa điểm qua OpenStreetMap Nominatim (giống SmartAir-UI, bản rút gọn)
  useEffect(() => {
    let active = true;

    const runSearch = async () => {
      const q = searchQuery.trim();
      if (q.length < 3) {
        setSearchResults([]);
        setSearchError(null);
        return;
      }

      try {
        setSearchLoading(true);
        setSearchError(null);

        const results = await searchLocation(q, NOMINATIM_ENDPOINT);
        
        if (!active) return;
        setSearchResults(results);
      } catch (e) {
        if (active && e.name !== 'AbortError') {
          setSearchError('Không tìm thấy địa điểm phù hợp');
        }
      } finally {
        if (active) setSearchLoading(false);
      }
    };

    const debounce = setTimeout(runSearch, 450);

    return () => {
      active = false;
      clearTimeout(debounce);
    };
  }, [searchQuery]);

  /**
   * Clear search completely
   */
  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSearchError(null);
  };

  return {
    searchQuery,
    setSearchQuery,
    searchResults,
    searchLoading,
    searchError,
    clearSearch,
  };
}


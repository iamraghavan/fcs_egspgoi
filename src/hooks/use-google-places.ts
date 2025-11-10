
import { useState, useEffect } from 'react';

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyDfUl7G2CIfkJdCRwakYUQeen2o5cCzcVE';
const GOOGLE_MAPS_API_URL = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;

export function useGooglePlaces() {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if the script is already loaded
    if (window.google && window.google.maps && window.google.maps.places) {
      setLoaded(true);
      return;
    }

    const scriptId = 'google-maps-script';
    let script = document.getElementById(scriptId) as HTMLScriptElement;

    if (!script) {
        script = document.createElement('script');
        script.id = scriptId;
        script.src = GOOGLE_MAPS_API_URL;
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
    }
    
    const handleLoad = () => {
        setLoaded(true);
    };

    const handleError = () => {
        setError("Failed to load Google Maps. Please check your connection or API key.");
        // Clean up the failed script
        const failedScript = document.getElementById(scriptId);
        if (failedScript) {
            document.head.removeChild(failedScript);
        }
    };
    
    script.addEventListener('load', handleLoad);
    script.addEventListener('error', handleError);

    return () => {
      script.removeEventListener('load', handleLoad);
      script.removeEventListener('error', handleError);
    };
  }, []);

  return { loaded, error };
}

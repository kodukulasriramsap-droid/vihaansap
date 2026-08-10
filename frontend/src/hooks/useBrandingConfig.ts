import { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { BrandingConfig, defaultBrandingConfig } from '../types';

export function useBrandingConfig() {
  const [config, setConfig] = useState<BrandingConfig>(defaultBrandingConfig);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const docRef = doc(db, 'config', 'branding');
    const unsubscribe = onSnapshot(docRef, async (docSnap) => {
      if (docSnap.exists()) {
        setConfig(docSnap.data() as BrandingConfig);
        setLoading(false);
      } else {
        try {
          setConfig(defaultBrandingConfig);
          setLoading(false);
          await setDoc(docRef, defaultBrandingConfig);
        } catch (error) {
          console.error("Error creating default branding config:", error);
          setConfig(defaultBrandingConfig);
          setLoading(false);
        }
      }
    }, (error) => {
      console.error("Error fetching branding config:", error);
      setConfig(defaultBrandingConfig);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (config.faviconUrl) {
      const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (link) {
        link.href = config.faviconUrl;
      } else {
        const newLink = document.createElement('link');
        newLink.rel = 'icon';
        newLink.href = config.faviconUrl;
        document.head.appendChild(newLink);
      }
    }
  }, [config.faviconUrl]);

  return { config, loading };
}

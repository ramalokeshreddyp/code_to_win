import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiFetch } from '../utils';

const MetaContext = createContext();

export function useMeta() {
  return useContext(MetaContext);
}

export function MetaProvider({ children }) {
  const [depts, setDepts] = useState([]);
  const [years, setYears] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMeta = async () => {
    try {
      const [deptsData, yearsData, sectionsData] = await Promise.all([
        apiFetch('/meta/depts'),
        apiFetch('/meta/years'),
        apiFetch('/meta/sections'),
      ]);

      setDepts(Array.isArray(deptsData) ? deptsData : []);
      setYears(Array.isArray(yearsData) ? yearsData : []);
      setSections(Array.isArray(sectionsData) ? sectionsData : []);
    } catch (error) {
      console.error('Error fetching meta data:', error);
      setDepts([]);
      setYears([]);
      setSections([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeta();
  }, []);

  return (
    <MetaContext.Provider value={{ depts, years, sections, loading, refreshMeta: fetchMeta }}>
      {children}
    </MetaContext.Provider>
  );
}

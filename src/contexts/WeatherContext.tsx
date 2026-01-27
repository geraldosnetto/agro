
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { type City, AGRICULTURAL_CITIES } from '@/lib/data-sources/weather';

interface WeatherContextType {
    selectedCity: City;
    setCity: (city: City) => void;
}

const WeatherContext = createContext<WeatherContextType | undefined>(undefined);

export function WeatherProvider({ children }: { children: React.ReactNode }) {
    // Estado inicial padrão (pode ser substituído por localStorage)
    const [selectedCity, setSelectedCity] = useState<City>(AGRICULTURAL_CITIES[0]);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // Recuperar do localStorage
        const saved = localStorage.getItem('indicagro_city');
        if (saved) {
            try {
                const city = JSON.parse(saved);
                setSelectedCity(city);
            } catch (e) {
                console.error('Erro ao ler cidade salva:', e);
            }
        }
        setMounted(true);
    }, []);

    const setCity = (city: City) => {
        setSelectedCity(city);
        localStorage.setItem('indicagro_city', JSON.stringify(city));
    };

    if (!mounted) {
        return <>{children}</>;
    }

    return (
        <WeatherContext.Provider value={{ selectedCity, setCity }}>
            {children}
        </WeatherContext.Provider>
    );
}

export function useWeather() {
    const context = useContext(WeatherContext);
    if (context === undefined) {
        throw new Error('useWeather must be used within a WeatherProvider');
    }
    return context;
}

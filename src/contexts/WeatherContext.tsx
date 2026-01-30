
'use client';

import React, { createContext, useContext, useState } from 'react';
import { type City, AGRICULTURAL_CITIES } from '@/lib/data-sources/weather';

interface WeatherContextType {
    selectedCity: City;
    setCity: (city: City) => void;
}

const WeatherContext = createContext<WeatherContextType | undefined>(undefined);

export function WeatherProvider({ children }: { children: React.ReactNode }) {
    // Inicializa com valor do localStorage (lazy init)
    const [selectedCity, setSelectedCity] = useState<City>(() => {
        if (typeof window === 'undefined') return AGRICULTURAL_CITIES[0];
        try {
            const saved = localStorage.getItem('indicagro_city');
            if (saved) {
                return JSON.parse(saved) as City;
            }
        } catch (e) {
            console.error('Erro ao ler cidade salva:', e);
        }
        return AGRICULTURAL_CITIES[0];
    });

    const setCity = (city: City) => {
        setSelectedCity(city);
        localStorage.setItem('indicagro_city', JSON.stringify(city));
    };

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

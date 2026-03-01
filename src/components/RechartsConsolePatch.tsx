// src/components/RechartsConsolePatch.tsx
"use client";

import { useEffect } from "react";

export function RechartsConsolePatch() {
    useEffect(() => {
        const originalConsoleError = console.error;
        const originalConsoleWarn = console.warn;

        const filterArgs = (args: any[]) => {
            if (
                typeof args[0] === "string" &&
                args[0].includes("The width(") &&
                args[0].includes("and height(") &&
                args[0].includes("of chart should be greater than 0")
            ) {
                return true;
            }
            if (
                typeof args[0] === "string" &&
                args[0].includes("defaultProps will be removed from function components") &&
                args[0].includes("Recharts")
            ) {
                return true;
            }
            return false;
        };

        console.error = (...args) => {
            if (filterArgs(args)) return;
            originalConsoleError(...args);
        };

        console.warn = (...args) => {
            if (filterArgs(args)) return;
            originalConsoleWarn(...args);
        };

        return () => {
            console.error = originalConsoleError;
            console.warn = originalConsoleWarn;
        };
    }, []);

    return null;
}

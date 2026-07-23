import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { persistWeightUnitPreference } from '../utils/persistWeightUnitPreference';
import { normalizeWeightUnit, type WeightUnit } from '../utils/weightUnits';

interface WeightUnitContextValue {
  preferredUnit: WeightUnit;
  activeUnit: WeightUnit;
  setActiveUnit: (unit: WeightUnit) => void;
  toggleActiveUnit: () => void;
  isPersisting: boolean;
}

const WeightUnitContext = createContext<WeightUnitContextValue | null>(null);

export function WeightUnitProvider({
  preferredUnit: preferredUnitProp,
  children,
}: {
  preferredUnit?: unknown;
  children: React.ReactNode;
}) {
  const preferredUnit = normalizeWeightUnit(preferredUnitProp);
  const [optimisticUnit, setOptimisticUnit] = useState<WeightUnit | null>(null);
  const [isPersisting, setIsPersisting] = useState(false);

  const activeUnit = optimisticUnit ?? preferredUnit;

  useEffect(() => {
    if (optimisticUnit && preferredUnit === optimisticUnit) {
      setOptimisticUnit(null);
    }
  }, [preferredUnit, optimisticUnit]);

  const setActiveUnit = useCallback(
    (unit: WeightUnit) => {
      if (unit === activeUnit) return;

      const previousUnit = activeUnit;
      setOptimisticUnit(unit);
      setIsPersisting(true);

      void persistWeightUnitPreference(unit)
        .catch((error) => {
          console.warn('No se pudo guardar la unidad de peso:', error);
          setOptimisticUnit(previousUnit === preferredUnit ? null : previousUnit);
        })
        .finally(() => {
          setIsPersisting(false);
        });
    },
    [activeUnit, preferredUnit],
  );

  const toggleActiveUnit = useCallback(() => {
    setActiveUnit(activeUnit === 'kg' ? 'lb' : 'kg');
  }, [activeUnit, setActiveUnit]);

  const value = useMemo(
    () => ({
      preferredUnit,
      activeUnit,
      setActiveUnit,
      toggleActiveUnit,
      isPersisting,
    }),
    [preferredUnit, activeUnit, setActiveUnit, toggleActiveUnit, isPersisting],
  );

  return <WeightUnitContext.Provider value={value}>{children}</WeightUnitContext.Provider>;
}

export function useWeightUnit(): WeightUnitContextValue {
  const context = useContext(WeightUnitContext);
  if (!context) {
    return {
      preferredUnit: 'kg',
      activeUnit: 'kg',
      setActiveUnit: () => {},
      toggleActiveUnit: () => {},
      isPersisting: false,
    };
  }
  return context;
}

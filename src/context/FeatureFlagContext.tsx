import React, { createContext, useContext, useState, ReactNode } from 'react';

interface FeatureFlags {
  [key: string]: boolean;
}

interface FeatureFlagContextProps {
  flags: FeatureFlags;
  setFlag: (key: string, value: boolean) => void;
}

const FeatureFlagContext = createContext<FeatureFlagContextProps | undefined>(undefined);

export const FeatureFlagProvider: React.FC<{ children: ReactNode; initialFlags?: FeatureFlags }> = ({ children, initialFlags = {} }) => {
  const [flags, setFlags] = useState<FeatureFlags>(initialFlags);
  const setFlag = (key: string, value: boolean) => setFlags(f => ({ ...f, [key]: value }));
  return (
    <FeatureFlagContext.Provider value={{ flags, setFlag }}>
      {children}
    </FeatureFlagContext.Provider>
  );
};

export function useFeatureFlag(key: string): boolean {
  const ctx = useContext(FeatureFlagContext);
  if (!ctx) throw new Error('useFeatureFlag must be used within a FeatureFlagProvider');
  return !!ctx.flags[key];
}

export function useSetFeatureFlag(): FeatureFlagContextProps['setFlag'] {
  const ctx = useContext(FeatureFlagContext);
  if (!ctx) throw new Error('useSetFeatureFlag must be used within a FeatureFlagProvider');
  return ctx.setFlag;
}

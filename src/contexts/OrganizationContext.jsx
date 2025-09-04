import React, { createContext, useContext } from 'react';
import useOrganizationData from '../hooks/useOrganizationData';

const OrganizationContext = createContext({});

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error('useOrganization must be used within OrganizationProvider');
  }
  return context;
}

export function OrganizationProvider({ children }) {
  const value = useOrganizationData();

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
}

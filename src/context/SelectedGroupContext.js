import React, { createContext, useContext, useState } from 'react';

const SelectedGroupContext = createContext(null);

export const SelectedGroupProvider = ({ children }) => {
  const [selectedGroupId, setSelectedGroupId] = useState(null);

  return (
    <SelectedGroupContext.Provider value={{ selectedGroupId, setSelectedGroupId }}>
      {children}
    </SelectedGroupContext.Provider>
  );
};

export const useSelectedGroup = () => {
  const context = useContext(SelectedGroupContext);
  if (!context) {
    throw new Error('useSelectedGroup must be used within SelectedGroupProvider');
  }
  return context;
};


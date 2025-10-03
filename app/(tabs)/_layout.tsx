import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#0EA5E9',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          paddingBottom: 10,
          paddingTop: 10,
          height: 80,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="summary"
        options={{
          title: 'My Groups',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'briefcase' : 'briefcase-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'settings' : 'settings-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="groups"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

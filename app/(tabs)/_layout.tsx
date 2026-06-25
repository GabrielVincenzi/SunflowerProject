import SunTabBar from '@/components/layoutcomp/SunTabBar';
import { Tabs } from 'expo-router';
import React from 'react';

const _Layout = () => {
    return (
        <Tabs
            // Pass the custom tab bar implementation
            tabBar={(props) => <SunTabBar {...props} />}
            screenOptions={{
                headerShown: false,
                tabBarShowLabel: false,
            }}
        >
            <Tabs.Screen
                name="home"
                options={{ title: "Home" }}
            />
            <Tabs.Screen
                name="search"
                options={{ title: "Search" }}
            />
            <Tabs.Screen
                name="search2"
                options={{ title: "Search2" }}
            />
            <Tabs.Screen
                name="saved"
                options={{ title: "Saved" }}
            />
            <Tabs.Screen
                name="greenhouse"
                options={{ title: "Greenhouse" }}
            />
            <Tabs.Screen
                name="profile"
                options={{ title: "Profile" }}
            />
        </Tabs>
    );
};

export default _Layout;
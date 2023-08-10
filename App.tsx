import { StatusBar } from 'expo-status-bar';
import { Component, useEffect, useState } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';
import * as Location from 'expo-location';
import axios from 'axios';

export default function App() {
  const [location, setLocation] = useState<undefined | Location.LocationObject>();
  const [error, setError] = useState<undefined | string>();
  const [isTracking, setIsTracking] = useState<boolean>(false);

  useEffect(() => {
    (async () => {

      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Permission to access location was denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);
    })();
  }, []);

  useEffect(() => {
    if (!isTracking) return;

    const interval = setInterval(async () => {
      console.log("Sending location...", location);
    }, 1000);

    return () => clearInterval(interval);
  }, [isTracking])


  return (
    <View style={styles.container}>
      <Text style={{ color: "#fff", fontSize: 42 }}>דו-גלגל</Text>
      <Button
        title={isTracking ? 'Stop' : 'Start'}
        onPress={() => setIsTracking(!isTracking)}
      />
      <Text style={{ color: "#fff", marginTop: 12 }}>{location?.coords.latitude}, {location?.coords.longitude}</Text>
      <Text>{error}</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#168eff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

const HOST_URL = 'https://move-server.vercel.app';

async function sendSample(location: Location.LocationObject) {
  try {
    const method = 'post';
    const url = `${HOST_URL}/samples`;
    const data: CreateSampleRequest = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      timestamp: new Date()
    }

    await axios({
      method,
      url,
      data
    })
  } catch (error) {
    console.log(error);
  }
}

interface CreateSampleRequest {
  latitude: number;
  longitude: number;
  timestamp: Date;
}
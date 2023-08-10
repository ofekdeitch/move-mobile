import { StatusBar } from 'expo-status-bar';
import { Component, useEffect, useState } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import axios from 'axios';

const LOCATION_TASK_NAME = 'background-location-task';

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
    stopTracking();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={{ color: "#fff", fontSize: 42 }}>דו-גלגל</Text>
      <Button
        title={isTracking ? 'Stop' : 'Start'}
        onPress={() => !isTracking ?
          requestPermissions()
            .then(() => setIsTracking(true)) :
          stopTracking()
            .then(() => setIsTracking(false))
        }
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

async function sendSample({ latitude, longitude }: Location) {
  try {
    const method = 'post';
    const url = `${HOST_URL}/samples`;
    const data: CreateSampleRequest = {
      latitude,
      longitude,
      timestamp: new Date()
    }

    console.log("Sending sample...", data);
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

async function requestPermissions() {
  const { status: forgroundStatus } = await Location.requestForegroundPermissionsAsync();

  if (forgroundStatus !== 'granted') {
    console.error("Foreground permissions not granted")
    return;
  }

  console.log('Foreground permissions granted');


  const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();

  if (backgroundStatus !== 'granted') {
    console.error("Background permissions not granted")
    return;
  }

  console.log('Background permissions granted');

  await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
    activityType: Location.ActivityType.Fitness,
    accuracy: Location.Accuracy.Balanced,
    timeInterval: 10000,
    deferredUpdatesDistance: 0,
    deferredUpdatesInterval: 0,
    distanceInterval: 0,
  });
}

async function stopTracking() {
  const isTracking = await Location.hasStartedLocationUpdatesAsync(
    LOCATION_TASK_NAME
  );

  if (isTracking) {
    console.log("stopping tracking")
    await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
  }
}

TaskManager.defineTask<{ locations: Location.LocationObject[] }>(LOCATION_TASK_NAME, async ({ data, error }) => {
  console.log("Running task", LOCATION_TASK_NAME);

  if (error) {
    console.error(error);
    return;
  }
  if (data) {
    const { locations } = data;
    const { latitude, longitude } = locations[0].coords;

    await sendSample({ latitude, longitude });
  } else {
    console.error("no data");
  }
});

interface Location {
  latitude: number;
  longitude: number;
}
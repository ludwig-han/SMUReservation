import React, { useState, useEffect } from "react";
import { Linking, Platform, View, Text, TouchableOpacity, Alert } from "react-native";
import * as Location from "expo-location";

import styles from "../constants/SettingsScreenStyles";

export default function SettingsScreen() {
  const [locationAuthorized, setLocationAuthorized] = useState(false);

  useEffect(() => {
    checkPermission();
  }, []);

  async function checkPermission() {
    const { status } = await Location.getForegroundPermissionsAsync();
    setLocationAuthorized(status === "granted");
  }

  async function requestLocationPermission() {
  const { status } = await Location.requestForegroundPermissionsAsync();

  if (status === "granted") {
        Alert.alert("성공", "위치 권한이 허용되었습니다.");
        setLocationAuthorized(true);
    } else if (status === "denied") {
        Alert.alert(
        "권한 거부됨",
        "위치 권한이 필요합니다. 설정에서 위치 권한을 허용해주세요.",
        [
            { text: "취소", style: "cancel" },
            {
            text: "설정 열기",
            onPress: () => {
                if (Platform.OS === "ios") {
                Linking.openURL("app-settings:");
                } else {
                Linking.openSettings();
                }
            },
            },
        ]
        );
        setLocationAuthorized(false);
    }
    }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>설정</Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>위치 인증</Text>
        <Text style={styles.cardDescription}>
          앱에서 연습실 위치 인증을 위해 위치 권한이 필요합니다.
        </Text>
        <TouchableOpacity
          style={[
            styles.button,
            locationAuthorized ? styles.buttonAuthorized : styles.buttonNotAuthorized,
          ]}
          onPress={requestLocationPermission}
        >
          <Text style={styles.buttonText}>
            {locationAuthorized ? "위치 권한 허용됨" : "위치 권한 요청하기"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

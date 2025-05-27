import React, { useContext, useEffect, useState } from "react";
import * as Location from 'expo-location';
import { View, Text, FlatList, Pressable, Alert, ActivityIndicator } from "react-native";
import { apiRequest } from "../utils/api";
import { LOCATION_M, LOCATION_UB, LOCATION_THRESHOLD_METERS, LOCATION_TEST } from "../constants/settings";
import { getDate, getTime, getDateTime } from "../utils/utils";
import UserContext from "../context/UserContext";
import styles from "../constants/RecordScreenStyles";

import ReservationContext, { useReservationContext } from "../context/ReservationContext";
import { useFocusEffect } from "@react-navigation/native";

export default function RecordsScreen() {
    const [records, setRecords] = useState([]);
    const [refreshing, setRefreshing] = useState(false);

    const { user, setUser } = useContext(UserContext);
    console.log('userdata: ', user);
    
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState(null);

    const getDistanceFromLatLonInMeters = (lat1, lon1, lat2, lon2) => {
        const R = 6371000; // 지구 반지름(m)
        const dLat = deg2rad(lat2 - lat1);
        const dLon = deg2rad(lon2 - lon1);
        const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) *
            Math.cos(deg2rad(lat2)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    const deg2rad = (deg) => deg * (Math.PI / 180);


    const { availableRooms, setAvailableRooms } = useContext(ReservationContext);

    useEffect(() => {
        console.log('Available Rooms:', availableRooms); // 데이터 확인
    }, [availableRooms]);
    
    const getRefreshRecords = async() => {
        setRefreshing(true);
        await getRecords();
        //await setTimeout()
        setRefreshing(false);
    }

    const onRefresh = () => {
        if (!refreshing) {
            getRefreshRecords();
        }
    }

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed':
            case 'cancelled':
                return "#B0B0B0";   // grey
            //case 'reserved':
            //    return "#4CAF50";   // green
            default:
                return '#fff';
        }
    }

    const Item = ({ item, onPress, onCancelPress, onVerifyPress }) => (
        <Pressable
            style={{...styles.recordContainer, backgroundColor: getStatusColor(item.status)}}
            onPress={onPress}>
            <View style={styles.recordTextContainer}>
                <Text style={styles.roomNumberText}>{availableRooms.map((room) => room.id === item.room_id ? room.number : null)}</Text>
                <Text style={styles.dateText}>예약 일자: {getDate(item.start_time, 'ko')}</Text>
                <Text style={styles.timeText}>예약 시간: {`${getTime(item.start_time)}-${getTime(item.end_time)}`}</Text>
                <Text style={styles.createdAtText}>신청일시: {getDateTime(item.created_at)}</Text>
            </View>
            <Pressable      // Reservation Cancel Button
                style={[
                    item.location_status === 'unverified' 
                    ? styles.cancelButton 
                    : item.status === 'verified' 
                    ? styles.completedCancelButton 
                    : styles.cancelledCancelButton,
                  ]}
                onPress={() => onVerifyPress(item.id)}
                disabled={item.location_status !== 'unverified'}>
                <Text style={
                    item.location_status === 'verified' 
                    ? styles.completedCancelButtonText 
                    : styles.cancelButtonText
                }>{item.location_status === 'unverified'
                    ? '위치 인증' 
                    : item.location_status === 'verified' 
                    ? '인증됨' 
                    : '기한 초과'}</Text>
            </Pressable>
            <Pressable      // Check Location
                style={[
                    item.status === 'reserved' 
                    ? styles.cancelButton 
                    : item.status === 'completed' 
                    ? styles.completedCancelButton 
                    : styles.cancelledCancelButton,
                  ]}
                onPress={() => onCancelPress(item.id)}
                disabled={item.status !== 'reserved'}>
                <Text style={
                    item.status === 'completed' 
                    ? styles.completedCancelButtonText 
                    : styles.cancelButtonText
                }>{item.status === 'reserved' 
                    ? '예약 취소' 
                    : item.status === 'cancelled' 
                    ? '취소됨' 
                    : '완료'}</Text>
            </Pressable>
        </Pressable>
    );

    const getRecords = async () => {
        // dataExample = {
        // "id": 4,                                 // 예약 고유 id
        // "user_id": "202099999"                   // 예약자 학번
        // "start_time": "2025-01-03-21-00-00",     // 예약 시작 시간
        // "end_time": "2025-01-03-22-00-00",       // 예약 끝 시간
        // "room_id": 1,                            // 예약한 방 (고유 id)
        // "status": "reserved",                    // reserved, cancelled, in_progress, completed
        // "location_status": "unverified"          // unverified, verified, failed
        // "created_at": "2025-01-03-16-06-11"}     // 예약 신청한 날짜
        const response = await apiRequest(`/reservations/user/${user.user_id}`);
        if (!response.ok) {
            console.log(response);
        } else {
            const result = await response.json()
            setRecords(result);
        }
    }

    const verifyLocation = async (reservationId) => {
        setLoading(true);
        
        // 위치 권한 요청
        let { status } = await Location.requestForegroundPermissionsAsync();
        if ( status !== 'granted') {
             Alert.alert(
                "위치 권한 필요",
                "위치 인증을 위해 위치 권한이 필요합니다. 설정에서 권한을 허용해주세요.",
                [
                    { text: '확인' }
                ]
            );
            return;
        }

        // 현재 위치 받아오기
        let currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Highest,
        });

        const distance = getDistanceFromLatLonInMeters(
            currentLocation.coords.latitude,
            currentLocation.coords.longitude,
            LOCATION_TEST.x,
            LOCATION_TEST.y
        );

        // 인증 가능 범위 내에 있는 경우
        if (distance > LOCATION_THRESHOLD_METERS) {
            Alert.alert(
                '인증 실패',
                `연습실과 ${distance.toFixed(1)}m 떨어져 있습니다.`,
                [{ text: '확인' }]
            );
            setLoading(false);
        } else {
            // 서버로 인증 요청
            try {
                const response = await apiRequest(`reservations/verify/${reservationId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: `reservation_id=${reservationId}`,
                });

                const result = await response.json();

                if (response.ok) {
                Alert.alert(`위치 인증 완료! (연습실 위치와 ${distance.toFixed(1)}m 거리입니다.)`, result.message, [
                    { text: '확인', onPress: getRecords },
                ]);
                } else {
                console.error('서버 오류:', result);
                Alert.alert(
                    '인증 실패',
                    result.message || '서버 오류로 인해 인증에 실패하였습니다.',
                    [{ text: '확인', onPress: getRecords }]
                );
                }
            } catch (e) {
                console.error('통신 오류:', e);
                Alert.alert('오류', '서버와 통신 중 문제가 발생했습니다.');
            } finally {
                setLoading(false);
            }
        }
        
    }

    const cancelReservation = async (reservationId) => {
        Alert.alert(
            '예약 취소',
            '정말 예약을 취소하시겠습니까?',
            [
                {
                    text: '취소',
                    style: 'cancel',
                },
                {
                    text: '확인',
                    style: 'destructive',
                    onPress: async () => {
                        const response = await apiRequest(`reservations/${reservationId}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                            body: `reservation_id=${reservationId}`,
                        });
                        const result = await response.json()
                        if (response.ok) {
                            Alert.alert('취소 완료', result.message, [
                                {
                                    text: '확인',
                                    onPress: getRecords,  // 예약 목록 다시 불러오기
                                },
                            ]);
                        } else {
                            console.error('예약 취소 실패');
                            Alert.alert('취소 실패', result.message, [
                                {
                                    text: '확인',
                                    onPress: getRecords,  // 예약 목록 다시 불러오기
                                },
                            ]);
                        }
                    },
                },
            ],
            { cancelable: true }
        );
    }

    const renderItem = ({item}) => {
        return (
            <Item
                item={item}
                //onPress={() => console.log('item pressed')}
                onCancelPress={cancelReservation}
                onVerifyPress={verifyLocation}
            />
        )
    }

    // useEffect(() => {
    //     if (user && user.user_id) { // user가 있고 user_id가 있을 때만 요청
    //         getRecords();
    //     }
    // }, [user]);

    useEffect(() => {   // debug
        console.log("Fetched records:", records); // 데이터 확인
    }, [records]);

    useFocusEffect(
        React.useCallback(() => {
            if (user && user.user_id) { // user가 있고 user_id가 있을 때만 요청
                getRecords();
            }
        }, [])
    )

    return (
  <View style={styles.container}>
    <FlatList
      data={records}
      renderItem={renderItem}
      keyExtractor={item => item.id.toString()}
      onRefresh={onRefresh}
      refreshing={refreshing}
    />
    {loading && (
        <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#ffffff" />
            <Text style={{ color: 'white', marginTop: 10, textAlign: 'center'
             }}>
  현재 위치 정보를 가져오는 중입니다.{"\n"}
  약 10초 내로 완료되니 잠시만 기다려주세요.
</Text>

        </View>
        )}
    </View>
    );

}
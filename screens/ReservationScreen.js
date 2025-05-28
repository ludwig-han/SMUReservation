import React, { useState, useEffect, useContext } from 'react';
import { View, Text, Pressable, Modal, ActivityIndicator } from 'react-native';
import { TouchableWithoutFeedback, Keyboard } from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { apiRequest } from '../utils/api';
import styles from '../constants/ReservationScreenStyles';
import { useReservationState } from '../hooks/useReservationState';
import { useAuth } from '../context/AuthContext';
import UserContext from '../context/UserContext';
import ReservationContext from '../context/ReservationContext';

export default function ReservationScreen() {
  const [isLoading, setIsLoading] = useState(false);

   // 드롭다운 오픈 상태, 선택값, 옵션 리스트 상태로 관리
  const [open, setOpen] = useState(false);
  const [selectedOptionValue, setSelectedOptionValue] = useState('0');  // 기본값은 문자열 '0'
  const [items, setItems] = useState([
    { label: '문화예술관 3층', value: '0', location: 'UB', floor: 3 },
    { label: '문화예술관 4층', value: '1', location: 'UB', floor: 4 },
    { label: '월해관 1층', value: '2', location: 'M', floor: 1 },
  ]);

  const { state, dispatch } = useAuth();
  const { user, setUser } = useContext(UserContext);
  const { availableRooms, setAvailableRooms } = useContext(ReservationContext);

  const {
    modalVisible,
    selectedRoom,
    timeslots,
    reservationInfo,
    reservedTimeslotKey,
    selectedTimeslotKey,
    reservationInfoGroup,
    passedTimeslotKey,
    setPassedTimeslotKey,
    setSelectedTimeslotKey,
    setModalVisible,
    setSelectedRoom,
    setReservedTimeslotKey,
    fetchRooms,
    loadReservationInfo,
    checkReservedTimeslotKey,
    initializeTimeslots,
    handleReservation,
    setReservationInfoGroup
  } = useReservationState(dispatch);

  const getUserdata = async () => {
    try {
      const response = await apiRequest('/validateToken', {});
      if (!response.ok) {
        dispatch({ type: 'SIGN_OUT' });
      } else {
        const result = await response.json();
        setUser(result);
      }
    } catch (e) {
      console.log('유저 정보를 불러오지 못했습니다.', e);
    }
  };

  useEffect(() => {
    fetchRooms();
    getUserdata();
  }, []);

  useEffect(() => {
    if (reservationInfo.length > 0) {
      checkReservedTimeslotKey();
    }
  }, [reservationInfo]);

  useEffect(() => {
    initializeTimeslots();
  }, [reservedTimeslotKey, passedTimeslotKey]);

  // 선택된 옵션 가져오기 (value가 문자열이므로 숫자 변환)
  const selectedOptionIndex = parseInt(selectedOptionValue, 10);
  const selectedOption = items.find(item => item.value === selectedOptionValue);

  // 필터링
  const filteredRooms = availableRooms.filter(
    (room) =>
      room.location === selectedOption.location &&
      room.floor === selectedOption.floor
  );


  return (
     <TouchableWithoutFeedback
      onPress={() => {
        if (open) setOpen(false); // 드롭다운이 열려 있으면 닫기
        Keyboard.dismiss();        // 키보드도 같이 닫히게 처리
      }}
    >
      <View style={styles.container}>
        {/* DropDownPicker */}
        <View style={styles.buildingPickerContainer}>
          <DropDownPicker
            open={open}
            value={selectedOptionValue}
            items={items}
            setOpen={setOpen}
            setValue={setSelectedOptionValue}
            setItems={setItems}
            placeholder="건물 및 층 선택"
            style={styles.picker}
            dropDownContainerStyle={{ backgroundColor: '#fff', zIndex: 1000 }}
          />
        </View>

        {/* 방 리스트 */}
        <View style={styles.roomListContainer}>
          {filteredRooms.length === 0 ? (
            <Text>예약 가능한 방이 없습니다.</Text>
          ) : (
            filteredRooms.map((room) => (
              <Pressable
                key={room.id}
                style={styles.room}
                onPress={() => loadReservationInfo(room.id)}
              >
                <Text style={styles.roomName}>
                  {room.number}
                  {room.name && room.name.trim() !== '' ? `\n(${room.name})` : ''}
                </Text>
              </Pressable>
            ))
          )}
        </View>

        {/* 예약 모달 */}
        <Modal visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
          <View style={styles.modalView}>
            <View style={styles.modalRoomNumberContainer}>
              <Text style={styles.modalRoomNumberText}>
                {availableRooms.find(room => room.id === selectedRoom)?.number}
                {(() => {
                  const name = availableRooms.find(room => room.id === selectedRoom)?.name;
                  return name && name.trim() !== '' ? ` (${name})` : '';
                })()}
              </Text>
            </View>

            <View style={styles.modalTimeslotContainer}>{timeslots}</View>

            <View style={styles.modalButtonContainer}>
              {!isLoading ? (
                <>
                  <Pressable
                    style={styles.modalButton}
                    onPress={async () => {
                      setIsLoading(true);
                      await handleReservation(user.user_id, selectedRoom);
                      setIsLoading(false);
                    }}
                  >
                    <Text>예약</Text>
                  </Pressable>

                  <Pressable
                    style={styles.modalButton}
                    onPress={() => {
                      setModalVisible(false);
                      setSelectedRoom(null);
                      setReservedTimeslotKey([]);
                      setSelectedTimeslotKey([]);
                      setReservationInfoGroup([]);
                    }}
                  >
                    <Text>닫기</Text>
                  </Pressable>

                  <Pressable
                    style={{ ...styles.modalButton, marginLeft: 40 }}
                    onPress={() => {
                      setReservedTimeslotKey([]);
                      setSelectedTimeslotKey([]);
                      setReservationInfoGroup([]);
                      loadReservationInfo(selectedRoom);
                    }}
                  >
                    <MaterialIcons name="refresh" size={24} color="black" />
                  </Pressable>
                </>
              ) : (
                <View style={styles.centered}>
                  <ActivityIndicator size="large" />
                </View>
              )}
            </View>
          </View>
        </Modal>
      </View>
    </TouchableWithoutFeedback>
  );
}

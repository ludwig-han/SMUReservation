import React, { useState, useEffect, useContext } from 'react';
import { View, Text, Pressable, Modal, ActivityIndicator, TouchableWithoutFeedback, Keyboard } from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { apiRequest } from '../utils/api';
import styles from '../constants/ReservationScreenStyles';
import { useReservationState } from '../hooks/useReservationState';
import { useAuth } from '../context/AuthContext';
import UserContext from '../context/UserContext';
import ReservationContext from '../context/ReservationContext';

// --- 건물별 배치 레이아웃 컴포넌트들 ---

function UB3RoomLayout({ rooms, onPressRoom }) {
  const leftRooms = rooms.filter(room =>
    ['UB309', 'UB310'].includes(room.number.toUpperCase())
  );
  const rightRooms = rooms.filter(room =>
    !['UB309', 'UB310'].includes(room.number.toUpperCase())
  );

  return (
    <View style={styles.rowContainer}>
      {/* 왼쪽 컨테이너 */}
      <View style={styles.leftContainer}>
        {leftRooms.map(room => (
          <Pressable key={room.id} style={styles.roomUB3} onPress={() => onPressRoom(room.id)}>
            <Text style={styles.roomName}>{room.number}</Text>
          </Pressable>
        ))}
      </View>

      {/* 오른쪽 컨테이너 */}
      <View style={styles.rightContainer}>
        {rightRooms.map(room => (
          <Pressable key={room.id} style={styles.roomUB3} onPress={() => onPressRoom(room.id)}>
            <Text style={styles.roomName}>{room.number}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}


function UB4RoomLayout({ rooms, onPressRoom }) {
  const leftNumbers = ['UB410', 'UB411', 'UB412', 'UB413', 'UB414'];
  const leftRooms = rooms.filter(room => leftNumbers.includes(room.number.toUpperCase()));
  const rightRooms = rooms.filter(room => !leftNumbers.includes(room.number.toUpperCase()));

  return (
    <View style={styles.rowContainer}>
      <View style={styles.leftContainer}>
        {leftRooms.map(room => (
          <Pressable key={room.id} style={styles.roomUB4} onPress={() => onPressRoom(room.id)}>
            <Text style={styles.roomName}>
              {room.number}
              {room.name && room.name.trim() !== '' ? `\n(${room.name})` : ''}
            </Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.rightContainer}>
        {rightRooms.map(room => (
          <Pressable key={room.id} style={styles.roomUB4} onPress={() => onPressRoom(room.id)}>
            <Text style={styles.roomName}>
              {room.number}
              {room.name && room.name.trim() !== '' ? `\n(${room.name})` : ''}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function M1RoomLayout({ rooms, onPressRoom }) {
  const leftNumbers = ['M033', 'M032', 'M031', 'M034', 'M035', 'M036'];
  const leftRooms = rooms.filter(room => leftNumbers.includes(room.number.toUpperCase()));
  const rightRooms = rooms.filter(room => !leftNumbers.includes(room.number.toUpperCase()));

  return (
    <View style={styles.rowContainer}>
      <View style={styles.leftContainer}>
        {leftRooms.map(room => (
          <Pressable key={room.id} style={styles.roomM1} onPress={() => onPressRoom(room.id)}>
            <Text style={styles.roomName}>{room.number}</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.rightContainer}>
        {rightRooms.map(room => (
          <Pressable key={room.id} style={styles.roomM1} onPress={() => onPressRoom(room.id)}>
            <Text style={styles.roomName}>{room.number}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}


function renderRoomLayout(location, floor, rooms, onPressRoom) {
  if (rooms.length === 0) {
    return <Text style={styles.noRoomsText}>예약 가능한 방이 없습니다.</Text>;
  }

  if (location === 'UB' && floor === 3) {
    return <UB3RoomLayout rooms={rooms} onPressRoom={onPressRoom} />;
  } else if (location === 'UB' && floor === 4) {
    return <UB4RoomLayout rooms={rooms} onPressRoom={onPressRoom} />;
  } else if (location === 'M' && floor === 1) {
    return <M1RoomLayout rooms={rooms} onPressRoom={onPressRoom} />;
  } else {
    // 기본 레이아웃
    return (
      <View style={styles.roomListContainer}>
        {rooms.map(room => (
          <Pressable
            key={room.id}
            style={styles.room}
            onPress={() => onPressRoom(room.id)}
          >
            <Text style={styles.roomName}>
              {room.number}
              {room.name && room.name.trim() !== '' ? `\n(${room.name})` : ''}
            </Text>
          </Pressable>
        ))}
      </View>
    );
  }
}

export default function ReservationScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedOptionValue, setSelectedOptionValue] = useState('0');
  const [items, setItems] = useState([
    { label: '문화예술관 3층', value: '0', location: 'UB', floor: 3 },
    { label: '문화예술관 4층', value: '1', location: 'UB', floor: 4 },
    { label: '월해관 1층', value: '2', location: 'M', floor: 1 },
  ]);

  const { state, dispatch } = useAuth();
  const { user, setUser } = useContext(UserContext);
  const { availableRooms } = useContext(ReservationContext);

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

  const selectedOption = items.find(item => item.value === selectedOptionValue);
  const filteredRooms = availableRooms.filter(
    (room) =>
      room.location === selectedOption.location &&
      room.floor === selectedOption.floor
  );

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

  return (
    <TouchableWithoutFeedback
      onPress={() => {
        if (open) setOpen(false);
        Keyboard.dismiss();
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

        {/* 건물/층별 방 리스트 렌더링 */}
        {renderRoomLayout(
          selectedOption.location,
          selectedOption.floor,
          filteredRooms,
          loadReservationInfo
        )}

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


import React, { useContext, useState } from "react";
import { Pressable, Alert, Modal, View, Text, ScrollView } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { MaterialIcons } from "@expo/vector-icons";
import Ionicons from '@expo/vector-icons/Ionicons';

import LoginScreen from './LoginScreen';
import ReservationScreen from './ReservationScreen';
import RegisterScreen from './RegisterScreen';
import RecordsScreen from './RecordsScreen';
import BoardScreenStack from "./BoardScreenStack";
//import BoardScreen from './BoardScreen';
import ProfileScreen from './ProfileScreen';
import SettingsScreen from './SettingsScreen';

import { useAuth } from "../context/AuthContext";
import { accessTokenKey, refreshTokenKey } from "../constants/keys";
import { apiRequest } from "../utils/api";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const helpContent = {
  usageRules: {
    title: "연습실 사용 수칙",
    description: [
      "8:20~22:00시까지 사용 가능.(M/U)",
      "1. 8:20 ~ 18:00시까지는 1인 최대 6시간, 한 방에 최대 3시간. (18:00 이후는 자유, 한 방에 최대 4시간 가능)",
      "2. 취식 금지 (모든 음식물, 음료(물 포함), 텀블러는 문 앞에 두고 연습)",
      "3. 연습실 이용 후 문을 열어 환기 시켜 주세요.",
      "4. 창문은 악보, 보면대 등으로 가리지 않습니다.",
      "5. 볼펜으로만 예약 가능합니다. (화이트 사용금지)",
      "6. 대학원생은 M관 연습실 (M032~M035)을 12:00-15:00시만 사용할 수 있습니다."
    ]
  },
  invalidRules: {
    title: "연습실 사용 무효 조항",
    description: [
      "1. 날짜, 학번, 이름, 시간 (AM, PM까지) 중 하나라도 적지 않은 경우 해당 예약 모두 무효",
      "2. 연필로 작성된 경우",
      "3. 학번 9자리와 이름을 구별할 수 없게 적은 경우",
      "4. 예약한 시간에서 14분 59초가 지난 경우 해당 예약 모두 무효",
      "5. 18시 이전 1인 최대 예약 시간인 6시간을 넘겼을 경우",
      "★ 이 경우 다른 사람이 예약 후 연습실 사용 가능"
    ]
  },
  oneWeekBanRules: {
    title: "연습실 일주일 정지 조항",
    description: [
      "1. 음식물을 연습실 내부에 들고 들어갔을 경우",
      "2. 연습실 창문을 조금이라도 가렸을 경우",
      "3. 사용정지 된 학생을 봤는데 그냥 넘어가는 경우",
      "4. 22:00이후 M/U관 연습실을 사용하는 경우"
    ]
  },
  threeMonthBanRules: {
    title: "연습실 3개월 사용 정지 조항",
    description: [
      "1. 휴학생, 졸업생이 연습실을 사용하는 경우",
      "2. 전날에 미리 기재한 경우",
      "3. 대리 예약 경우 (글씨체 대조를 통해 적발 시 해당 연습 모두 무효)",
      "4. 동일 인물이 두 개 이상의 방을 예약한 경우",
      "5. 음주, 흡연, 애정행각이 발각 될 경우(흡연은 지정된 장소에서)",
      "6. 연습실 사용 정지된 사람이 연습실을 사용하는 경우",
      "★ 위의 조항을 어길 시 게시"
    ]
  }
};


function TabsComponents() {
    const [modalVisible, setModalVisible] = useState(false);
    const {state, dispatch} = useAuth()
    
    async function logout() {
        const refreshToken = await AsyncStorage.getItem(refreshTokenKey);
        if (!refreshToken) {
            console.warn("Refresh token not found");
            return;
        }
        return (
          Alert.alert('⚠️', '로그아웃하시겠습니까?', [
            { text: '취소', onPress: () => {} },
            {
              text: '확인',
              onPress: async () => {
                try {
                    await apiRequest('/logout', {
                        method: 'POST',
                        headers: { Authorization: `Bearer ${refreshToken}`}    
                    })
                    console.log('로그아웃 성공');
                    
                } catch (e) {
                    console.error('서버 로그아웃 실패:', e);
                    // 서버 에러가 있어도 클라이언트는 로그아웃 진행함
                }

                await AsyncStorage.removeItem(accessTokenKey);
                await AsyncStorage.removeItem(refreshTokenKey);
                dispatch({type: 'SIGN_OUT'});
                setUser({});
              }
            }
          ])
        )
    }

    const renderHelpContent = () => (
        <ScrollView style={{ maxHeight: 400, paddingHorizontal: 10 }}>
            {Object.values(helpContent).map((section, index) => (
            <View key={index} style={{ marginBottom: 15 }}>
                <Text style={{ fontWeight: "bold", fontSize: 22, marginBottom: 8 }}>
                {section.title}
                </Text>
                {section.description.map((line, idx) => (
                <Text key={idx} style={{ fontSize: 18, lineHeight: 26 }}>
                    {line}
                </Text>
                ))}
            </View>
            ))}
        </ScrollView>
    );

    const renderHelpButton = () => (
        <Pressable onPress={() => setModalVisible(true)} style={{marginRight: 12}}>
            <MaterialIcons name="help" size={30} color='#007AFF'/>
        </Pressable>
    )

    const renderLogoutButton = () => (
        <Pressable onPress={logout} style={{ marginLeft: 10 }}>
          <MaterialIcons name="logout" size={24} color='#007AFF'/>
        </Pressable>
      );

    return (
        <>
            <Modal
                animationType="fade"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
                >
                <View style={{
                    flex: 1,
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: 'rgba(0, 0, 0, 0.3)'
                }}>
                    <View style={{
                        margin: 20,
                        backgroundColor: 'white',
                        borderRadius: 20,
                        padding: 20,
                        alignItems: 'center',
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.25,
                        shadowRadius: 4,
                        elevation: 5,
                        width: '90%',
                        maxHeight: '80%'
                    }}>
                    {renderHelpContent()}

                    <Pressable
                        style={{
                        backgroundColor: '#2196F3',
                        borderRadius: 10,
                        padding: 10,
                        marginTop: 15,
                        elevation: 2,
                        width: '100%'
                        }}
                        onPress={() => setModalVisible(false)}
                    >
                        <Text style={{ color: 'white', fontWeight: 'bold', textAlign: 'center' }}>
                        닫기
                        </Text>
                    </Pressable>
                    </View>
                </View>
                </Modal>
            <Tab.Navigator
                initialRouteName='Reservation'
                screenOptions={{
                    //tabBarActiveTintColor: "#4CAF50", // 활성 탭 아이콘 색상
                    tabBarInactiveTintColor: "#9E9E9E", // 비활성 탭 아이콘 색상
                    tabBarStyle: {
                    backgroundColor: "#FFFFFF",  // 탭 바 배경색
                    height: 60,
                    paddingTop: 5
                    },
                    headerLeft: renderLogoutButton, // 공통 헤더 왼쪽 버튼 설정
                }}>
                <Tab.Screen name="Reservation" component={ReservationScreen}
                    options={{
                        headerTitle: "예약",
                        tabBarIcon: ((color) => (
                            <MaterialIcons name="piano" size={24} color={color} />
                        )),
                        headerRight: renderHelpButton
                    }}
                s/>
                <Tab.Screen name="Records" component={RecordsScreen}
                    options={{
                        headerTitle: "기록",
                        tabBarIcon: ((color) => (
                            <MaterialIcons name="library-books" size={24} color={color} />
                        ))
                    }}
                />
                <Tab.Screen name="Board" component={BoardScreenStack}
                    options={{
                        headerTitle: "건의사항 게시판",
                        headerShown: false,
                        tabBarIcon: ((color) => (
                            <MaterialIcons name="dashboard" size={24} color={color} />
                        ))
                    }}
                />
                <Tab.Screen name="Profile" component={ProfileScreen}
                    options={{
                        headerTitle: "프로필",
                        tabBarIcon: ((color) => (
                            <Ionicons name="person" size={24} color={color} />
                        )),
                        // tabBarBadge: 5,
                        // tabBarBadgeStyle: {
                        //     fontSize: 10
                        // }
                    }}
                />
            </Tab.Navigator>
        </>
        
    )
}

export default function MainStack({ isAuthenticated }) {
    const [modalVisible, setModalVisible] = useState(false);
    return (
        <Stack.Navigator>
            {isAuthenticated ? (
                <>
                <Stack.Screen
                    name="Tabs"
                    component={TabsComponents}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="Settings"
                    component={SettingsScreen}
                    options={{ 
                        title: '설정',
                        headerBackTitle: '뒤로',
                    }}
                />
                </>
            ) : (
            <>
                <Stack.Screen
                    name="LoginScreen"
                    component={LoginScreen}
                    options={{
                        title: '로그인',
                        headerShown: false,
                    }}
                />
                <Stack.Screen
                    name="RegisterScreen"
                    component={RegisterScreen}
                    options={{ title: '회원가입' }}
                />
            </>
            )}
        </Stack.Navigator>
    );
}
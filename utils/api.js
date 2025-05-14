import AsyncStorage from "@react-native-async-storage/async-storage"
import { API_URL } from "@env"
import { accessTokenKey, refreshTokenKey } from "../constants/keys"
import { WAITING_TIME } from "../constants/settings";
import { Alert } from "react-native";
import RNRestart from 'react-native-restart'

//import { useAuth } from "../context/AuthContext";

let globalDispatch;

export function setGlobalDispatch(dispatch) {
    globalDispatch = dispatch;
}

export async function apiRequest(endpoint, options = {}) {
    if (!globalDispatch) {
        throw new Error('Global dispatch is not set.');
    }

    const token = await AsyncStorage.getItem(accessTokenKey);
    if (!token) {
        console.log('여기... token 불러오기 실패');
        
    globalDispatch({ type: 'SIGN_OUT' });
        return null;
    }

    const headers = {
        ...options.headers,
        Authorization: `Bearer ${token}`,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), WAITING_TIME);

    try {
        const response = await fetch(`${API_URL}/${endpoint}`, {
            ...options,
            headers,
            signal: controller.signal,
        });
        
        //console.log('이것이 response입니다.', response);  // FOR DEBUG
        clearTimeout(timeoutId);

        if ([401, 403].includes(response.status)) {
            // access token 만료 시 refresh token 시도
            const refreshed = await refreshAccessToken();
            if (refreshed) {
                const newToken = await AsyncStorage.getItem(accessTokenKey);
                const retryHeaders = {
                    ...options.headers,
                    Authorization: `Bearer ${newToken}`,
                };

                const response_retry = await fetch(`${API_URL}/${endpoint}`, {
                    ...options,
                    headers: retryHeaders,
                    signal: controller.signal,
                });
                console.log('refresh!!: '+ refreshed)
                return response_retry;
            } else {
                // refresh 실패 -> 로그아웃
                console.log('refresh 실패!!');
                await AsyncStorage.removeItem(accessTokenKey);
                globalDispatch({ type: 'SIGN_OUT' });
                return null;
            }
        }

        return response;
    } catch (e) {
        console.error('API request error:', e);
        // return Promise.reject({
        //     status: null,
        //     message: '서버가 응답하지 않습니다.'
        // });
        globalDispatch({type: 'SIGN_OUT'});
        console.log('apiRequest 함수에서 dispatch 이후에 실행이 되는지');
    } finally {
        clearTimeout(timeoutId);
    }
}

async function refreshAccessToken() {
  const refreshToken = await AsyncStorage.getItem(refreshTokenKey);
  if (!refreshToken) return false;

  try {
    const res = await fetch(`${API_URL}/refresh`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${refreshToken}`
      }
    });

    if (!res.ok) return false;

    const data = await res.json();
    const newToken = data.access_token;
    if (!newToken) return false;

    await AsyncStorage.setItem(accessTokenKey, newToken);
    return true;
  } catch (e) {
    console.error('Refresh token 실패:', e);
    return false;
  }
}

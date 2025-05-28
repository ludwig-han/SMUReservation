import { StyleSheet } from 'react-native';
import { SMU_COLORS } from "./colors";

const timeslot = {
    width: "20%",
    height: 20,
    margin: 5,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: SMU_COLORS.SMDarkgray
};



const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 10,
  },

  // 드롭다운 감싸는 컨테이너
  buildingPickerContainer: {
    height: 60,
    marginBottom: 15,
  },
  pickerContainer: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    overflow: 'hidden',
    marginVertical: 10,
    backgroundColor: '#fff',  // 배경색 추가
    },
  picker: {
    height: 50,
    width: '100%',
  },
  roomListContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  room: {
    backgroundColor: '#A5D8FF',
    padding: 13,
    borderRadius: 20,
    margin: 5,
    width: '30%',
    alignItems: 'center',
    justifyContent: 'center',
    height: 60
  },
  roomName: {
    fontSize: 13,
    textAlign: 'center',
    textAlignVertical: 'center', // Android 대응
  },
  noRoomsText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 30,
  },

  // --- modal 및 timeslot 관련 스타일 (건드리지 마세요) ---

  modalView: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        padding: 20,
        //borderRadius: 10, // 모서리를 부드럽게
        //shadowColor: "#000", // 약간의 그림자로 모달 강조
        //shadowOffset: { width: 0, height: 2 },
        //shadowOpacity: 0.25,
        //shadowRadius: 4,
        //elevation: 5, // Android에서 그림자 효과
    },
    modalTimeslotContainer: {
        //backgroundColor: '#F5F5F5',
        flex: 6,
        alignItems: "center",
        justifyContent: "center",
        paddingBottom: 30,
    },
    timeslotRow: {
        flexDirection: "row",
        //backgroundColor: "yellow"
    },
    timeslot: {
        ...timeslot,
        //backgroundColor: '#F5F5DC',
        backgroundColor: SMU_COLORS.yellow,
    },
    timeslotOccupied: {
        ...timeslot,
        backgroundColor: "#F28B82",
        //backgroundColor: SMU_COLORS.red,
    },
    timeslotSelected: {
        ...timeslot,
        //backgroundColor: "#C8F2C2",
        backgroundColor: SMU_COLORS.green,
    },
    timeslotPassed: {
        ...timeslot,
        //backgroundColor:"#E8EAED",
        backgroundColor: SMU_COLORS.SMLightgray,
    },
    modalButtonContainer: {
        flex: 1,
        flexDirection: "row",
        justifyContent: "space-around",
        alignItems: 'center',
        width: "90%",
        paddingBottom: 20,
    },
    modalButton: {
        //backgroundColor: "#A5D8FF",
        backgroundColor: SMU_COLORS.green,
        padding: 20,
        borderRadius: 20
    },
    modalRoomNumberContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalRoomNumberText: {
        fontSize: 30,
        marginTop: 35
    },
});

export default styles;

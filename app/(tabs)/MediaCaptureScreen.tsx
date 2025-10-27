import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import axios from "axios";
import { Audio, ResizeMode, Video } from "expo-av";
import { CameraView } from "expo-camera";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Button,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const CLOUD_NAME: string = "dh775j9ez";
const UPLOAD_PRESET: string = "my-react-native-app";

const DEFAULT_CLOUD_NAME: string = "YOUR_CLOUD_NAME";
const DEFAULT_UPLOAD_PRESET: string = "YOUR_UPLOAD_PRESET";

type FlashMode = "on" | "off" | "auto";

export default function MediaCaptureScreen() {
  const [appState, setAppState] = useState<"selection" | "camera" | "preview">(
    "selection"
  );

  const [takenMedia, setTakenMedia] = useState<{
    uri: string;
    type: "image" | "video";
  } | null>(null);

  const [cameraMode, setCameraMode] = useState<"picture" | "video">("picture");
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  const [cameraFacing, setCameraFacing] = useState<"front" | "back">("back");
  const [flashMode, setFlashMode] = useState<FlashMode>("off");

  const toggleCameraFacing = () => {
    setCameraFacing((prev) => (prev === "back" ? "front" : "back"));
  };

  const cycleFlashMode = () => {
    setFlashMode((prev) => {
      if (prev === "off") return "on";
      if (prev === "on") return "auto";
      return "off";
    });
  };

  const getFlashIcon = () => {
    if (flashMode === "on") return "flash-on";
    if (flashMode === "auto") return "flash-auto";
    return "flash-off";
  };

  const handlePressCamera = async () => {
    const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
    const audioStatus = await Audio.requestPermissionsAsync();

    if (cameraStatus.status !== "granted" || audioStatus.status !== "granted") {
      Alert.alert(
        "Đã từ chối",
        "Bạn cần cấp quyền camera và microphone để sử dụng chức năng này."
      );
      return;
    }
    setAppState("camera");
  };

  const handlePressLibrary = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Đã từ chối",
        "Bạn cần cấp quyền thư viện để sử dụng chức năng này."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets[0]) {
      const asset = result.assets[0];
      let type: "image" | "video" = "image";

      if (asset.type === "video" || asset.type === "pairedVideo") {
        type = "video";
      } else {
        type = "image";
      }
      setTakenMedia({
        uri: asset.uri,
        type,
      });
      setAppState("preview");
    }
  };

  const toggleCameraMode = () => {
    setCameraMode((prev) => (prev === "picture" ? "video" : "picture"));
  };

  const handleRecordVideo = async () => {
    if (!cameraRef.current) return;

    if (isRecording) {
      cameraRef.current.stopRecording();
      setIsRecording(false);
    } else {
      setIsRecording(true);
      try {
        const result = await cameraRef.current.recordAsync();
        if (result?.uri) {
          setTakenMedia({ uri: result.uri, type: "video" });
          setAppState("preview");
        } else {
          Alert.alert("Lỗi", "Không nhận được video.");
        }
      } catch (e) {
        console.error("Lỗi khi quay video:", e);
        Alert.alert("Lỗi", "Không thể quay video.");
      } finally {
        setIsRecording(false);
      }
    }
  };

  const handleTakePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync();
        if (photo && photo.uri) {
          setTakenMedia({ uri: photo.uri, type: "image" });
          setAppState("preview");
        }
      } catch (e) {
        console.error("Lỗi khi chụp ảnh:", e);
        Alert.alert("Lỗi", "Không thể chụp ảnh.");
      }
    }
  };

  const handleRetake = () => {
    setTakenMedia(null);
    setAppState("selection");
    setCameraMode("picture");
    setIsRecording(false);
  };

  const handleContinue = async () => {
    if (!takenMedia) return;

    if (
      CLOUD_NAME === DEFAULT_CLOUD_NAME ||
      UPLOAD_PRESET === DEFAULT_UPLOAD_PRESET
    ) {
      Alert.alert(
        "Lỗi cấu hình",
        "Vui lòng điền CLOUD_NAME và UPLOAD_PRESET trong code App.jsx"
      );
      return;
    }

    setIsUploading(true);

    let finalUri = takenMedia.uri;
    let fileType = "";

    try {
      if (takenMedia.type === "image") {
        console.log("Đang nén ảnh...");
        const manipResult = await ImageManipulator.manipulateAsync(
          takenMedia.uri,
          [{ resize: { width: 1080 } }],
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
        );
        finalUri = manipResult.uri;
        fileType = "image/jpeg";
        console.log("Nén ảnh thành công:", finalUri);
      } else {
        finalUri = takenMedia.uri;
        fileType = "video/mp4";
      }

      const formData = new FormData();
      const uriParts = finalUri.split("/");
      const fileName = uriParts[uriParts.length - 1];

      formData.append("file", {
        uri: finalUri,
        name: fileName,
        type: fileType,
      } as any);
      formData.append("upload_preset", UPLOAD_PRESET);

      const resourceType = takenMedia.type === "image" ? "image" : "video";
      const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`;

      const response = await axios.post(url, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data && response.data.secure_url) {
        console.log("Upload thành công!");
        console.log("Secure URL:", response.data.secure_url);
        Alert.alert("Upload thành công!");
        handleRetake();
      } else {
        Alert.alert("Upload thất bại! Vui lòng thử lại.");
      }
    } catch (error) {
      console.error("Lỗi khi xử lý hoặc upload:", error);
      Alert.alert("Upload thất bại! Vui lòng thử lại.");
    } finally {
      setIsUploading(false);
    }
  };

  if (appState === "selection") {
    return (
      <View style={styles.selectionContainer}>
        <Text style={styles.title}>Chọn một tùy chọn</Text>
        <View style={styles.buttonGap}>
          <Button title="Chụp ảnh / Quay Video" onPress={handlePressCamera} />
        </View>
        <View style={styles.buttonGap}>
          <Button title="Chọn từ Thư viện" onPress={handlePressLibrary} />
        </View>
      </View>
    );
  }

  if (appState === "camera") {
    return (
      <View style={styles.container}>
        <CameraView
          style={styles.camera}
          facing={cameraFacing}
          ref={cameraRef}
          mode={cameraMode}
          flash={flashMode}
        />

        <View style={styles.flashButtonContainer}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={cycleFlashMode}
            disabled={isRecording || cameraMode === "video"}
          >
            <MaterialIcons
              name={getFlashIcon()}
              size={30}
              color={cameraMode === "video" ? "gray" : "white"}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.flipButtonContainer}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={toggleCameraFacing}
            disabled={isRecording}
          >
            <MaterialIcons name="flip-camera-ios" size={30} color="white" />
          </TouchableOpacity>
        </View>

        <View style={styles.modeToggleButtonContainer}>
          <TouchableOpacity
            style={styles.modeToggleButton}
            onPress={toggleCameraMode}
            disabled={isRecording}
          >
            <MaterialIcons
              name={cameraMode === "picture" ? "videocam" : "photo-camera"}
              size={30}
              color="white"
            />
            <Text style={styles.modeToggleText}>
              {cameraMode === "picture" ? "Video" : "Ảnh"}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.captureButton,
              isRecording && styles.captureButtonRecording,
            ]}
            onPress={
              cameraMode === "picture" ? handleTakePicture : handleRecordVideo
            }
          >
            <Ionicons
              name={
                cameraMode === "picture"
                  ? "camera"
                  : isRecording
                  ? "stop"
                  : "videocam"
              }
              size={40}
              color={isRecording ? "red" : "black"}
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (appState === "preview" && takenMedia) {
    return (
      <View style={styles.container}>
        {takenMedia.type === "image" ? (
          <Image source={{ uri: takenMedia.uri }} style={styles.previewImage} />
        ) : (
          <Video
            source={{ uri: takenMedia.uri }}
            style={styles.previewImage}
            useNativeControls
            resizeMode={ResizeMode.CONTAIN}
            isLooping
            shouldPlay
          />
        )}

        <View style={styles.previewButtonContainer}>
          <TouchableOpacity onPress={handleRetake} disabled={isUploading}>
            <Text style={styles.previewButtonText}>Chụp lại / Hủy</Text>
          </TouchableOpacity>

          {isUploading ? (
            <ActivityIndicator size="large" color="#fff" />
          ) : (
            <TouchableOpacity onPress={handleContinue}>
              <Text style={styles.previewButtonText}>Tiếp tục</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.selectionContainer}>
      <ActivityIndicator size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    backgroundColor: "#000",
  },
  camera: {
    flex: 1,
  },
  buttonContainer: {
    position: "absolute",
    bottom: 50,
    alignSelf: "center",
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#ddd",
  },
  captureButtonRecording: {
    backgroundColor: "#fff",
    borderColor: "red",
    borderWidth: 4,
  },
  selectionContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5ff",
    padding: 20,
    zIndex: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  buttonGap: {
    marginVertical: 10,
    width: "80%",
  },
  previewImage: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  previewButtonContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
    paddingVertical: 30,
  },
  previewButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  modeToggleButtonContainer: {
    position: "absolute",
    top: 60,
    right: 20,
    zIndex: 20,
  },
  modeToggleButton: {
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  modeToggleText: {
    color: "white",
    marginLeft: 5,
    fontWeight: "bold",
  },
  controlButton: {
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 10,
    borderRadius: 30,
  },
  flashButtonContainer: {
    position: "absolute",
    top: 60,
    left: 20,
    zIndex: 20,
  },
  flipButtonContainer: {
    position: "absolute",
    top: 60,
    left: 90,
    zIndex: 20,
  },
});

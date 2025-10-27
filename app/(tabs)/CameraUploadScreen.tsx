import { useEffect, useRef, useState } from "react";
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

import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { CameraView } from "expo-camera";
import * as ImagePicker from "expo-image-picker";

const CLOUD_NAME: string = "dh775j9ez";
const UPLOAD_PRESET: string = "my-react-native-app";

const DEFAULT_CLOUD_NAME: string = "YOUR_CLOUD_NAME";
const DEFAULT_UPLOAD_PRESET: string = "YOUR_UPLOAD_PRESET";

export default function CameraUploadScreen() {
  const [permissionStatus, setPermissionStatus] =
    useState<ImagePicker.PermissionStatus | null>(null);

  const [takenPhotoUri, setTakenPhotoUri] = useState<string | null>(null);

  const [isUploading, setIsUploading] = useState(false);

  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    const getInitialStatus = async () => {
      const { status } = await ImagePicker.getCameraPermissionsAsync();
      setPermissionStatus(status);
      console.log("Trạng thái ban đầu:", status);
    };

    getInitialStatus();
  }, []);

  const handlePress = async () => {
    console.log("Đang yêu cầu quyền...");
    const { status } = await ImagePicker.requestCameraPermissionsAsync();

    if (status === "granted") {
      Alert.alert("Thành công", "Bạn đã cấp quyền truy cập camera");
    } else if (status === "denied") {
      Alert.alert("Đã từ chối", "Bạn đã từ chối quyền truy cập camera");
    }
    setPermissionStatus(status);
  };

  const handleTakePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync();
        if (photo && photo.uri) {
          setTakenPhotoUri(photo.uri);
          console.log("Ảnh đã chụp:", photo.uri);
        }
      } catch (e) {
        console.error("Lỗi khi chụp ảnh:", e);
        Alert.alert("Lỗi", "Không thể chụp ảnh.");
      }
    }
  };

  const handleRetake = () => {
    setTakenPhotoUri(null);
  };

  const handleContinue = async () => {
    if (!takenPhotoUri) return;

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

    const formData = new FormData();

    const uriParts = takenPhotoUri.split("/");
    const fileName = uriParts[uriParts.length - 1];
    const fileType = fileName.endsWith(".png") ? "image/png" : "image/jpeg";

    formData.append("file", {
      uri: takenPhotoUri,
      name: fileName,
      type: fileType,
    } as any);

    formData.append("upload_preset", UPLOAD_PRESET);

    const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

    try {
      const response = await axios.post(url, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data && response.data.secure_url) {
        console.log("Upload thành công!");
        console.log("Secure URL:", response.data.secure_url);
        Alert.alert("Upload thành công!");
        setTakenPhotoUri(null);
      } else {
        Alert.alert("Upload thất bại! Vui lòng thử lại.");
      }
    } catch (error) {
      console.error("Lỗi khi upload:", error);
      Alert.alert("Upload thất bại! Vui lòng thử lại.");
    } finally {
      setIsUploading(false);
    }
  };

  if (permissionStatus === null) {
    return (
      <View style={styles.permissionContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (permissionStatus !== "granted") {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.title}>Yêu cầu quyền Camera</Text>
        <Button title="YÊU CẦU QUYỀN CAMERA" onPress={handlePress} />
        <Text style={styles.statusText}>Trạng thái: {permissionStatus}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {!takenPhotoUri ? (
        <>
          <CameraView style={styles.camera} facing="back" ref={cameraRef} />
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.captureButton}
              onPress={handleTakePicture}
            >
              <Ionicons name="camera" size={40} color="black" />
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <>
          <Image source={{ uri: takenPhotoUri }} style={styles.previewImage} />
          <View style={styles.previewButtonContainer}>
            <TouchableOpacity onPress={handleRetake} disabled={isUploading}>
              <Text style={styles.previewButtonText}>Chụp lại</Text>
            </TouchableOpacity>

            {isUploading ? (
              <ActivityIndicator size="large" color="#fff" />
            ) : (
              <TouchableOpacity onPress={handleContinue}>
                <Text style={styles.previewButtonText}>Tiếp tục</Text>
              </TouchableOpacity>
            )}
          </View>
        </>
      )}
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
  permissionContainer: {
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
  statusText: {
    marginTop: 20,
    fontSize: 16,
    color: "#333",
  },
  previewImage: {
    flex: 1,
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
});

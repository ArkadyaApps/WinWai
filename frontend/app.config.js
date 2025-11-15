module.exports = {
  expo: {
    name: "WinWai",
    slug: "winwai-raffle",
    owner: "arkadyaapps",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "winwai",
    userInterfaceStyle: "light",
    newArchEnabled: false,
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.winwai.raffle"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#FFD700"
      },
      package: "com.winwai.raffle",
      permissions: [
        "android.permission.INTERNET",
        "android.permission.ACCESS_NETWORK_STATE",
        "com.google.android.gms.permission.AD_ID",
        "android.permission.ACCESS_FINE_LOCATION",
        "android.permission.ACCESS_COARSE_LOCATION"
      ],
      intentFilters: [
        {
          action: "VIEW",
          autoVerify: true,
          data: [
            {
              scheme: "com.winwai.raffle",
              host: "oauth2redirect"
            }
          ],
          category: ["BROWSABLE", "DEFAULT"]
        }
      ]
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.png"
    },
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          imageWidth: "80%",
          resizeMode: "contain",
          backgroundColor: "#FFD700"
        }
      ],
      [
        "expo-build-properties",
        {
          android: {
            compileSdkVersion: 34,
            targetSdkVersion: 34,
            minSdkVersion: 23,
            buildToolsVersion: "34.0.0"
          }
        }
      ]
    ],
    experiments: {
      typedRoutes: true
    },
    extra: {
      eas: {
        projectId: "019dd289-3f32-4930-9048-725d49bcb28a"
      },
      backendUrl: process.env.EXPO_PUBLIC_BACKEND_URL || "https://lucky-draw-82.preview.emergentagent.com",
      googlePlacesApiKey: process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY || "AIzaSyABPgpsqHXCBwTv6BGUnOjk7WYzrNw24Ws"
    }
  },
  "react-native-google-mobile-ads": {
    "android_app_id": "ca-app-pub-3486145054830108~1319311942",
    "ios_app_id": "ca-app-pub-3486145054830108~3969526019"
  }
};

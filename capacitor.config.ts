import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.wrasse.otisaprod',
  appName: 'Otis Aprod',
  webDir: 'dist',
  
  // 🔥 FONTOS: Éles buildhez a teljes 'server' blokkot töröld ki vagy kommenteld ki!
  // Így az app a 'dist' mappából tölti be a fájlokat (offline-first működés).
  /* server: {
    url: 'http://192.168.50.183:5000',
    androidScheme: 'http',
    cleartext: true,
  }, 
  */
 
  // Opcionális: Élesben a https séma szebb, de nem kötelező
  server: {
    androidScheme: 'https'
  },

  plugins: {
    StatusBar: {
      overlaysWebView: true,
    },
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: "#0d1117",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
  },
};

export default config;
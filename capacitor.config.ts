import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.wrasse.otisaprod',
  appName: 'Otis Aprod',
  webDir: 'dist',
  
  server: {
    // 🔥 DEVELOPMENT: Telefonon való teszteléshez
    // PRODUCTION: Kommenteld ki ezt a sort build előtt!
    url: 'http://192.168.50.183:5000',
    
    // HTTP engedélyezése (nem HTTPS)
    androidScheme: 'http',
    cleartext: true,
  },
};

export default config;
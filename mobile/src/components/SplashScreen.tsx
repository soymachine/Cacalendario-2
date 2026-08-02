import { useEffect, useRef, useState } from 'react';
import { Animated, Image, StyleSheet } from 'react-native';
import { getDoctorImage } from '../lib/preferences';
import { D } from '../lib/design';

interface SplashScreenProps {
  onDone: () => void;
}

export default function SplashScreen({ onDone }: SplashScreenProps) {
  const opacity = useRef(new Animated.Value(1)).current;
  const [done, setDone] = useState(false);
  const doctorImage = getDoctorImage();

  useEffect(() => {
    const showTimer = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 700, useNativeDriver: true }).start();
    }, 1400);
    const doneTimer = setTimeout(() => {
      setDone(true);
      onDone();
    }, 2200);
    return () => {
      clearTimeout(showTimer);
      clearTimeout(doneTimer);
    };
  }, [onDone, opacity]);

  if (done) return null;

  return (
    <Animated.View style={[styles.wrapper, { opacity }]}>
      <Image
        source={doctorImage ? { uri: doctorImage } : require('../assets/fluxia-logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: D.bg,
  },
  logo: {
    width: 180,
    height: 90,
  },
});

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Easing,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BRAND, FONT } from '../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface LoadingScreenProps {
  onFinish: () => void;
}

export function LoadingScreen({ onFinish }: LoadingScreenProps) {
  const logoScale = useRef(new Animated.Value(0.3)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoGlow = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(20)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const taglineTranslateY = useRef(new Animated.Value(15)).current;
  const partnerOpacity = useRef(new Animated.Value(0)).current;
  const progressWidth = useRef(new Animated.Value(0)).current;
  const progressOpacity = useRef(new Animated.Value(0)).current;
  const shimmerTranslate = useRef(new Animated.Value(-SCREEN_WIDTH)).current;
  const ringScale = useRef(new Animated.Value(0.8)).current;
  const ringOpacity = useRef(new Animated.Value(0)).current;
  const ring2Scale = useRef(new Animated.Value(0.8)).current;
  const ring2Opacity = useRef(new Animated.Value(0)).current;
  const dotScale1 = useRef(new Animated.Value(0)).current;
  const dotScale2 = useRef(new Animated.Value(0)).current;
  const dotScale3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(200),
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    const pulseRing = (scale: Animated.Value, opacity: Animated.Value, delay: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(scale, {
              toValue: 1.9,
              duration: 1500,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0.35,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.sequence([
              Animated.delay(300),
              Animated.timing(opacity, {
                toValue: 0,
                duration: 1200,
                useNativeDriver: true,
              }),
            ]),
          ]),
          Animated.timing(scale, { toValue: 0.8, duration: 0, useNativeDriver: true }),
        ])
      ).start();
    };

    pulseRing(ringScale, ringOpacity, 800);
    pulseRing(ring2Scale, ring2Opacity, 1600);

    Animated.loop(
      Animated.sequence([
        Animated.timing(logoGlow, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(logoGlow, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.sequence([
      Animated.delay(600),
      Animated.parallel([
        Animated.timing(titleOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.spring(titleTranslateY, {
          toValue: 0,
          friction: 8,
          tension: 50,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    Animated.sequence([
      Animated.delay(900),
      Animated.parallel([
        Animated.timing(taglineOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(taglineTranslateY, {
          toValue: 0,
          friction: 8,
          tension: 50,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    Animated.sequence([
      Animated.delay(1100),
      Animated.timing(partnerOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();

    Animated.sequence([
      Animated.delay(1100),
      Animated.timing(progressOpacity, { toValue: 1, duration: 300, useNativeDriver: false }),
    ]).start();

    Animated.timing(progressWidth, {
      toValue: 1,
      duration: 2200,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: false,
    }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerTranslate, {
          toValue: SCREEN_WIDTH,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.delay(800),
        Animated.timing(shimmerTranslate, {
          toValue: -SCREEN_WIDTH,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();

    const animateDot = (dot: Animated.Value, delay: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: 1,
            duration: 1200,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0.3,
            duration: 1200,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    animateDot(dotScale1, 200);
    animateDot(dotScale2, 600);
    animateDot(dotScale3, 1000);

    const timer = setTimeout(onFinish, 2800);
    return () => clearTimeout(timer);
  }, [onFinish]);

  const glowScale = logoGlow.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.06],
  });

  const progressWidthInterp = progressWidth.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['0%', '65%', '100%'],
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0A1628', '#0F1F35', '#132238', '#0A1628']}
        locations={[0, 0.35, 0.7, 1]}
        style={StyleSheet.absoluteFill}
      />

      <Animated.View style={[styles.ambientDot, styles.dot1, { opacity: dotScale1 }]} />
      <Animated.View style={[styles.ambientDot, styles.dot2, { opacity: dotScale2 }]} />
      <Animated.View style={[styles.ambientDot, styles.dot3, { opacity: dotScale3 }]} />
      <Animated.View style={[styles.ambientDot, styles.dot4, { opacity: dotScale1 }]} />
      <Animated.View style={[styles.ambientDot, styles.dot5, { opacity: dotScale3 }]} />

      <View style={styles.content}>
        <View style={styles.logoArea}>
          <Animated.View
            style={[
              styles.ring,
              { transform: [{ scale: ringScale }], opacity: ringOpacity },
            ]}
          />
          <Animated.View
            style={[
              styles.ring,
              styles.ring2,
              { transform: [{ scale: ring2Scale }], opacity: ring2Opacity },
            ]}
          />

          <Animated.View
            style={[
              styles.logoContainer,
              {
                transform: [{ scale: logoScale }, { scale: glowScale }],
                opacity: logoOpacity,
              },
            ]}
          >
            <LinearGradient
              colors={['#1E3A5F', '#132238', '#1E3A5F']}
              style={styles.logoGradient}
            >
              <Image
                source={require('../../assets/icon.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </LinearGradient>

            <Animated.View
              style={[
                styles.shimmerOverlay,
                { transform: [{ translateX: shimmerTranslate }] },
              ]}
            >
              <LinearGradient
                colors={['transparent', 'rgba(37,211,102,0.2)', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.shimmerGradient}
              />
            </Animated.View>
          </Animated.View>
        </View>

        <Animated.View
          style={{
            opacity: titleOpacity,
            transform: [{ translateY: titleTranslateY }],
          }}
        >
          <Text style={styles.titleText}>
            Meeting<Text style={styles.titleAccent}>Pro</Text>
          </Text>
        </Animated.View>

        <Animated.View
          style={{
            opacity: taglineOpacity,
            transform: [{ translateY: taglineTranslateY }],
            marginTop: 10,
          }}
        >
          <Text style={styles.tagline}>VILATECH</Text>
        </Animated.View>

        <Animated.View style={{ opacity: partnerOpacity, marginTop: 8 }}>
          <Text style={styles.partnerLine}>Meeting Pro</Text>
        </Animated.View>

        <Animated.View style={[styles.progressContainer, { opacity: progressOpacity }]}>
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressFill, { width: progressWidthInterp as unknown as `${number}%` }]}>
              <LinearGradient
                colors={[BRAND.whatsapp, '#34D399', BRAND.accent]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
          </View>
          <Text style={styles.progressLabel}>Preparing your transcription workspace…</Text>
        </Animated.View>
      </View>

      <Animated.View style={[styles.bottomBrand, { opacity: partnerOpacity }]}>
        <View style={styles.bottomLine} />
        <Text style={styles.bottomText}>WhatsApp · Calls · Meetings</Text>
        <View style={styles.bottomLine} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A1628',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  ambientDot: {
    position: 'absolute',
    borderRadius: 50,
    backgroundColor: BRAND.whatsapp,
  },
  dot1: { width: 4, height: 4, top: '15%', left: '20%' },
  dot2: { width: 3, height: 3, top: '25%', right: '15%', backgroundColor: BRAND.accent },
  dot3: { width: 5, height: 5, top: '65%', left: '10%' },
  dot4: { width: 3, height: 3, top: '75%', right: '25%', backgroundColor: BRAND.accent },
  dot5: { width: 4, height: 4, top: '45%', right: '8%' },
  logoArea: {
    width: 160,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 36,
  },
  ring: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1.5,
    borderColor: BRAND.whatsapp,
  },
  ring2: {
    borderColor: 'rgba(99, 102, 241, 0.5)',
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 32,
    overflow: 'hidden',
    shadowColor: BRAND.whatsapp,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 24,
    elevation: 16,
  },
  logoGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(37, 211, 102, 0.25)',
  },
  logoImage: {
    width: 88,
    height: 88,
    borderRadius: 20,
  },
  shimmerOverlay: {
    ...StyleSheet.absoluteFill,
    width: 80,
  },
  shimmerGradient: { flex: 1 },
  titleText: {
    fontSize: 40,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  titleAccent: {
    color: BRAND.whatsapp,
  },
  tagline: {
    fontSize: FONT.sm,
    color: 'rgba(255, 255, 255, 0.75)',
    letterSpacing: 4,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  partnerLine: {
    fontSize: FONT.xs,
    color: 'rgba(99, 102, 241, 0.85)',
    letterSpacing: 3,
    textTransform: 'uppercase',
    fontWeight: '500',
    textAlign: 'center',
  },
  progressContainer: {
    width: '82%',
    alignItems: 'center',
    marginTop: 52,
  },
  progressTrack: {
    width: '100%',
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.35)',
    marginTop: 14,
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  bottomBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 52,
    gap: 12,
  },
  bottomLine: {
    width: 32,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  bottomText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.25)',
    letterSpacing: 2,
    textTransform: 'uppercase',
    fontWeight: '500',
  },
});

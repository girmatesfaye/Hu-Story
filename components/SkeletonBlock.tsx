import React, { useEffect, useRef } from "react";
import { Animated, View } from "react-native";

type SkeletonBlockProps = {
  className: string;
};

export function SkeletonBlock({ className }: SkeletonBlockProps) {
  const opacity = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 850,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.45,
          duration: 850,
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [opacity]);

  return (
    <Animated.View style={{ opacity }}>
      <View className={`bg-slate-200 dark:bg-slate-800 ${className}`} />
    </Animated.View>
  );
}

import React from "react";
import { Text, TextProps } from "react-native";

type AppTextProps = TextProps & {
  children: React.ReactNode;
  className?: string;
};

export function AppText({ className, children, ...props }: AppTextProps) {
  const combinedClassName = ["font-lexend", className]
    .filter(Boolean)
    .join(" ");

  return (
    <Text {...props} className={combinedClassName}>
      {children}
    </Text>
  );
}

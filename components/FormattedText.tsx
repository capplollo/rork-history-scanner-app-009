import React from 'react';
import { Text, TextStyle } from 'react-native';

interface FormattedTextProps {
  children: string;
  style?: TextStyle;
  boldStyle?: TextStyle;
}

export default function FormattedText({ children, style, boldStyle }: FormattedTextProps) {
  // Split text by **bold** markers
  const parts = children.split(/\*\*(.*?)\*\*/g);
  
  return (
    <Text style={style}>
      {parts.map((part, index) => {
        // Every odd index is bold text (inside **)
        const isBold = index % 2 === 1;
        return (
          <Text
            key={index}
            style={isBold ? [style, boldStyle || { fontWeight: 'bold' }] : undefined}
          >
            {part}
          </Text>
        );
      })}
    </Text>
  );
}
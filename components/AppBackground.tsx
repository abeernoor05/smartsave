import { StyleSheet, View } from 'react-native';

import { LinearGradient } from '@/components/ui/primitives/LinearGradient';

/** Smooth navy-to-indigo canvas inspired by the filing artwork, without imagery. */
export function AppBackground() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <LinearGradient
        colors={['#080A14', '#0E1224', '#171D3A', '#293258']}
        locations={[0, 0.34, 0.7, 1]}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={['rgba(117,103,244,0)', 'rgba(117,103,244,0.04)', 'rgba(95,108,190,0.13)']}
        end={{ x: 0.82, y: 1 }}
        locations={[0, 0.6, 1]}
        start={{ x: 0.18, y: 0 }}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

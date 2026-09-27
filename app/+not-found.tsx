import { Link, Stack } from 'expo-router';
import { Typography } from 'heroui-native';
import { View } from 'react-native';

export default function NotFoundScreen() {
  return (
    <View className="bg-background flex-1 items-center justify-center gap-3 p-6">
      <Stack.Screen options={{ title: 'Not found' }} />
      <Typography type="body" weight="semibold">
        This screen does not exist.
      </Typography>
      <Link href="/">
        <Typography type="body-sm" weight="semibold" className="text-accent">
          Go to your folders
        </Typography>
      </Link>
    </View>
  );
}

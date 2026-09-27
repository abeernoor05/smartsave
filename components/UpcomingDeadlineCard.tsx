import { router } from 'expo-router';
import { ArrowRight } from 'lucide-react-native';
import { Typography } from 'heroui-native';
import { Image, ImageBackground, Pressable, View } from 'react-native';

import { COLORS } from '@/lib/colors';

interface UpcomingDeadlineCardProps {
  count: number;
  dueThisWeek: number;
}

/** Dark dashboard callout that opens the complete deadline list. */
export function UpcomingDeadlineCard({ count, dueThisWeek }: UpcomingDeadlineCardProps) {
  const countLabel = count === 1 ? '1 upcoming deadline' : `${count} upcoming deadlines`;
  const weekLabel =
    dueThisWeek === 0
      ? 'Nothing due in the next 7 days'
      : dueThisWeek === 1
        ? '1 is due in the next 7 days'
        : `${dueThisWeek} are due in the next 7 days`;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${countLabel}. View all deadlines`}
      onPress={() => router.push('/deadlines')}
      style={({ pressed }) => ({ opacity: pressed ? 0.88 : 1 })}
    >
      <View className="border-border bg-surface/95 overflow-hidden rounded-xl border">
        <ImageBackground
          source={require('@/assets/deadline-approaching.png')}
          resizeMode="cover"
          style={{ width: '100%', height: 112 }}
          imageStyle={{ opacity: 0.82 }}
        >
          <View className="size-full items-center justify-end bg-black/15">
            <View className="bg-surface border-border -mb-7 size-[68px] items-center justify-center rounded-full border p-1">
              <Image
                source={require('@/assets/deadline-hourglass.png')}
                accessibilityLabel="Hourglass with sand running out"
                resizeMode="cover"
                style={{ width: 58, height: 58, borderRadius: 29 }}
              />
            </View>
          </View>
        </ImageBackground>

        <View className="items-center gap-2 px-5 pt-10 pb-5">
          <Typography type="body" weight="bold" align="center">
            {count > 0 ? countLabel : 'No upcoming deadlines'}
          </Typography>
          <Typography type="body-xs" color="muted" align="center">
            {count > 0 ? weekLabel : 'New dated reminders will appear here.'}
          </Typography>
          <View className="mt-2 flex-row items-center gap-2 rounded-lg bg-white px-4 py-2.5">
            <Typography type="body-sm" weight="semibold" style={{ color: COLORS.focalInk }}>
              View deadlines
            </Typography>
            <ArrowRight size={16} color={COLORS.focalInk} />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

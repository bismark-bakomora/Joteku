import { colors, radii, sizes, spacing, typography } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  FlatList,
  Image,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GalleryPhoto } from './venuePhotos';

type PhotoGalleryProps = {
  photos: GalleryPhoto[];
};

export function PhotoGallery({ photos }: PhotoGalleryProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [viewingIndex, setViewingIndex] = useState(0);
  const [stageHeight, setStageHeight] = useState(0);
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const open = (index: number) => {
    setViewingIndex(index);
    setOpenIndex(index);
  };

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    setViewingIndex(Math.min(Math.max(index, 0), photos.length - 1));
  };

  return (
    <>
      <View style={styles.grid}>
        {photos.map((photo, index) => (
          <Pressable
            accessibilityHint="Opens the photo full screen"
            accessibilityLabel={photo.caption}
            accessibilityRole="imagebutton"
            key={photo.key}
            onPress={() => open(index)}
            style={styles.tile}
          >
            <Image resizeMode="cover" source={photo.source} style={styles.thumb} />
          </Pressable>
        ))}
      </View>

      <Modal
        animationType="fade"
        onRequestClose={() => setOpenIndex(null)}
        statusBarTranslucent
        visible={openIndex !== null}
      >
        <View style={[styles.viewer, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
          <View style={styles.viewerBar}>
            <Text style={styles.counter}>
              {viewingIndex + 1} of {photos.length}
            </Text>
            <Pressable
              accessibilityLabel="Close photo"
              accessibilityRole="button"
              onPress={() => setOpenIndex(null)}
              style={styles.close}
            >
              <Ionicons color={colors.onInverseSurface} name="close" size={28} />
            </Pressable>
          </View>
          <View
            onLayout={(event) => setStageHeight(event.nativeEvent.layout.height)}
            style={styles.stage}
          >
            {openIndex !== null && stageHeight > 0 ? (
              <FlatList
                data={photos}
                getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
                horizontal
                initialScrollIndex={openIndex}
                keyExtractor={(photo) => photo.key}
                onScroll={onScroll}
                pagingEnabled
                renderItem={({ item }) => (
                  <View style={{ width, height: stageHeight }}>
                    <Image
                      accessibilityLabel={item.caption}
                      resizeMode="contain"
                      source={item.source}
                      style={styles.full}
                    />
                  </View>
                )}
                scrollEventThrottle={16}
                showsHorizontalScrollIndicator={false}
              />
            ) : null}
          </View>
          <Text style={styles.caption}>{photos[viewingIndex]?.caption}</Text>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: spacing.sm,
  },
  tile: {
    width: '48.5%',
    aspectRatio: 4 / 3,
    borderRadius: radii.md,
    overflow: 'hidden',
    backgroundColor: colors.surfaceHigh,
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
  viewer: {
    flex: 1,
    backgroundColor: colors.inverseSurface,
  },
  viewerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
  },
  counter: {
    ...typography.labelMd,
    color: colors.onInverseSurface,
  },
  close: {
    width: sizes.tapTarget,
    height: sizes.tapTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stage: {
    flex: 1,
  },
  full: {
    width: '100%',
    height: '100%',
  },
  caption: {
    ...typography.bodyMd,
    color: colors.onInverseSurface,
    textAlign: 'center',
    padding: spacing.md,
  },
});

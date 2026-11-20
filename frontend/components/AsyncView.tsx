import { AsyncState } from '@/hooks/useAsync';
import { colors, spacing } from '@/theme';
import { ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { EmptyState } from './EmptyState';
import { ErrorState } from './ErrorState';

type AsyncViewProps<T> = {
  state: AsyncState<T>;
  empty: { title: string; message: string };
  isEmpty?: (data: T) => boolean;
  children: (data: T) => ReactNode;
};

export function AsyncView<T>({ state, empty, isEmpty, children }: AsyncViewProps<T>) {
  const { data, loading, reload } = state;

  if (data === null) {
    if (loading) {
      return (
        <View accessibilityLabel="Loading" style={styles.loading}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      );
    }
    return (
      <ErrorState
        message="Please check your connection and try again."
        onRetry={reload}
        title="We could not load this"
      />
    );
  }

  const nothingToShow = isEmpty ? isEmpty(data) : Array.isArray(data) && data.length === 0;
  if (nothingToShow) {
    return <EmptyState message={empty.message} title={empty.title} />;
  }

  return <>{children(data)}</>;
}

const styles = StyleSheet.create({
  loading: {
    minHeight: 120,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
});

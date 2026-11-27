import { ErrorState } from '@/components/ErrorState';
import { ScreenContainer } from '@/components/ScreenContainer';
import { makeStyles } from '@/theme';
import { Link, Stack } from 'expo-router';
import { StyleSheet } from 'react-native';

export default function NotFoundScreen() {
  const styles = useStyles();
  return (
    <>
      <Stack.Screen options={{ title: 'Not found' }} />
      <ScreenContainer>
        <Link href="/" style={styles.link}>
          <ErrorState message="This screen does not exist yet." title="Page not found" />
        </Link>
      </ScreenContainer>
    </>
  );
}

const useStyles = makeStyles((colors) => ({
  link: {
    backgroundColor: colors.background,
  },
}));

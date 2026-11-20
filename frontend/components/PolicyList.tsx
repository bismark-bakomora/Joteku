import { PolicySection } from '@/lib/policies';
import { colors, radii, spacing, typography } from '@/theme';
import { StyleSheet, Text, View } from 'react-native';

type PolicyListProps = {
  section: PolicySection;
};

export function PolicyList({ section }: PolicyListProps) {
  return (
    <View style={styles.wrap}>
      <Text accessibilityRole="header" style={styles.title}>
        {section.title}
      </Text>
      {section.points.map((point) => (
        <View key={point} style={styles.point}>
          <View style={styles.bullet} />
          <Text style={styles.text}>{point}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
  },
  title: {
    ...typography.titleMd,
    color: colors.text,
  },
  point: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm + 2,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: radii.full,
    backgroundColor: colors.secondary,
    marginTop: 9,
  },
  text: {
    ...typography.bodyMd,
    color: colors.textSubtle,
    flex: 1,
  },
});

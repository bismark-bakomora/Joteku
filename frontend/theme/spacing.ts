export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
  gutter: 16,
  screen: 16,
} as const;

export const sizes = {
  tapTarget: 48,
  // Content stops growing past this width so tablets get a centred column, not a stretched phone layout.
  contentMaxWidth: 640,
  // The floating tab bar, and the widest it grows on large screens.
  tabBar: 64,
  tabBarMaxWidth: 320,
} as const;

export const radii = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  full: 9999,
} as const;

export const shadows = {
  card: {
    shadowColor: '#24211D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  raised: {
    shadowColor: '#24211D',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 6,
  },
  floating: {
    shadowColor: '#24211D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 10,
  },
} as const;

export const hitSlop = {
  top: 8,
  bottom: 8,
  left: 8,
  right: 8,
} as const;

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
  // Visible height of chips and segmented options. Their touch area is
  // stretched back to tapTarget with pillHitSlop.
  pill: 36,
  // The search field, and the segmented control that sits above it on Menu.
  field: 52,
  // Content stops growing past this width so tablets get a centred column, not a stretched phone layout.
  contentMaxWidth: 640,
  // The floating tab bar, and the widest it grows on large screens.
  tabBar: 58,
  tabBarMaxWidth: 296,
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

// Tops up a `sizes.pill` control to the 48px tap target.
export const pillHitSlop = {
  top: (48 - 36) / 2,
  bottom: (48 - 36) / 2,
  left: 0,
  right: 0,
} as const;

export const hitSlop = {
  top: 8,
  bottom: 8,
  left: 8,
  right: 8,
} as const;

import { createTheme, MantineColorsTuple } from '@mantine/core';

/**
 * HSE Corporate Navy Primary Palette (#212B59).
 * 10-shade array for Mantine v8.
 * - Shade 0: #eaf1ff (matches DESIGN_SYSTEM primary.light)
 * - Shade 6: #212B59 (matches DESIGN_SYSTEM primary.DEFAULT)
 */
export const hseBrandColors: MantineColorsTuple = [
  '#eaf1ff', // 0: lightest tint, badge bg
  '#d0daf5', // 1: light hover tint
  '#a1b4e8', // 2: light border / focus tint
  '#738edc', // 3: soft mid-tone
  '#4d6ecf', // 4: primary accent
  '#3350ad', // 5: vibrant corporate blue
  '#212B59', // 6: primary brand Navy (DEFAULT)
  '#1a2247', // 7: active / hover navy
  '#131935', // 8: deep slate surface
  '#0c1023', // 9: darkest slate navy
];

export const mantineTheme = createTheme({
  colors: {
    brand: hseBrandColors,
  },
  primaryColor: 'brand',
  primaryShade: 6, // #212B59 (Light Mode)
  fontFamily: "'Almarai', sans-serif",
  headings: {
    fontFamily: "'Almarai', sans-serif",
    fontWeight: '700',
  },
  defaultRadius: 'md', // 8px default
  radius: {
    xs: '4px',
    sm: '6px',
    md: '8px',
    lg: '12px',
    xl: '16px',
  },
  components: {
    Button: {
      defaultProps: {
        radius: 'md',
        size: 'sm',
      },
    },
    Modal: {
      defaultProps: {
        radius: 'lg',
        centered: true,
      },
    },
    Select: {
      defaultProps: {
        radius: 'md',
        size: 'sm',
      },
    },
    MultiSelect: {
      defaultProps: {
        radius: 'md',
        size: 'sm',
      },
    },
    TextInput: {
      defaultProps: {
        radius: 'md',
        size: 'sm',
      },
    },
    Pagination: {
      defaultProps: {
        radius: 'md',
        color: 'brand',
      },
    },
  },
});

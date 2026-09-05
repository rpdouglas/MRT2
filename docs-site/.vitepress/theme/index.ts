import type { Theme } from 'vitepress';
import DefaultTheme from 'vitepress/theme';
import './tailwind.css';

export default {
  extends: DefaultTheme,
} satisfies Theme;

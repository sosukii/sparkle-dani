<script setup lang="ts">
type IconName =
  | 'search' | 'bag' | 'menu' | 'close' | 'sparkle' | 'telegram' | 'filter' | 'check'
  | 'minus' | 'plus' | 'trash' | 'arrow-right' | 'arrow-left' | 'copy' | 'chevron-down' | 'heart' | 'alert'

defineProps<{ name: IconName, size?: number }>()

const paths: Record<IconName, string> = {
  search: 'M11 4a7 7 0 1 0 4.2 12.6l4.1 4.1 1.4-1.4-4.1-4.1A7 7 0 0 0 11 4Zm0 2a5 5 0 1 1 0 10 5 5 0 0 1 0-10Z',
  bag: 'M6 7V6a6 6 0 0 1 12 0v1h2.2l.8 14H3L3.8 7H6Zm2 0h8V6a4 4 0 0 0-8 0v1Zm-2 2H5.7l-.6 10h13.8l-.6-10H18v2h-2V9H8v2H6V9Z',
  menu: 'M4 6h16v2H4V6Zm0 5h16v2H4v-2Zm0 5h16v2H4v-2Z',
  close: 'm6.4 5 5.6 5.6L17.6 5 19 6.4 13.4 12l5.6 5.6-1.4 1.4-5.6-5.6L6.4 19 5 17.6l5.6-5.6L5 6.4 6.4 5Z',
  sparkle: 'M12 1c.6 5.8 2.2 8.9 5 10.2 2.2 1 4.2 1.3 6 1.8-5.8.6-8.9 2.2-10.2 5-1 2.2-1.3 4.2-1.8 6-.6-5.8-2.2-8.9-5-10.2-2.2-1-4.2-1.3-6-1.8 5.8-.6 8.9-2.2 10.2-5C11.2 4.6 11.5 2.8 12 1Z',
  telegram: 'M2.5 11.2 21 3.5l-3.2 17-5.3-4-3 3V15L17 7.500l-9.200 6.100-5.300-2.400Z',
  filter: 'M3 5h18v2l-7 7v6l-4-2v-4L3 7V5Z',
  check: 'm9.5 16.2-4-4L4 13.700l5.500 5.500L20 8.700 18.600 7.300 9.500 16.200Z',
  minus: 'M5 11h14v2H5v-2Z',
  plus: 'M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6V5Z',
  trash: 'M9 3h6l1 2h4v2H4V5h4l1-2Zm-3 6h12l-1 12H7L6 9Zm3 2v8h2v-8H9Zm4 0v8h2v-8h-2Z',
  'arrow-right': 'M4 11h12.2l-4.600-4.600L13 5l7 7-7 7-1.400-1.400 4.600-4.600H4v-2Z',
  'arrow-left': 'M20 13H7.800l4.600 4.600L11 19l-7-7 7-7 1.400 1.400L7.800 11H20v2Z',
  copy: 'M8 3h11a2 2 0 0 1 2 2v12h-2V5H8V3Zm-3 4h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Zm0 2v10h10V9H5Z',
  'chevron-down': 'M6.400 8.600 12 14.200l5.600-5.600L19 10l-7 7-7-7 1.400-1.400Z',
  heart: 'M12 21s-8-5.300-8-11a4.500 4.500 0 0 1 8-2.800A4.500 4.500 0 0 1 20 10c0 5.700-8 11-8 11Z',
  alert: 'M12 3 1.500 21h21L12 3Zm-1 6h2v6h-2V9Zm0 8h2v2h-2v-2Z',
}
</script>

<template>
  <svg
    :width="size ?? 20"
    :height="size ?? 20"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
    focusable="false"
    class="shrink-0"
  >
    <path :d="paths[name]" />
  </svg>
</template>

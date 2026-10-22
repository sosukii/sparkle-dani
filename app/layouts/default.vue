<template>
  <div class="flex min-h-dvh flex-col">
    <a href="#main" class="sr-only-focusable fixed left-4 top-4 z-50 rounded-full bg-accent px-5 py-3 text-sm font-bold text-fg">
      Перейти к содержимому
    </a>
    <AppHeader />
    <main id="main" class="flex-1" tabindex="-1">
      <slot />
    </main>
    <AppFooter />
    <AppToast />
  </div>
</template>

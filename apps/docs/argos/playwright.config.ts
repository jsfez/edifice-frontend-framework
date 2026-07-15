import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: '.',
  testMatch: 'stories.spec.ts',
  timeout: 60_000,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 4 : 6,
  fullyParallel: true,
  reporter: process.env.ARGOS_TOKEN || process.env.CI ? [['list'], ['@argos-ci/playwright/reporter']] : 'list',
  use: {
    baseURL: 'http://127.0.0.1:6006',
    contextOptions: { reducedMotion: 'reduce' },
    // Make text rasterization deterministic across machines: grayscale
    // antialiasing (no subpixel red/blue fringing) + platform-independent
    // glyph hinting. Without this, a sub-pixel layout shift re-samples the
    // text and Argos flags anti-aliasing noise as a change.
    // https://argos-ci.com/docs/learn/reliability-and-flakiness/flaky-tests/stabilize-text-rendering
    launchOptions: {
      args: ['--disable-lcd-text', '--font-render-hinting=none'],
    },
  },
  webServer: {
    command: 'npx http-server ../dist --port 6006 --silent',
    url: 'http://127.0.0.1:6006/iframe.html',
    reuseExistingServer: true,
    timeout: 30_000,
  },
})

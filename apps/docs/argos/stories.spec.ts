import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { test } from '@playwright/test'
import { argosScreenshot } from '@argos-ci/playwright'

type StoryIndex = {
  entries: Record<string, { id: string; title: string; name: string; type: string }>
}

const indexPath = fileURLToPath(new URL('../dist/index.json', import.meta.url))
const index: StoryIndex = JSON.parse(readFileSync(indexPath, 'utf-8'))

const only = process.env.ARGOS_ONLY?.split(',').map((s) => s.trim())

const stories = Object.values(index.entries).filter(
  (entry) => entry.type === 'story' && (!only || only.includes(entry.id)),
)

for (const story of stories) {
  test(`${story.title} › ${story.name}`, async ({ page }) => {
    await page.goto(`/iframe.html?id=${story.id}&viewMode=story`)
    // Wait for Storybook's own render cycle: some stories render in a portal
    // and leave #storybook-root empty, so don't wait on the root itself.
    await page.waitForFunction(() => {
      const phase = (
        window as unknown as {
          __STORYBOOK_PREVIEW__?: { currentRender?: { phase?: string } }
        }
      ).__STORYBOOK_PREVIEW__?.currentRender?.phase
      return phase === 'completed' || phase === 'finished'
    })
    // Wait for JS-driven animations to settle. react-spring (used by Modal via
    // useTransition opacity 0->1) animates inline styles with rAF and ignores
    // prefers-reduced-motion, so a story can be captured mid-fade: the whole
    // dialog then renders at opacity ~0.99 (fill 254 instead of 255) and the
    // value differs run-to-run on CI. Require inline styles to be unchanged for
    // several consecutive frames (bounded, so it never hangs on a loop anim).
    await page.evaluate(
      () =>
        new Promise<void>((resolve) => {
          const deadline = performance.now() + 3000
          let last = ''
          let stable = 0
          const tick = () => {
            const sig = Array.from(document.querySelectorAll('[style]'))
              .map((el) => el.getAttribute('style'))
              .join('|')
            if (sig === last) stable++
            else {
              stable = 0
              last = sig
            }
            if (stable >= 5 || performance.now() > deadline) resolve()
            else requestAnimationFrame(tick)
          }
          requestAnimationFrame(tick)
        }),
    )
    // Respect the repo's own `chromatic: { disableSnapshot: true }` story
    // parameters (e.g. stories rendering random remote images).
    const disableSnapshot = await page.evaluate(
      () =>
        (
          window as unknown as {
            __STORYBOOK_PREVIEW__?: {
              currentRender?: {
                story?: {
                  parameters?: { chromatic?: { disableSnapshot?: boolean } }
                }
              }
            }
          }
        ).__STORYBOOK_PREVIEW__?.currentRender?.story?.parameters?.chromatic
          ?.disableSnapshot === true,
    )
    test.skip(disableSnapshot, 'story opts out of snapshots (chromatic parameter)')
    // Some stories load avatars from https://i.pravatar.cc, which returns a
    // *random* photo per request (and goes through MSW's service worker, so it
    // can't be stubbed from page.route). Such content is inherently
    // non-deterministic — treat it like `chromatic.disableSnapshot` and skip.
    const hasRandomRemoteImage = await page.evaluate(() =>
      Array.from(document.images).some((img) => /i\.pravatar\.cc/.test(img.currentSrc || img.src)),
    )
    test.skip(hasRandomRemoteImage, 'story loads a random remote image (non-deterministic)')
    // Carousels/scrolling lists may settle on a non-deterministic offset:
    // pin every scroll position before capturing.
    await page.evaluate(() => {
      for (const el of Array.from(document.querySelectorAll('*'))) {
        if (el.scrollLeft !== 0) el.scrollLeft = 0
        if (el.scrollTop !== 0) el.scrollTop = 0
      }
    })
    // Spinners and skeletons legitimately keep aria-busy forever.
    const isLoadingState = /load(ing|er)|skeleton|spinner|progress/i.test(
      `${story.title} ${story.name}`,
    )
    await argosScreenshot(page, story.id, {
      stabilize: isLoadingState ? { waitForAriaBusy: false } : true,
    })
  })
}

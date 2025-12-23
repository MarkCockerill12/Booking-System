import * as anime from "animejs"

// Fix for webpack/Next.js: animejs exports default differently
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const animeInstance = (anime as any).default || anime

export const vistaSlideIn = (target: string | HTMLElement, delay = 0) => {
  return animeInstance({
    targets: target,
    translateY: [30, 0],
    opacity: [0, 1],
    duration: 400,
    delay,
    easing: "easeOutCubic",
  })
}

export const vistaFadeIn = (target: string | HTMLElement, delay = 0) => {
  return animeInstance({
    targets: target,
    opacity: [0, 1],
    scale: [0.98, 1],
    duration: 300,
    delay,
    easing: "easeOutQuad",
  })
}

export const vistaGlassShine = (target: string | HTMLElement) => {
  return animeInstance({
    targets: target,
    opacity: [0.5, 1, 0.5],
    duration: 2000,
    loop: true,
    easing: "easeInOutSine",
  })
}

export const vistaButtonPress = (target: HTMLElement) => {
  return animeInstance
    .timeline()
    .add({
      targets: target,
      scale: 0.95,
      duration: 100,
      easing: "easeOutQuad",
    })
    .add({
      targets: target,
      scale: 1,
      duration: 200,
      easing: "easeOutElastic(1, 0.5)",
    })
}

export const vistaFloatLoop = (target: string | HTMLElement) => {
  return animeInstance({
    targets: target,
    translateY: [-10, 10],
    duration: 3000,
    loop: true,
    direction: "alternate",
    easing: "easeInOutSine",
  })
}

export const vistaCardHover = (target: HTMLElement, hovering: boolean) => {
  animeInstance({
    targets: target,
    translateY: hovering ? -8 : 0,
    scale: hovering ? 1.02 : 1,
    duration: 300,
    easing: "easeOutCubic",
  })
}

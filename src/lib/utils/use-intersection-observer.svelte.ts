/**
 * Creates an intersection observer that calls a callback when element enters viewport
 * Automatically cleans up on component unmount
 *
 * @param element - The element to observe (or null/undefined before mount)
 * @param callback - Function to call when element intersects viewport
 * @param options - IntersectionObserver options (rootMargin defaults to "200px" for early loading)
 */
export function useIntersectionObserver(
  element: HTMLElement | null | undefined,
  callback: () => void,
  options?: IntersectionObserverInit,
) {
  let observer: IntersectionObserver | null = null

  $effect(() => {
    if (!element) return

    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            callback()
          }
        })
      },
      {
        rootMargin: "200px",
        ...options,
      },
    )

    observer.observe(element)

    return () => {
      if (observer) {
        observer.disconnect()
        observer = null
      }
    }
  })
}

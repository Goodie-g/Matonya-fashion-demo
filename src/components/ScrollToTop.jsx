import { useEffect } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

/**
 * Reset the viewport when moving between routes.
 *
 * React Router swaps the page without touching scroll, so following a link from
 * halfway down the shop used to land you halfway down the product page. Jump to
 * the top on PUSH/REPLACE navigations; leave POP alone so the back button still
 * returns you to where you left off.
 */
export default function ScrollToTop() {
  const { pathname, search, hash } = useLocation()
  const navigationType = useNavigationType()

  useEffect(() => {
    if (navigationType === 'POP') return

    if (hash) {
      const target = document.getElementById(hash.slice(1))
      if (target) {
        target.scrollIntoView()
        return
      }
    }

    window.scrollTo(0, 0)
  }, [pathname, search, hash, navigationType])

  return null
}

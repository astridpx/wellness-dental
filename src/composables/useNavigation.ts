import type { RouteRecordRaw } from 'vue-router'

type RouteNavItem = [boolean, { visibleTo: string[] }]

export function useNavigation() {
  function isVis(visibleTo: string[], userRoles: string[]) {
    // r = user's roles
    // n[1] = nav item's `visibleTo`
    const r: string[] = userRoles
    const intersection = visibleTo.filter((visibleToRole: string) => r.includes(visibleToRole))
    return !!intersection.length
  }

  function getNav(routes: readonly RouteRecordRaw[], userRoles: string[]) {
    // Filter parent routes
    const filteredRoutes = routes.filter((route) => {
      const n = route.meta?.navItem as boolean | RouteNavItem | undefined
      if (Array.isArray(n) && n[1]) return isVis(n[1].visibleTo, userRoles)
      return n
    })
    // Filter routes with children
    const filteredRoutesFilteredChildren = filteredRoutes.map((route) => {
      if (!route.children) return route

      const { meta, name, path } = route
      const filteredChildren = route.children.filter((child) =>
        isVis(((child.meta?.navItem as RouteNavItem)[1]).visibleTo, userRoles),
      )
      return { meta, name, path, children: filteredChildren }
    })
    return filteredRoutesFilteredChildren.map((route) => ({
      name: route.meta?.title,
      href: route.path,
      icon: route.meta?.icon,
      children: route.children,
    }))
  }

  return { getNav, isVis }
}

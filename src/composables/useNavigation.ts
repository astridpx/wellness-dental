import type { RouteRecordRaw } from 'vue-router'

type RouteNavItem = [boolean, { visibleTo: string[] }]
type RouteNavMeta = {
  title?: string
  icon?: string
  navItem?: boolean | RouteNavItem
  navGroup?: {
    name: string
    icon?: string
  }
}

type NavigationChild = {
  name: string
  href: string
  icon?: string
}

type NavigationItem = {
  name: string
  href: string
  icon?: string
  children?: NavigationChild[]
}

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
    const navItems = filteredRoutesFilteredChildren.map((route) => ({
      name: String(route.meta?.title || route.name || route.path),
      href: route.path,
      icon: (route.meta as RouteNavMeta | undefined)?.icon,
      navGroup: (route.meta as RouteNavMeta | undefined)?.navGroup,
      children: route.children,
    }))

    const groupedItems: NavigationItem[] = []

    for (const item of navItems) {
      if (!item.navGroup?.name) {
        groupedItems.push({
          name: item.name,
          href: item.href,
          icon: item.icon,
          children: item.children as NavigationChild[] | undefined,
        })
        continue
      }

      const existingGroup = groupedItems.find((group) => group.name === item.navGroup?.name)
      const childItem = {
        name: item.name,
        href: item.href,
        icon: item.icon,
      }

      if (existingGroup) {
        existingGroup.children = [...(existingGroup.children || []), childItem]
        continue
      }

      groupedItems.push({
        name: item.navGroup.name,
        href: item.href,
        icon: item.navGroup.icon || item.icon,
        children: [childItem],
      })
    }

    return groupedItems
  }

  return { getNav, isVis }
}

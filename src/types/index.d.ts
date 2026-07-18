type TRouteNavItemWOpts = [boolean, { visibleTo: string[] }]
type TRouteNavItem = boolean | TRouteNavItemWOpts

// Routes
interface IRouteMeta {
  title: string
  icon?: string
  navItem: [boolean, { visibleTo?: string[] }]
}

interface IRoute {
  path: string
  name: string
  component: Component
  meta: IRouteMeta
  children?: IRoute[]
}

// Logs
interface IUserLog {
  _id: string
  ip: string
  userID: string
  email: string
  activity: string
  success: boolean
}

interface ISystemLog {
  _id: string
  activity: string
  success: boolean
}

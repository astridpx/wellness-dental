export type OverviewCard = {
  label: string
  value: number | string
  note: string
  tone: string
  icon: string
  loading: boolean
}

export type ActivityItem = {
  title: string
  detail: string
  icon: string
}

export type DirectoryRow = {
  id: string
  module: string
  count: number
  status: string
  route: string
  note: string
  loading: boolean
}

export type SummaryEntityResponse = {
  id: number
}

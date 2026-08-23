export type PaginationMetadata = {
  page?: number
  perPage?: number
  totalEntries?: number
  totalPages?: number
}

export type SortablePaginationMetadata = PaginationMetadata & {
  sortBy?: string
  sortOrder?: string
}

export type PartnerRecordPaginationMetadata = SortablePaginationMetadata & {
  paidRows?: number
  unpaidRows?: number
}

export type MembershipPaginationMetadata = PaginationMetadata & {
  remittedMembers?: number
  unremittedMembers?: number
}

export type ImportedPartnerMemberPaginationMetadata = PaginationMetadata & {
  paidMembers?: number
  unpaidMembers?: number
}

export type DentalAvailmentHistoryPaginationMetadata = PaginationMetadata & {
  paidRows?: number
  unpaidRows?: number
  unpaidAmount?: number
  totalAmount?: number
}

export interface NFTMetadata {
  image: string
  name: string
  description?: string
  external_link: string
  animation_url?: string
  youtube_url?: string
  seller_fee_basis_points?: number // royalties
  fee_recipient?: string // royalties receiver
}

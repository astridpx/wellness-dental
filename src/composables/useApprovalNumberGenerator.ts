import { useWellnessApi } from './useWellnessApi'

type GeneratedApprovalNoResponse = {
  approvalNo: string
}

export function useApprovalNumberGenerator() {
  const { request } = useWellnessApi()

  async function generateApprovalNumber() {
    const result = await request<GeneratedApprovalNoResponse>(
      '/wellness/dentalAvailments/generateApprovalNo',
    )

    if (!result.ok || !result.data?.approvalNo) {
      return {
        approvalNo: '',
        error: result.error || 'Unable to generate approval number.',
      }
    }

    return {
      approvalNo: result.data.approvalNo,
      error: '',
    }
  }

  return {
    generateApprovalNumber,
  }
}

export const roleLabel: Record<string, string> = {
  SUPER_ADMIN: '최고관리자',
  ADMIN: '관리자',
  MANAGER: '매니저',
  USER: '일반회원',
}

export const accountStateLabel: Record<string, string> = {
  NORMAL: '정상',
  DELETED: '탈퇴',
  SUSPENDED: '정지',
}

export const eventStatusLabel: Record<string, string> = {
  PREPARING: '준비중',
  OPEN: '판매중',
  CALCULATING: '정산중',
  CLOSED: '종료',
  DELETED: '삭제됨',
}

export const orderStatusLabel: Record<string, string> = {
  CONFIRM: '확인',
  PENDING_APPROVE: '승인대기',
  REFUND: '환불',
  CANCELED: '취소',
  FAILED: '실패',
}

export const refundStatusLabel: Record<string, string> = {
  NONE: '없음',
  REFUND_REQUESTED: '환불 요청',
  REFUND_COMPLETED: '환불 완료',
}

export const commentStatusLabel: Record<string, string> = {
  ACTIVE: '활성',
  DELETED: '삭제됨',
}

export function label(map: Record<string, string>, key: string): string {
  return map[key] ?? key
}

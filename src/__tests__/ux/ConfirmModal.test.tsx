import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ConfirmModal from '../../components/ConfirmModal'

describe('ConfirmModal', () => {
  it('open=false일 때 렌더링하지 않는다', () => {
    render(
      <ConfirmModal open={false} title="제목" description="설명" onConfirm={() => {}} onCancel={() => {}} />
    )
    expect(screen.queryByText('제목')).not.toBeInTheDocument()
  })

  it('open=true일 때 제목과 설명을 렌더링한다', () => {
    render(
      <ConfirmModal open={true} title="삭제 확인" description="정말 삭제하시겠습니까?" onConfirm={() => {}} onCancel={() => {}} />
    )
    expect(screen.getByText('삭제 확인')).toBeInTheDocument()
    expect(screen.getByText('정말 삭제하시겠습니까?')).toBeInTheDocument()
  })

  it('확인 버튼 클릭 시 onConfirm을 호출한다', async () => {
    const onConfirm = vi.fn()
    const user = userEvent.setup()
    render(
      <ConfirmModal open={true} title="확인" description="진행?" confirmLabel="삭제" onConfirm={onConfirm} onCancel={() => {}} />
    )
    await user.click(screen.getByText('삭제'))
    expect(onConfirm).toHaveBeenCalledOnce()
  })

  it('취소 버튼 클릭 시 onCancel을 호출한다', async () => {
    const onCancel = vi.fn()
    const user = userEvent.setup()
    render(
      <ConfirmModal open={true} title="확인" description="진행?" onConfirm={() => {}} onCancel={onCancel} />
    )
    await user.click(screen.getByText('취소'))
    expect(onCancel).toHaveBeenCalledOnce()
  })

  it('ESC 키로 모달을 닫을 수 있다', async () => {
    const onCancel = vi.fn()
    const user = userEvent.setup()
    render(
      <ConfirmModal open={true} title="확인" description="진행?" onConfirm={() => {}} onCancel={onCancel} />
    )
    await user.keyboard('{Escape}')
    expect(onCancel).toHaveBeenCalledOnce()
  })

  it('aria-modal과 role="dialog"가 설정되어 있다', () => {
    render(
      <ConfirmModal open={true} title="접근성" description="테스트" onConfirm={() => {}} onCancel={() => {}} />
    )
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
  })

  it('danger variant는 빨간 확인 버튼을 렌더링한다', () => {
    render(
      <ConfirmModal open={true} title="위험" description="위험 작업" variant="danger" confirmLabel="삭제" onConfirm={() => {}} onCancel={() => {}} />
    )
    const btn = screen.getByText('삭제')
    expect(btn.className).toContain('bg-red-600')
  })
})

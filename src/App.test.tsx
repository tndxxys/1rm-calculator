import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('App', () => {
  it('renders the input panel and empty state by default', () => {
    render(<App />)

    expect(screen.getByText('输入')).toBeInTheDocument()
    expect(screen.getByText('请输入有效数据')).toBeInTheDocument()
    expect(screen.getByText('历史记录')).toBeInTheDocument()
  })
})

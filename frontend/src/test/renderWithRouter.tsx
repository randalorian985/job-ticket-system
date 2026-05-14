import type { PropsWithChildren, ReactElement } from 'react'
import { render, type RenderOptions } from '@testing-library/react'
import { MemoryRouter, type MemoryRouterProps } from 'react-router-dom'
import { routerFuture } from '../routes/routerFuture'

type RouterRenderOptions = Omit<RenderOptions, 'wrapper'> & {
  initialEntries?: MemoryRouterProps['initialEntries']
  initialIndex?: MemoryRouterProps['initialIndex']
}

export const renderWithRouter = (
  ui: ReactElement,
  { initialEntries, initialIndex, ...renderOptions }: RouterRenderOptions = {}
) => {
  const Wrapper = ({ children }: PropsWithChildren) => (
    <MemoryRouter future={routerFuture} initialEntries={initialEntries} initialIndex={initialIndex}>
      {children}
    </MemoryRouter>
  )

  return render(ui, {
    wrapper: Wrapper,
    ...renderOptions
  })
}

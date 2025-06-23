declare module 'react-window' {
  import React, { ComponentType, CSSProperties, ReactNode } from 'react'

  export interface ListChildComponentProps<T = any> {
    index: number
    style: CSSProperties
    data?: T
  }

  export interface FixedSizeListProps<T = any> {
    children: ComponentType<ListChildComponentProps<T>>
    className?: string
    height: number
    itemCount: number
    itemData?: T
    itemSize: number
    width: number | string
    onScroll?: (props: { scrollOffset: number }) => void
    ref?: any
  }

  export class FixedSizeList<T = any> extends React.Component<FixedSizeListProps<T>> {}
  export const VariableSizeList: ComponentType<any>
}

declare module 'react-virtualized-auto-sizer' {
  import { ComponentType, ReactNode } from 'react'

  export interface Size {
    height: number
    width: number
  }

  interface AutoSizerProps {
    children: (props: Size) => ReactNode
    className?: string
    defaultHeight?: number
    defaultWidth?: number
    disableHeight?: boolean
    disableWidth?: boolean
    onResize?: (props: Size) => void
  }

  const AutoSizer: ComponentType<AutoSizerProps>
  export default AutoSizer
  export { Size }
}

declare module 'react-window-infinite-loader' {
  import { ComponentType, ReactElement } from 'react'

  interface InfiniteLoaderProps {
    children: (props: { onItemsRendered: any; ref: any }) => ReactElement
    isItemLoaded: (index: number) => boolean
    itemCount: number
    loadMoreItems: (startIndex: number, stopIndex: number) => Promise<void> | void
    minimumBatchSize?: number
    threshold?: number
  }

  const InfiniteLoader: ComponentType<InfiniteLoaderProps>
  export default InfiniteLoader
}
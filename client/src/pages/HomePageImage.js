import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchImage } from './slice'
import { LazyLoadImage } from 'react-lazy-load-image-component'

const ImageLoader = ({ id, type, url, alt, style, className, effect = 'blur' }) => {
  const dispatch = useDispatch()
  const imageUrl = useSelector(state => {
    switch (type) {
      case 'banner':
        return state.images.bannerImages[id]
      case 'category':
        return state.images.categoryImages[id]
      case 'product':
        return state.images.productImages[id]
      default:
        return null
    }
  })

  useEffect(() => {
    if (!imageUrl) {
      dispatch(fetchImage({ id, type, url }))
    }
  }, [dispatch, id, type, url, imageUrl])

  return (
    <LazyLoadImage
      src={imageUrl || '/placeholder.png'}
      alt={alt}
      effect={effect}
      style={style}
      className={className}
    />
  )
}

export default ImageLoader

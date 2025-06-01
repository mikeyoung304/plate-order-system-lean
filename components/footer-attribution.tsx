export function FooterAttribution() {
  return (
    <footer
      className='fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm 
                     border-t border-gray-100 py-2 px-4 z-10'
    >
      <p className='text-xs text-gray-500 text-center'>
        Plate by Mike Young © {new Date().getFullYear()}
      </p>
    </footer>
  )
}

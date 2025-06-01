import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'

// Example test to verify setup
describe('Testing Setup', () => {
  it('should run tests successfully', () => {
    const TestComponent = () => <div>Test Component</div>
    
    render(<TestComponent />)
    
    expect(screen.getByText('Test Component')).toBeInTheDocument()
  })
})
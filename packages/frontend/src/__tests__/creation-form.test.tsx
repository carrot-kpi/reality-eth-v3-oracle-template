import { createRoot } from 'react-dom/client'
import { Component as CreationForm } from '../creation-form'

describe('creation form', () => {
  it('renders without crashing', () => {
    const div = createRoot(document.createElement('div'))
    div.render(<CreationForm t={() => {}} onDone={() => {}} />)
    div.unmount()
  })
})

import { ReactElement, useCallback, useState } from 'react'
import { ethers } from 'ethers'
import { TFunction } from 'react-i18next'

interface CreationFormProps {
  t: TFunction
  onDone: (data: string, value: ethers.BigNumber) => void
}

export const Component = ({ t, onDone }: CreationFormProps): ReactElement => {
  const [test, setTest] = useState('')

  const handleTestChange = useCallback((event: any) => {
    setTest(event.target.value)
  }, [])

  const handleSubmit = useCallback(() => {
    onDone(
      ethers.utils.defaultAbiCoder.encode(['string'], [test]),
      ethers.utils.parseEther('0.01') // random value
    )
  }, [onDone, test])

  return (
    <div>
      <label htmlFor="test">{t('label.test')}</label>
      <br />
      <input
        id="test"
        placeholder="Test"
        onChange={handleTestChange}
        value={test}
      />
      <br />
      <button onClick={handleSubmit}>{t('submit')}</button>
    </div>
  )
}

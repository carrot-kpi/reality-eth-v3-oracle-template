import {
  ChainId,
  Oracle,
  Template,
  TemplateSpecification,
} from '@carrot-kpi/sdk'
import { utils, Wallet } from 'ethers'
import { createRoot } from 'react-dom/client'
import { Component as Page } from '../page'
import baseSpec from '../base.json'
import { long as longCommitHash } from 'git-rev-sync'

describe('page', () => {
  let oracle: Oracle

  beforeAll(() => {
    const templateSpecification = new TemplateSpecification(
      'foo-cid',
      baseSpec.name,
      baseSpec.description,
      baseSpec.tags,
      baseSpec.repository,
      longCommitHash()
    )

    const randomAddress = (): string => Wallet.createRandom().address

    const template = new Template(1, randomAddress(), 1, templateSpecification)

    const now = Math.floor(Date.now() / 1000)

    oracle = new Oracle(
      ChainId.GOERLI,
      randomAddress(),
      template,
      false,
      utils.defaultAbiCoder.encode(
        [
          'uint32',
          'uint32',
          'address',
          'bool',
          'uint256',
          'address',
          'address',
        ],
        [
          now - 86_400,
          now,
          randomAddress(),
          false,
          100,
          randomAddress(),
          randomAddress(),
        ]
      )
    )
  })

  it('renders without crashing', () => {
    const div = createRoot(document.createElement('div'))
    div.render(<Page t={() => {}} oracle={oracle} />)
    div.unmount()
  })
})

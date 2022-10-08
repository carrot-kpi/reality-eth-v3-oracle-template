declare global {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  let __webpack_public_path__: string
}

export const set = (value: string): void => {
  __webpack_public_path__ = value
}

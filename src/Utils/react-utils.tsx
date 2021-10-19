/** Extend classes if given */
export const appendClassNames = (classes: string, additional = '') => {
  return { className: `${classes} ${additional}` }
}

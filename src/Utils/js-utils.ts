export const checkImage = async function (url: string): boolean {
  console.log('1')
  const s = document.createElement('IMG')
  s.src = url
  s.onerror = function () {
    console.log(`file with ${url} invalid`)
    alert(`file with ${url} invalid`)
  }
  s.onload = function () {
    console.log(`file with ${url} valid`)
    alert(`file with ${url} valid`)
  }
}
export function formatAddressShort(addr = '???'): string {
  return `${addr.slice(0, 3).toUpperCase()}...${addr.slice(-3).toUpperCase()}`
}

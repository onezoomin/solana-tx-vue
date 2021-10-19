import { Address } from './Address'
import { AddressStatus } from './AddressStatus'
// export interface Addresses {
//   id: string
//   Addresses: Address[]
// }

export const getInitialActiveAddresses = (): Address[] => {
  return [
  // new Address({
  //   address: 'Bm4cvjwT6VGWRXMgBeBAxZirArQxwmfKdftQh9txaNWT',
  //   status: AddressStatus.Active,
  // }),
    new Address({
      address: 'Exd4hJoZ9z2n37EJFAAnhN2TtG9hCTjqQXyhmUX2vrmm',
      status: AddressStatus.Active,
    }),
    new Address({
      address: 'FR9tXNUmYoMgsL5nqDMywYqX6LcboGwYSezUsH1FSkAZ',
      status: AddressStatus.Active,
    }),
    new Address({
      address: '35tTtkZGrNrt5j3SwBykjb1mkS7Ty8deggZLBDrvxcbA',
      status: AddressStatus.Active,
    }),
  ]
}
export const getInitialCompletedAddresses = (): Address[] => {
  return [
    new Address({
      address: 'BLg9RdzwTjx6QaSeXrVCpQgRDLdhgLWpdrRonCqcpAgz',
      status: AddressStatus.Completed,
    }),
  ]
}

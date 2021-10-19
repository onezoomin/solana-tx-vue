import { Address } from '../Model/Address'
import { AddressStatus } from '../Model/AddressStatus'
import { offlineDB } from './offline'

// const getAddressestates = async function getAddressestates () {
//   console.log(await offlineDB.ActiveAddresses.count(), 'active Addresses in db')
//   const currentActiveAddresses = await offlineDB.ActiveAddresses.toArray()
//   console.log(currentActiveAddresses)
// }
// void getAddressestates()

export const addActiveAddress = async (newAddress: Address) => await offlineDB.ActiveAddresses.add(newAddress)
export const updateActiveAddress = async (addressToUpdate: Address) => await offlineDB.ActiveAddresses.put(addressToUpdate)
export const delActiveAddress = async (idToDelete: string) => await offlineDB.ActiveAddresses.delete(idToDelete)

export const completeActiveAddress = async (addToComplete: string) => {
  const cAddress = await offlineDB.ActiveAddresses.get(addToComplete)
  if (cAddress) {
    cAddress.status = AddressStatus.Completed
    try {
      await offlineDB.CompletedAddresses.add(cAddress)
    } catch (error) {

    } finally {
      await offlineDB.ActiveAddresses.delete(addToComplete)
    }
  }
}

export const TokensQuery = () => offlineDB.TokenInfos.toArray()
export const AddressSpecificQuery = (addr: string = '') => offlineDB.ActiveAddresses.get(addr)
export const TokenSpecificQuery = (addr: string = '') => offlineDB.TokenInfos.get(addr)
export const TokenAccountsForOwnerQuery = (ownerAddress: string = '') => offlineDB.TokenAccounts.where('ownerAddress').equalsIgnoreCase(ownerAddress).toArray()
export const TransactionsForSigArray = (sigs: string[]) => offlineDB.Transactions.bulkGet(sigs)
export const ActiveAddressesQuery = () => offlineDB.ActiveAddresses.toArray()
export const CompletedAddressesQuery = () => offlineDB.CompletedAddresses.toArray()

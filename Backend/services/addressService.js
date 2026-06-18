const addressRepository = require('../repositories/addressRepository');
const ErrorHandler = require('../utils/errorHandler');

class AddressService {
  async getUserAddresses(userId) {
    return await addressRepository.findByUserId(userId);
  }

  async addAddress(userId, addressData) {
    const existing = await addressRepository.findByUserId(userId);
    const isFirst = existing.length === 0;
    // First address is always the default; otherwise honour the requested flag.
    const makeDefault = isFirst || !!addressData.isDefault;
    if (makeDefault) {
      await addressRepository.unsetDefaults(userId);
    }
    return await addressRepository.create({
      ...addressData,
      isDefault: makeDefault,
      label: addressData.addressType || addressData.label || 'Home',
      user: userId,
    });
  }

  async updateAddress(id, userId, updateData) {
    if (updateData.isDefault) {
      await addressRepository.unsetDefaults(userId);
    }
    if (updateData.addressType) {
      updateData.label = updateData.addressType; // keep legacy label in sync
    }
    const address = await addressRepository.update(id, userId, updateData);
    if (!address) throw new ErrorHandler('Address not found', 404);
    return address;
  }

  async deleteAddress(id, userId) {
    const address = await addressRepository.delete(id, userId);
    if (!address) throw new ErrorHandler('Address not found', 404);
    return address;
  }

  async setDefaultAddress(id, userId) {
    await addressRepository.unsetDefaults(userId);
    const address = await addressRepository.update(id, userId, { isDefault: true });
    if (!address) throw new ErrorHandler('Address not found', 404);
    return address;
  }

  async recordUsage(id) {
    return await addressRepository.incrementUsage(id);
  }
}

module.exports = new AddressService();

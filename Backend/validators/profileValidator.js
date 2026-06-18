const { z } = require('zod');

const profileValidator = {
  updateLifestyle: z.object({
    body: z.object({
      lifestyle: z.enum(['student', 'office commute', 'outdoor usage', 'travel usage', 'daily rides', 'other']),
    }),
  }),

  updatePreferences: z.object({
    body: z.object({
      preferences: z.object({
        preferredColors: z.array(z.string()).optional(),
        utilityMode: z.enum(['office commute', 'outdoor travel', 'daily rides']).optional(),
      }),
    }),
  }),

  addToWishlist: z.object({
    body: z.object({
      productId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Product ID'),
      wantsRestockAlert: z.boolean().optional(),
    }),
  }),

  removeFromWishlist: z.object({
    params: z.object({
      productId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Product ID'),
    }),
  }),

  updateNotifications: z.object({
    body: z.object({
      notifications: z.object({
        email: z.boolean().optional(),
        whatsapp: z.boolean().optional(),
        push: z.boolean().optional(),
      }),
    }),
  }),

  trackProductView: z.object({
    body: z.object({
      productId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Product ID'),
    }),
  }),

  addAddress: z.object({
    body: z.object({
      fullName: z.string().min(2, 'Full name is required'),
      phone: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number'),
      houseNo: z.string().min(1, 'House / Flat number is required'),
      buildingName: z.string().optional(),
      street: z.string().min(1, 'Street / Area is required'),
      landmark: z.string().optional(),
      city: z.string().min(1, 'City is required'),
      state: z.string().min(1, 'State is required'),
      pincode: z.string().regex(/^[1-9]\d{5}$/, 'Enter a valid 6-digit pincode'),
      country: z.string().min(1, 'Country is required').optional(),
      addressType: z.enum(['Home', 'Work', 'Other']).optional(),
      isDefault: z.boolean().optional(),
    }),
  }),

  updateAddress: z.object({
    params: z.object({
      id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Address ID'),
    }),
    body: z.object({
      fullName: z.string().min(2, 'Full name is required').optional(),
      phone: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number').optional(),
      houseNo: z.string().min(1, 'House / Flat number is required').optional(),
      buildingName: z.string().optional(),
      street: z.string().min(1, 'Street / Area is required').optional(),
      landmark: z.string().optional(),
      city: z.string().min(1, 'City is required').optional(),
      state: z.string().min(1, 'State is required').optional(),
      pincode: z.string().regex(/^[1-9]\d{5}$/, 'Enter a valid 6-digit pincode').optional(),
      country: z.string().min(1, 'Country is required').optional(),
      addressType: z.enum(['Home', 'Work', 'Other']).optional(),
      isDefault: z.boolean().optional(),
    }),
  }),

  deleteAddress: z.object({
    params: z.object({
      id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Address ID'),
    }),
  }),

  setDefaultAddress: z.object({
    params: z.object({
      id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Address ID'),
    }),
  }),

  createSupportTicket: z.object({
    body: z.object({
      orderId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Order ID').optional(),
      subject: z.string().min(5, 'Subject is too short'),
      message: z.string().min(10, 'Message is too short'),
    }),
  }),

  replyToTicket: z.object({
    params: z.object({
      id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Ticket ID'),
    }),
    body: z.object({
      message: z.string().min(1, 'Message is required'),
    }),
  }),
};

module.exports = profileValidator;

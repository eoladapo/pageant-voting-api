import axios from 'axios';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_BASE_URL = 'https://api.paystack.co';

class PaystackService {
  constructor() {
    this.axios = axios.create({
      baseURL: PAYSTACK_BASE_URL,
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Initialize a payment transaction
   * @param {Object} data - Payment data
   * @returns {Promise<Object>} - Payment initialization response
   */
  async initializePayment(data) {
    try {
      const response = await this.axios.post('/transaction/initialize', {
        email: data.email,
        amount: data.amount * 100, // Paystack amount in kobo
        reference: data.reference,
        callback_url: data.callbackUrl,
        metadata: {
          fullName: data.fullName,
          phone: data.phone,
          candidateId: data.candidateId,
          numberOfVotes: data.numberOfVotes,
          custom_fields: [
            {
              display_name: 'Full Name',
              variable_name: 'full_name',
              value: data.fullName,
            },
            {
              display_name: 'Phone',
              variable_name: 'phone',
              value: data.phone,
            },
          ],
        },
      });

      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('Paystack initialization error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Payment initialization failed');
    }
  }

  /**
   * Verify a payment transaction
   * @param {String} reference - Payment reference
   * @returns {Promise<Object>} - Verification response
   */
  async verifyPayment(reference) {
    try {
      const response = await this.axios.get(`/transaction/verify/${reference}`);
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('Paystack verification error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Payment verification failed');
    }
  }

  /**
   * Get transaction details
   * @param {String} id - Transaction ID
   * @returns {Promise<Object>} - Transaction details
   */
  async getTransaction(id) {
    try {
      const response = await this.axios.get(`/transaction/${id}`);
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('Paystack get transaction error:', error.response?.data || error.message);
      throw new Error('Failed to get transaction details');
    }
  }
}

export default new PaystackService();

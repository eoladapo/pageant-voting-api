import axios from 'axios';

const FLUTTERWAVE_SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY;
const FLUTTERWAVE_BASE_URL = 'https://api.flutterwave.com/v3';

class FlutterwaveService {
  constructor() {
    // Debug: Log the secret key format (first 10 chars only for security)
    console.log('🔑 Flutterwave Secret Key (first 10 chars):', FLUTTERWAVE_SECRET_KEY?.substring(0, 10));
    console.log('🔑 Secret Key length:', FLUTTERWAVE_SECRET_KEY?.length);
    console.log('🔑 Secret Key exists:', !!FLUTTERWAVE_SECRET_KEY);

    this.axios = axios.create({
      baseURL: FLUTTERWAVE_BASE_URL,
      headers: {
        Authorization: `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
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
      console.log('🚀 Initializing Flutterwave payment...');
      console.log('📧 Email:', data.email);
      console.log('💰 Amount:', data.amount);

      const payload = {
        tx_ref: data.reference,
        amount: data.amount,
        currency: 'NGN',
        redirect_url: data.callbackUrl,
        customer: {
          email: data.email,
          name: data.fullName,
          phonenumber: data.phone,
        },
        customizations: {
          title: 'Pageant Voting',
          description: `${data.numberOfVotes || 'Registration'} vote(s) for candidate`,
          logo: 'https://your-logo-url.com/logo.png',
        },
      };

      // Add metadata only if it exists
      if (data.candidateId) {
        payload.meta = {
          candidateId: data.candidateId,
          numberOfVotes: data.numberOfVotes,
          fullName: data.fullName,
          phone: data.phone,
        };
      }

      console.log('📦 Payload:', JSON.stringify(payload, null, 2));

      const response = await this.axios.post('/payments', payload);

      console.log('✅ Flutterwave response:', response.data);

      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('❌ Flutterwave initialization error:', error.response?.data || error.message);
      console.error('❌ Error status:', error.response?.status);
      console.error('❌ Error headers:', error.response?.headers);
      throw new Error(error.response?.data?.message || 'Payment initialization failed');
    }
  }

  /**
   * Verify a payment transaction
   * @param {String} transactionId - Transaction ID
   * @returns {Promise<Object>} - Verification response
   */
  async verifyPayment(transactionId) {
    try {
      const response = await this.axios.get(`/transactions/${transactionId}/verify`);
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('Flutterwave verification error:', error.response?.data || error.message);
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
      const response = await this.axios.get(`/transactions/${id}`);
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('Flutterwave get transaction error:', error.response?.data || error.message);
      throw new Error('Failed to get transaction details');
    }
  }
}

export default new FlutterwaveService();

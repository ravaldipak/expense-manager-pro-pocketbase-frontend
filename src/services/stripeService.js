import { loadStripe } from '@stripe/stripe-js';
import PocketBase from 'pocketbase';

// Create PocketBase instance for direct database operations
const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL || 'http://127.0.0.1:8090');

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

class StripeService {
  constructor() {
    this.baseURL = import.meta.env.VITE_STRIPE_API_URL || 'https://api.stripe.com/v1';
    this.secretKey = import.meta.env.VITE_STRIPE_SECRET_KEY;
  }

  /**
   * Create a Stripe payment link for user subscription
   * @param {Object} params - Payment parameters
   * @param {string} params.userId - PocketBase user ID
   * @param {string} params.email - User email
   * @param {string} params.name - User full name
   * @param {number} params.amount - Amount in cents (default: 1000 for $10)
   * @returns {Promise<string>} Payment link URL
   */
  async createPaymentLink({ userId, email, name, amount = 1000 }) {
    try {
      const response = await fetch(`${this.baseURL}/payment_links`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.secretKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          'line_items[0][price_data][currency]': 'usd',
          'line_items[0][price_data][product_data][name]': 'Expense Manager Pro Subscription',
          'line_items[0][price_data][unit_amount]': amount.toString(),
          'line_items[0][quantity]': '1',
          'metadata[user_id]': userId,
          'metadata[user_email]': email,
          'metadata[user_name]': name,
          'after_completion[type]': 'redirect',
          'after_completion[redirect][url]': `${window.location.origin}/payment-success?user_id=${userId}&email=${email}&name=${name}`,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to create payment link');
      }

      const paymentLink = await response.json();
      return paymentLink.url;
    } catch (error) {
      console.error('Error creating payment link:', error);
      throw error;
    }
  }

  /**
   * Create a checkout session (alternative to payment links)
   * @param {Object} params - Checkout parameters
   * @param {string} params.userId - PocketBase user ID
   * @param {string} params.email - User email
   * @param {string} params.name - User full name
   * @param {number} params.amount - Amount in cents
   * @returns {Promise<string>} Checkout session URL
   */
  async createCheckoutSession({ userId, email, name, passwordConfirm, licenseKey, amount = 1000 }) {
    try {
      const response = await fetch(`${this.baseURL}/checkout/sessions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.secretKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          'payment_method_types[0]': 'card',
          'line_items[0][price_data][currency]': 'usd',
          'line_items[0][price_data][product_data][name]': 'Expense Manager Pro Subscription',
          'line_items[0][price_data][unit_amount]': amount.toString(),
          'line_items[0][quantity]': '1',
          'mode': 'payment',
          'success_url': `${window.location.origin}/payment-success?session_id={CHECKOUT_SESSION_ID}&user_id=${userId}&email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}&passwordConfirm=${encodeURIComponent(passwordConfirm)}&licenseKey=${encodeURIComponent(licenseKey)}`,
          'cancel_url': `${window.location.origin}/payment-cancelled?user_id=${userId}`,
          'customer_email': email,
          'metadata[user_id]': userId,
          'metadata[user_email]': email,
          'metadata[user_name]': name,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to create checkout session');
      }

      const session = await response.json();
      return session.url;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      throw error;
    }
  }

  /**
   * Verify payment status
   * @param {string} sessionId - Stripe session ID
   * @returns {Promise<Object>} Payment status
   */
  async verifyPayment(sessionId) {
    try {
      const response = await fetch(`${this.baseURL}/checkout/sessions/${sessionId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.secretKey}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to verify payment');
      }

      const session = await response.json();
      return {
        status: session.payment_status,
        userId: session.metadata?.user_id,
        email: session.metadata?.user_email,
        name: session.metadata?.user_name,
      };
    } catch (error) {
      console.error('Error verifying payment:', error);
      throw error;
    }
  }

  /**
   * Handle webhook events from Stripe
   * @param {Object} event - Stripe webhook event
   * @param {Function} onSuccess - Callback for successful payment
   * @param {Function} onFailure - Callback for failed payment
   */
  async handleWebhookEvent(event, onSuccess, onFailure) {
    try {
      switch (event.type) {
        case 'checkout.session.completed':
          const session = event.data.object;
          if (session.payment_status === 'paid') {
            await onSuccess({
              userId: session.metadata.user_id,
              email: session.metadata.user_email,
              name: session.metadata.user_name,
              sessionId: session.id,
            });
          }
          break;

        case 'checkout.session.expired':
        case 'payment_intent.payment_failed':
          const failedSession = event.data.object;
          await onFailure({
            userId: failedSession.metadata?.user_id,
            email: failedSession.metadata?.user_email,
            reason: 'Payment failed or expired',
          });
          break;

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }
    } catch (error) {
      console.error('Error handling webhook event:', error);
      throw error;
    }
  }

  /**
   * Create a payment record in PocketBase
   * @param {Object} paymentData - Payment record data
   * @param {string} paymentData.payment_id - Stripe payment intent ID
   * @param {string} paymentData.user_id - PocketBase user ID
   * @param {number} paymentData.price - Payment amount in cents
   * @param {string} paymentData.currency - Payment currency (default: 'usd')
   * @param {string} paymentData.status - Payment status
   * @param {string} paymentData.stripe_session_id - Stripe session ID (optional)
   * @param {string} paymentData.description - Payment description (optional)
   * @returns {Promise<Object>} Created payment record
   */
  async createPaymentRecord({
    payment_id,
    user_id,
    price,
    currency = 'usd',
    status,
    stripe_session_id = null,
    description = 'Monthly subscription'
  }) {
    try {
      // Check if payment record already exists
      const existingPayment = await this.getPaymentByStripeId(payment_id);
      if (existingPayment) {
        console.log('Payment record already exists:', existingPayment.id);
        return existingPayment;
      }

      const paymentRecord = await pb.collection('stripe_payments').create({
        payment_id,
        user_id,
        payment_date: new Date().toISOString(),
        price,
        currency,
        status,
        stripe_session_id,
        description
      });

      console.log('Payment record created:', paymentRecord.id);
      return paymentRecord;
    } catch (error) {
      console.error('Error creating payment record:', error);
      throw error;
    }
  }

  /**
   * Get payment records for a user
   * @param {string} userId - PocketBase user ID
   * @param {number} page - Page number (default: 1)
   * @param {number} perPage - Records per page (default: 50)
   * @returns {Promise<Object>} Payment records list
   */
  async getUserPayments(userId, page = 1, perPage = 50) {
    try {
      const payments = await pb.collection('stripe_payments').getList(page, perPage, {
        filter: `user_id = "${userId}"`,
        sort: '-payment_date',
        expand: 'user_id'
      });

      return payments;
    } catch (error) {
      console.error('Error fetching user payments:', error);
      throw error;
    }
  }

  /**
   * Get a specific payment record by payment ID
   * @param {string} paymentId - Stripe payment intent ID
   * @returns {Promise<Object>} Payment record
   */
  async getPaymentByStripeId(paymentId) {
    try {
      const payments = await pb.collection('stripe_payments').getList(1, 1, {
        filter: `payment_id = "${paymentId}"`,
        expand: 'user_id'
      });

      return payments.items.length > 0 ? payments.items[0] : null;
    } catch (error) {
      console.error('Error fetching payment by Stripe ID:', error);
      throw error;
    }
  }

  /**
   * Update payment record status
   * @param {string} recordId - PocketBase payment record ID
   * @param {string} status - New payment status
   * @returns {Promise<Object>} Updated payment record
   */
  async updatePaymentStatus(recordId, status) {
    try {
      const updatedRecord = await pb.collection('stripe_payments').update(recordId, {
        status
      });

      console.log('Payment status updated:', recordId, status);
      return updatedRecord;
    } catch (error) {
      console.error('Error updating payment status:', error);
      throw error;
    }
  }

  /**
   * Get payment statistics for a user
   * @param {string} userId - PocketBase user ID
   * @returns {Promise<Object>} Payment statistics
   */
  async getPaymentStats(userId) {
    try {
      const payments = await pb.collection('stripe_payments').getFullList({
        filter: `user_id = "${userId}"`,
        sort: '-payment_date'
      });

      const stats = {
        totalPayments: payments.length,
        totalAmount: payments.reduce((sum, payment) => sum + payment.price, 0),
        successfulPayments: payments.filter(p => p.status === 'succeeded').length,
        failedPayments: payments.filter(p => p.status === 'failed').length,
        lastPaymentDate: payments.length > 0 ? payments[0].payment_date : null
      };

      return stats;
    } catch (error) {
      console.error('Error fetching payment stats:', error);
      throw error;
    }
  }
}

export default new StripeService();
export { stripePromise };
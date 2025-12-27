import { usePocketBase } from '../contexts/PocketBase';
import stripeService from './stripeService';
import emailService from './emailService';
import PocketBase from 'pocketbase';

const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL || 'http://127.0.0.1:8090');

/**
 * WebhookService handles Stripe webhook events
 * NOTE: This service is designed for server-side webhook handling only.
 * Frontend payment processing is handled directly in PaymentSuccess.jsx to prevent duplicates.
 * This service processes payment confirmations, subscription updates, and other Stripe events
 * that come from Stripe's webhook endpoints (requires server-side implementation).
 */
class WebhookService {
  constructor() {
    // Using direct PocketBase instance instead of initialization
  }

  /**
   * Handle Stripe webhook events
   * @param {Object} event - Stripe webhook event
   */
  async handleStripeWebhook(event) {
    try {
      console.log('Processing Stripe webhook:', event.type);

      switch (event.type) {
        case 'checkout.session.completed':
          await this.handlePaymentSuccess(event.data.object);
          break;

        case 'checkout.session.expired':
        case 'payment_intent.payment_failed':
          await this.handlePaymentFailure(event.data.object);
          break;

        case 'invoice.payment_succeeded':
          await this.handleSubscriptionPayment(event.data.object);
          break;

        case 'customer.subscription.deleted':
          await this.handleSubscriptionCancelled(event.data.object);
          break;

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }
    } catch (error) {
      console.error('Error processing webhook:', error);
      throw error;
    }
  }

  /**
   * Handle successful payment
   * @param {Object} session - Stripe checkout session
   */
  async handlePaymentSuccess(session) {
    try {
      let userId = session.metadata?.user_id;
      if (!userId) {
        // Find user by session customer email
        const users = await pb.collection('users').getList(1, 1, {
          filter: `email = "${session.customer_details?.email || session.customer_email}"`
        });
        
        if (users.items.length === 0) {
          throw new Error('User not found by email in session');
        }
        
        userId = users.items[0].id;
      }

      // Check if payment record already exists to prevent duplicates
      const existingPayments = await pb.collection('stripe_payments').getList(1, 1, {
        filter: `stripe_session_id = "${session.id}"`
      });
      if (existingPayments.items.length == 0) {
        // Create payment record in stripe_payments collection
        await stripeService.createPaymentRecord({
          payment_id: session.payment_intent || session.id,
          user_id: userId,
          price: session.amount_total || 1000, // Use session amount or default to $10
          currency: session.currency || 'usd',
          status: 'succeeded',
          stripe_session_id: session.id,
          description: 'Subscription payment via webhook'
        });
      } else {
        console.log(`Payment record already exists for session ${session.id}`);
      }

      // Send welcome email
      await this.sendWelcomeEmail(userId);

      console.log(`Payment successful for user ${userId}`);
    } catch (error) {
      console.error('Error handling payment success:', error);
      throw error;
    }
  }

  /**
   * Handle failed or cancelled payment
   * @param {Object} session - Stripe checkout session
   */
  async handlePaymentFailure(session) {
    try {
      const userId = session.metadata?.user_id;
      if (!userId) {
        console.log('No user ID found in failed payment session');
        return;
      }

      // Delete the user record
      await pb.collection('users').delete(userId);

      console.log(`User ${userId} deleted due to payment failure`);
    } catch (error) {
      console.error('Error handling payment failure:', error);
      // Don't throw here as we don't want to retry deletion
    }
  }

  /**
   * Handle recurring subscription payment
   * @param {Object} invoice - Stripe invoice
   */
  async handleSubscriptionPayment(invoice) {
    try {
      const customerId = invoice.customer;
      
      // Find user by Stripe customer ID
      const users = await pb.collection('users').getList(1, 1, {
        filter: `stripeCustomerId = "${customerId}"`
      });

      if (users.items.length === 0) {
        console.log(`No user found for customer ${customerId}`);
        return;
      }

      const user = users.items[0];
      
      // Check if payment record already exists to prevent duplicates
      const existingPayments = await pb.collection('stripe_payments').getList(1, 1, {
        filter: `stripe_session_id = "${invoice.id}"`
      });

      if (existingPayments.items.length === 0) {
        await stripeService.createPaymentRecord({
          payment_id: invoice.payment_intent || invoice.id,
          user_id: user.id,
          price: invoice.amount_paid || 1000,
          currency: invoice.currency || 'usd',
          status: 'succeeded',
          stripe_session_id: invoice.id,
          description: 'Recurring subscription payment'
        });
      } else {
        console.log(`Payment record already exists for invoice ${invoice.id}`);
      }

      console.log(`Subscription payment processed for user ${user.id}`);
    } catch (error) {
      console.error('Error handling subscription payment:', error);
      throw error;
    }
  }

  /**
   * Handle subscription cancellation
   * @param {Object} subscription - Stripe subscription
   */
  async handleSubscriptionCancelled(subscription) {
    try {
      const customerId = subscription.customer;
      
      // Find user by Stripe customer ID
      const users = await pb.collection('users').getList(1, 1, {
        filter: `stripeCustomerId = "${customerId}"`
      });

      if (users.items.length === 0) {
        console.log(`No user found for customer ${customerId}`);
        return;
      }

      const user = users.items[0];

      console.log(`Subscription cancelled for user ${user.id}`);
    } catch (error) {
      console.error('Error handling subscription cancellation:', error);
      throw error;
    }
  }

  /**
   * Send welcome email to user
   * @param {string} userId - User ID
   */
  async sendWelcomeEmail(userId) {
    try {
      const user = await pb.collection('users').getOne(userId);
      
      // Use the dedicated email service with SMTP
      await emailService.sendWelcomeEmail({
        email: user.email,
        name: user.name,
        userId: userId
      });

      console.log(`Welcome email sent successfully to ${user.email}`);
    } catch (error) {
      console.error('Error sending welcome email:', error);
      // Don't throw here as email failure shouldn't break the payment flow
    }
  }
}

export default new WebhookService();
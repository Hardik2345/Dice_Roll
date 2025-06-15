// shopifyService.js
const axios = require('axios');

class ShopifyService {
  constructor() {
    this.storeUrl = process.env.SHOPIFY_STORE_URL;
    this.accessToken = process.env.SHOPIFY_ACCESS_TOKEN;
    this.apiVersion = '2024-01'; // Update to latest API version as needed
    this.baseUrl = `https://${this.storeUrl}/admin/api/${this.apiVersion}`;
  }

  // Helper method for Shopify API requests
  async makeRequest(endpoint, method = 'GET', data = null) {
    try {
      const response = await axios({
        method,
        url: `${this.baseUrl}${endpoint}`,
        headers: {
          'X-Shopify-Access-Token': this.accessToken,
          'Content-Type': 'application/json'
        },
        data
      });
      return response.data;
    } catch (error) {
      console.error('Shopify API Error:', error.response?.data || error.message);
      throw error;
    }
  }

  // Create a price rule (discount configuration)
  async createPriceRule(discountPercentage, code) {
    const priceRuleData = {
      price_rule: {
        title: `Dice Roll Discount ${discountPercentage}% - ${code}`,
        target_type: "line_item",
        target_selection: "all",
        allocation_method: "across",
        value_type: "percentage",
        value: `-${discountPercentage}`,
        customer_selection: "all",
        starts_at: new Date().toISOString(),
        usage_limit: 1, // Each code can only be used once
      }
    };

    const priceRule = await this.makeRequest('/price_rules.json', 'POST', priceRuleData);
    return priceRule.price_rule;
  }

  // Create a discount code for a price rule
  async createDiscountCode(priceRuleId, code) {
    const discountCodeData = {
      discount_code: {
        code: code
      }
    };

    const discountCode = await this.makeRequest(
      `/price_rules/${priceRuleId}/discount_codes.json`, 
      'POST', 
      discountCodeData
    );
    return discountCode.discount_code;
  }

  // Main method to create a complete discount
  async createDiceRollDiscount(diceResult, userName, userMobile) {
    const discountPercentages = {
      1: 10,
      2: 15,
      3: 20,
      4: 25,
      5: 30,
      6: 50
    };

    const percentage = discountPercentages[diceResult];
    
    // Generate unique code
    const timestamp = Date.now();
    const code = `DICE${percentage}_${timestamp}`;

    try {
      // Step 1: Create price rule
      const priceRule = await this.createPriceRule(percentage, code);
      
      // Step 2: Create discount code
      const discountCode = await this.createDiscountCode(priceRule.id, code);

      return {
        code: discountCode.code,
        percentage,
        priceRuleId: priceRule.id,
        discountCodeId: discountCode.id,
        shopifyUrl: `https://${this.storeUrl}/discount/${code}`
      };
    } catch (error) {
      console.error('Failed to create Shopify discount:', error);
      throw new Error('Failed to create discount code in Shopify');
    }
  }

  // Check if a discount code exists
  async checkDiscountCode(code) {
    try {
      const response = await this.makeRequest(`/discount_codes/lookup.json?code=${code}`, 'GET');
      return response.discount_code;
    } catch (error) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  // Delete a discount (cleanup)
  async deleteDiscount(priceRuleId) {
    try {
      await this.makeRequest(`/price_rules/${priceRuleId}.json`, 'DELETE');
      return true;
    } catch (error) {
      console.error('Failed to delete discount:', error);
      return false;
    }
  }

  // Create discount with expiry date
  async createDiscountWithExpiry(diceResult, userName, userMobile, expiryDays = 30) {
    const discountPercentages = {
      1: 10,
      2: 15,
      3: 20,
      4: 25,
      5: 30,
      6: 50
    };

    const percentage = discountPercentages[diceResult];
    const timestamp = Date.now();
    const code = `DICE${percentage}_${timestamp}`;
    
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + expiryDays);

    const priceRuleData = {
      price_rule: {
        title: `Dice Roll ${percentage}% - ${userName}`,
        target_type: "line_item",
        target_selection: "all",
        allocation_method: "across",
        value_type: "percentage",
        value: `-${percentage}`,
        customer_selection: "all",
        starts_at: new Date().toISOString(),
        ends_at: expiryDate.toISOString(), // Discount expires after specified days
        usage_limit: 1,
      }
    };

    try {
      const priceRule = await this.makeRequest('/price_rules.json', 'POST', { price_rule: priceRuleData.price_rule });
      const discountCode = await this.createDiscountCode(priceRule.price_rule.id, code);

      return {
        code: discountCode.code,
        percentage,
        priceRuleId: priceRule.price_rule.id,
        discountCodeId: discountCode.id,
        shopifyUrl: `https://${this.storeUrl}/discount/${code}`,
        expiresAt: expiryDate
      };
    } catch (error) {
      console.error('Failed to create Shopify discount with expiry:', error);
      throw new Error('Failed to create discount code in Shopify');
    }
  }

  // Get discount usage information
  async getDiscountUsage(priceRuleId) {
    try {
      const response = await this.makeRequest(`/price_rules/${priceRuleId}/discount_codes.json`, 'GET');
      return response.discount_codes;
    } catch (error) {
      console.error('Failed to get discount usage:', error);
      return [];
    }
  }
}

module.exports = ShopifyService;
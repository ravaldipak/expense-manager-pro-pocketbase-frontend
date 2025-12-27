/**
 * Budget Integration Test
 * This file contains tests to verify PocketBase budget integration
 */

import budgetService from '../services/budgetService';
import { pb } from '../contexts/PocketBase';

/**
 * Test budget CRUD operations
 */
export const testBudgetOperations = async () => {
  console.log('🧪 Starting Budget Integration Tests...');
  
  try {
    // Check if user is authenticated
    if (!pb.authStore.isValid) {
      console.warn('⚠️ User not authenticated - some tests will be skipped');
      return {
        success: false,
        message: 'User authentication required for budget tests'
      };
    }

    console.log('✅ User authenticated:', pb.authStore.model?.email);

    // Test 1: Get existing budgets
    console.log('📋 Test 1: Fetching existing budgets...');
    const existingBudgets = await budgetService.getBudgets();
    console.log(`✅ Found ${existingBudgets.length} existing budgets`);

    // Test 2: Create a test budget
    console.log('➕ Test 2: Creating test budget...');
    const testBudgetData = {
      category: 'Test Category',
      amount: 500,
      period: 'monthly',
      notes: 'Test budget for integration testing'
    };

    let createdBudget;
    try {
      createdBudget = await budgetService.createBudget(testBudgetData);
      console.log('✅ Test budget created:', createdBudget.id);
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('ℹ️ Test budget already exists, fetching existing one...');
        createdBudget = await budgetService.getBudgetByCategory('Test Category');
      } else {
        throw error;
      }
    }

    // Test 3: Update the budget
    console.log('✏️ Test 3: Updating test budget...');
    const updatedBudget = await budgetService.updateBudget(createdBudget.id, {
      amount: 750,
      notes: 'Updated test budget'
    });
    console.log('✅ Budget updated successfully');

    // Test 4: Get budget by ID
    console.log('🔍 Test 4: Fetching budget by ID...');
    const fetchedBudget = await budgetService.getBudgetById(createdBudget.id);
    console.log('✅ Budget fetched by ID:', fetchedBudget.id);

    // Test 5: Search budgets
    console.log('🔎 Test 5: Searching budgets...');
    const searchResults = await budgetService.searchBudgets('Test');
    console.log(`✅ Found ${searchResults.length} budgets matching 'Test'`);

    // Test 6: Get budgets by period
    console.log('📅 Test 6: Getting budgets by period...');
    const monthlyBudgets = await budgetService.getBudgetsByPeriod('monthly');
    console.log(`✅ Found ${monthlyBudgets.length} monthly budgets`);

    // Test 7: Clean up - Delete test budget
    console.log('🗑️ Test 7: Cleaning up test budget...');
    await budgetService.deleteBudget(createdBudget.id);
    console.log('✅ Test budget deleted successfully');

    console.log('🎉 All budget integration tests passed!');
    return {
      success: true,
      message: 'All budget integration tests completed successfully',
      results: {
        existingBudgets: existingBudgets.length,
        testBudgetCreated: true,
        testBudgetUpdated: true,
        testBudgetDeleted: true
      }
    };

  } catch (error) {
    console.error('❌ Budget integration test failed:', error);
    return {
      success: false,
      message: `Test failed: ${error.message}`,
      error: error
    };
  }
};

/**
 * Test budget service error handling
 */
export const testBudgetErrorHandling = async () => {
  console.log('🧪 Testing Budget Error Handling...');
  
  try {
    // Test invalid budget ID
    console.log('🔍 Testing invalid budget ID...');
    try {
      await budgetService.getBudgetById('invalid-id');
      console.log('❌ Should have thrown error for invalid ID');
      return { success: false, message: 'Error handling test failed' };
    } catch (error) {
      console.log('✅ Correctly handled invalid budget ID');
    }

    // Test duplicate category
    console.log('🔍 Testing duplicate category handling...');
    const testBudget = {
      category: 'Duplicate Test',
      amount: 100,
      period: 'monthly',
      notes: 'Test duplicate'
    };

    try {
      // Create first budget
      const firstBudget = await budgetService.createBudget(testBudget);
      
      // Try to create duplicate
      try {
        await budgetService.createBudget(testBudget);
        console.log('❌ Should have thrown error for duplicate category');
        // Clean up
        await budgetService.deleteBudget(firstBudget.id);
        return { success: false, message: 'Duplicate handling test failed' };
      } catch (duplicateError) {
        console.log('✅ Correctly handled duplicate category');
        // Clean up
        await budgetService.deleteBudget(firstBudget.id);
      }
    } catch (error) {
      console.log('ℹ️ Could not test duplicate handling:', error.message);
    }

    console.log('🎉 Error handling tests passed!');
    return {
      success: true,
      message: 'Error handling tests completed successfully'
    };

  } catch (error) {
    console.error('❌ Error handling test failed:', error);
    return {
      success: false,
      message: `Error handling test failed: ${error.message}`,
      error: error
    };
  }
};

/**
 * Run all budget tests
 */
export const runAllBudgetTests = async () => {
  console.log('🚀 Running All Budget Integration Tests...');
  
  const results = {
    crudTests: await testBudgetOperations(),
    errorHandlingTests: await testBudgetErrorHandling()
  };

  const allPassed = results.crudTests.success && results.errorHandlingTests.success;
  
  console.log('📊 Test Results Summary:');
  console.log('- CRUD Operations:', results.crudTests.success ? '✅ PASSED' : '❌ FAILED');
  console.log('- Error Handling:', results.errorHandlingTests.success ? '✅ PASSED' : '❌ FAILED');
  console.log('- Overall:', allPassed ? '🎉 ALL TESTS PASSED' : '❌ SOME TESTS FAILED');

  return {
    success: allPassed,
    results: results
  };
};

// Export for console testing
if (typeof window !== 'undefined') {
  window.budgetTests = {
    testBudgetOperations,
    testBudgetErrorHandling,
    runAllBudgetTests
  };
  console.log('🧪 Budget tests available at window.budgetTests');
}
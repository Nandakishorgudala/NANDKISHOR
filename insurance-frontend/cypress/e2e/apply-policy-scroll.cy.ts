describe('Customer Dashboard - Apply for Policy', () => {

    beforeEach(() => {
        // Intercept API calls to mock data so we don't rely on the actual backend state
        cy.intercept('POST', '/api/auth/login', {
            statusCode: 200,
            body: {
                token: 'fake-jwt-token',
                user: { id: 1, email: 'test@example.com', fullName: 'Test User', role: 'Customer' }
            }
        }).as('login');

        cy.intercept('GET', '/api/policies/customer/1', {
            statusCode: 200,
            body: []
        }).as('getCustomerPolicies');

        cy.intercept('GET', '/api/policyproducts', {
            statusCode: 200,
            body: [
                { id: 1, name: 'Basic Home Insurance', description: 'Protects your home.', basePremium: 1000, coverageAmount: 250000, type: 'Home' },
                { id: 2, name: 'Premium Auto', description: 'Protects your car.', basePremium: 800, coverageAmount: 50000, type: 'Auto' },
                { id: 3, name: 'Life Insurance', description: 'Protects your family.', basePremium: 500, coverageAmount: 1000000, type: 'Life' }
            ]
        }).as('getPolicyProducts');

        // Login programmatically or via UI (simulating token set)
        cy.window().then((win) => {
            win.localStorage.setItem('token', 'fake-jwt-token');
            win.localStorage.setItem('user', JSON.stringify({ id: 1, email: 'test@example.com', fullName: 'Test User', role: 'Customer' }));
        });
    });

    it('should scroll to the application form and set focus when "Apply Now" is clicked', () => {
        // 1. Visit the dashboard
        cy.visit('/dashboard/customer');

        // We expect the available policies to be loaded
        cy.wait('@getPolicyProducts');

        // 2. Switch to 'Apply for Policy' tab
        cy.contains('nav a', 'Apply for Policy').click();

        // 3. Find the first 'Apply Now' button and click it
        // Wait a brief moment for rendering
        cy.get('.policy-card.available').first().contains('Apply Now').click();

        // 4. Verify that the form container renders
        cy.get('div[#applicationFormContainer], div[tabindex="-1"]').should('exist').as('formContainer');

        // 5. Verify the window scrolled down (scrollY > 0)
        // We wait 500ms for the smooth scroll animation to finish
        cy.wait(500);
        cy.window().its('scrollY').should('be.greaterThan', 50);

        // 6. Verify the form container received focus for accessibility
        cy.get('@formContainer').should('have.focus');

        // 7. Verify ARIA live region is polite
        cy.get('@formContainer').should('have.attr', 'aria-live', 'polite');
    });
});

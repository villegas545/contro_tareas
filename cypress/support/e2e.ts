// cypress/support/e2e.ts
import './commands'

// Trigger Test Mode in Application
beforeEach(() => {
    cy.visit('/', {
        onBeforeLoad(win) {
            // @ts-ignore
            win.Cypress = Cypress; // Expose Cypress to window so app can detect
        },
    });
});

Cypress.on('uncaught:exception', (err, runnable) => {
    // returning false here prevents Cypress from failing the test
    // We ignore exceptions to allow UI testing despite background sync errors
    return false
})

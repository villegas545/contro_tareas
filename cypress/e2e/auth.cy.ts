describe('Authentication Flow', () => {
    // beforeEach visit is handled globally in support/e2e.ts

    it('should allow a parent to log in and log out', () => {
        // Attempt Login
        cy.contains('Usuario').should('be.visible');
        cy.get('input').first().clear().type('papa');
        cy.contains('Contraseña').should('be.visible');
        cy.get('input').eq(1).clear().type('123');
        cy.contains('Entrar').click();

        // Verify Dashboard Access
        cy.contains('Monitoreo', { timeout: 15000 }).should('be.visible');
        cy.contains('Hola,').should('be.visible');
        cy.contains('Papá').should('be.visible');

        // Logout
        cy.contains('Salir').click();
        cy.contains('Entrar').should('be.visible');
    });
});

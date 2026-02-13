describe('Statistics & Reporting', () => {
    beforeEach(() => {
        cy.visit('/');
        cy.window().should('have.property', 'testContext');
        cy.window().then((win: any) => {
            win.testContext.reset();
        });

        // Login
        cy.get('input[placeholder^="Usuario"]').clear().type('papa');
        cy.get('input[placeholder^="Contraseña"]').clear().type('123');
        cy.contains('Entrar').click();
    });

    it('should open statistics modal and display data', () => {
        // Find Stats button in Header
        // Usually text "Stats" or "Estadísticas" or icon.
        cy.contains('Stats').click({ force: true });

        // Verify Modal
        cy.contains('Estadísticas').should('be.visible');

        // Check for key elements

        cy.contains('Semana Actual').should('be.visible');

        // Check for Data Sections
        cy.contains('Puntos').should('be.visible');
        cy.contains('Pendientes').should('be.visible');

        // Close
        cy.contains('Cerrar').click({ force: true });
        cy.contains('Estadísticas').should('not.exist');
    });
});

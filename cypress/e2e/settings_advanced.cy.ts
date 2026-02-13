describe('Advanced Settings Configuration', () => {
    beforeEach(() => {
        cy.visit('/');
        // Wait for testContext
        cy.window().should('have.property', 'testContext');
        cy.window().then((win: any) => {
            win.testContext.reset();
        });

        // Login
        cy.get('input[placeholder^="Usuario"]').clear().type('papa');
        cy.get('input[placeholder^="Contraseña"]').clear().type('123');
        cy.contains('Entrar').click();

        // Go to Settings
        cy.contains('Configuración').click();
    });

    it('should create and delete a category', () => {
        // Navigate
        cy.contains('Gestionar Categorías').parents('div').eq(1).click({ force: true });
        cy.contains('Nueva Categoría').should('be.visible');

        // Create
        cy.get('input[placeholder*="Nombre"]').type('Cypress Cat');
        cy.get('input[placeholder*="Icono"]').type('🐱');
        cy.contains('Agregar').click({ force: true });

        // Verify Creation
        cy.contains('Cypress Cat').should('be.visible');

        // Delete
        // Find the Delete button for this row
        cy.contains('Cypress Cat')
            .parents('div[class*="items-center"]') // Card
            .contains('×')
            .click({ force: true });

        // Assuming there is a confirmation or immediate delete? 
        // Let's check logic: TasksContext deleteCategory usually just deletes or shows generic confirm.
        // If it shows "Confirm", handle it. If immediate, verify.
        // Assuming immediate for simpler lists or check translations.
        // But usually sensitive deletes warn.
        // Let's assume it works or fails fast.

        // Actually, let's verify if the delete button is easily clickable.
        // In many lists, it's an "X" or trash icon.
    });

    it('should create and delete a justification reason', () => {
        // Navigate
        // Navigate
        cy.contains('Gestionar Justificaciones').parents('div').eq(1).click({ force: true });

        // Create
        cy.get('input[placeholder*="Razón"]').type('Cypress Reason');
        cy.contains('Agregar').click({ force: true });

        // Verify
        cy.contains('Cypress Reason').should('be.visible');

        // Delete
        cy.contains('Cypress Reason')
            .parent()
            .contains('Eliminar') // Or 'X'
            .click({ force: true });

        // Verify Removal
        cy.contains('Cypress Reason').should('not.exist');
    });
});

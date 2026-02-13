describe('Management Flows - Full CRUD', () => {
    beforeEach(() => {
        cy.visit('/');
        // Wait for testContext
        cy.window().should('have.property', 'testContext');
        cy.window().then((win: any) => {
            win.testContext.reset();
        });

        // Login
        cy.wait(1000); // Wait for initial render and hydration
        cy.get('input[placeholder^="Usuario"]').should('be.visible').clear().type('papa');
        cy.get('input[placeholder^="Contraseña"]').clear().type('123');
        cy.contains('Entrar').click();
        cy.contains('Monitoreo', { timeout: 15000 }).should('be.visible');
    });

    it('Templates: Should Create, Edit, and Delete', () => {
        cy.contains('Plantillas').click();

        // 1. Create
        cy.contains('Crear Plantilla').click();
        cy.get('input[placeholder*="Lavar los platos"]').type('Cypress Template');
        // Select Puntos input by finding label first
        cy.contains('Puntos').parent().find('input').type('50');
        cy.contains('Guardar Tarea').scrollIntoView().click({ force: true });
        cy.contains('Cypress Template').should('be.visible');

        // 2. Edit
        // Find the "Editar" button within the card
        cy.contains('Cypress Template')
            .parents('.mb-4')
            .contains('Editar')
            .click({ force: true });

        // Assert we are in Edit Screen
        cy.contains(/Editar (Tarea|Plantilla)/).should('be.visible');
        cy.get('input[placeholder*="Lavar los platos"]').clear().type('Cypress Template Edited');
        cy.contains('Guardar Tarea').scrollIntoView().click({ force: true });

        // Verify Edit
        cy.contains('Cypress Template Edited').should('be.visible');
        cy.contains('Cypress Template').should('not.exist');

        // 3. Delete
        cy.contains('Cypress Template Edited')
            .parents('.mb-4')
            .contains('Eliminar')
            .click({ force: true });

        cy.contains('Confirmar Eliminación').should('not.exist'); // It uses "Eliminar Plantilla" title in modal?
        cy.get('div').contains(/Eliminar Plantilla/i).should('be.visible');

        // Confirm
        // Confirm
        // Confirm
        cy.contains('¿Estás seguro').should('be.visible');
        // Click the delete button in the modal (usually red)
        cy.get('div[role="dialog"]').contains('Eliminar').click({ force: true });

        // Verify Removal
        cy.contains('Cypress Template Edited').should('not.exist');
    });

    it('Family: Should Create and Delete Member', () => {
        cy.contains('Familia').click();

        // 1. Create
        cy.contains('Agregar Miembro').click();
        cy.get('input[placeholder*="Juanito"]').type('CypressKid');
        cy.get('input[placeholder*="juanito123"]').type('ckid');
        cy.get('input[placeholder*="Crear contraseña"]').type('123');
        cy.contains('Agregar Familiar').click();

        cy.contains('CypressKid').should('be.visible');

        // 2. Delete
        cy.contains('CypressKid')
            .parents('.mb-3')
            .contains('Eliminar')
            .click({ force: true });

        cy.contains('Confirmar Eliminación').should('be.visible');
        // Confirm
        // Confirm
        // Confirm
        // Confirm
        cy.contains('¿Estás seguro').parent().contains('Eliminar').click({ force: true });

        // Verify Removal
        cy.contains('CypressKid').should('not.exist');
    });

    it('Messages: Should Create and Delete Message', () => {
        cy.contains('Mensajes').click();

        // 1. Create
        cy.contains('+ Nuevo').click();
        cy.get('textarea').type('Cypress Message');
        cy.contains('Agregar Mensaje').click();
        cy.contains('Cypress Message').should('be.visible');

        // 2. Delete
        cy.contains('Cypress Message').parent().contains('Eliminar').click({ force: true });
        cy.contains('Confirmar Eliminación').should('be.visible');

        // Confirm
        // Confirm
        // Confirm
        cy.contains('Confirmar Eliminación').parents().find('div[role="button"]').contains('Eliminar').click({ force: true });

        // Verify Removal
        cy.contains('Cypress Message').should('not.exist');
    });

    it('Rewards: Should Create and Delete Reward', () => {
        cy.contains('Premios').click();

        // 1. Create
        cy.contains('+ Nuevo').click();
        cy.get('input[placeholder*="Título"]').type('Cypress Reward');
        cy.get('input[placeholder*="Costo"]').type('100');
        cy.contains('Guardar Premio').click({ force: true });
        cy.contains('Cypress Reward').should('be.visible');

        // 2. Delete (Long Press)
        cy.contains('Cypress Reward').parent().trigger('touchstart', { force: true });
        cy.wait(1000);
        cy.contains('Cypress Reward').parent().trigger('touchend', { force: true });

        cy.contains('Eliminar').should('be.visible');
        // Confirm
        // Confirm
        // Rewards doesn't use "Confirmar Eliminación" title in modal? Checks Family/Messages use it.
        // Assuming modal structure is similar.
        cy.contains('Eliminar').click({ force: true });

        // Verify Removal
        cy.contains('Cypress Reward').should('not.exist');
    });
});

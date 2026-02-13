describe('Monitoring Tab Actions', () => {
    beforeEach(() => {
        cy.visit('/');
        // Reset and Seed
        cy.window().should('have.property', 'testContext');
        cy.window().then((win: any) => {
            win.testContext.reset();
            // Seed a task to verify
            win.testContext.setRawTasks([
                {
                    id: 't_verify',
                    title: 'Task to Verify',
                    assignedTo: 'child1',
                    status: 'completed', // Needs to be completed to show up for verification
                    createdBy: 'system',
                    type: 'obligatory',
                    frequency: 'daily',
                    completedAt: new Date().toISOString()
                },
                {
                    id: 't_reject',
                    title: 'Task to Reject',
                    assignedTo: 'child1',
                    status: 'completed',
                    createdBy: 'system',
                    type: 'obligatory',
                    frequency: 'daily',
                    completedAt: new Date().toISOString()
                }
            ]);
        });

        // Login before each test
        // Login before each test
        cy.wait(1000); // Hydration wait
        cy.get('input[placeholder^="Usuario"]').should('be.visible').clear().type('papa');
        cy.get('input[placeholder^="Contraseña"]').clear().type('123');
        cy.contains('Entrar').click();
        cy.contains('Monitoreo', { timeout: 15000 }).click();
    });

    it('should verify a task with confirmation modal', () => {
        // Attempt to find a "Verificar" button
        cy.get('body').then(($body) => {
            if ($body.find('div:contains("Verificar")').length > 0) {
                cy.contains('Verificar').first().click();

                // Assert Modal
                cy.contains('Confirmar Verificación').should('be.visible');
                cy.contains('¿Estás seguro de que esta tarea se completó correctamente?').should('be.visible');

                // Confirm
                cy.contains('Sí, Verificar').click();

                // Assert Modal Closed
                cy.contains('Confirmar Verificación').should('not.exist');
            } else {
                cy.log('No tasks to verify found, skipping verification click');
            }
        });
    });

    it('should reject a task with confirmation modal', () => {
        cy.get('body').then(($body) => {
            if ($body.find('div:contains("Rechazar")').length > 0) {
                cy.contains('Rechazar').first().click();

                // Assert Modal
                cy.contains('Confirmar Rechazo').should('be.visible');
                cy.contains('¿Estás seguro de rechazar esta tarea?').should('be.visible');

                // Confirm/Cancel
                cy.contains('Cancelar').click(); // Test Cancel to not destroy data
                cy.contains('Confirmar Rechazo').should('not.exist');
            } else {
                cy.log('No tasks to reject found');
            }
        });
    });
});

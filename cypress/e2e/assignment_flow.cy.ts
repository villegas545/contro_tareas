describe('Assignment Flow', () => {
    beforeEach(() => {
        // Login as Parent
        cy.visit('/');

        // Wait for testContext to be available (App mounted)
        cy.window().should('have.property', 'testContext');

        cy.window().then((win: any) => {
            win.testContext.reset();
            // Ensure a template exists
            win.testContext.setTemplates([
                {
                    id: 'pool_100',
                    title: 'Test Template',
                    assignedTo: 'pool',
                    frequency: 'daily',
                    points: 10,
                    type: 'obligatory',
                    description: 'Test Desc'
                }
            ]);
        });

        cy.get('input[placeholder^="Usuario"]').clear().type('papa');
        cy.get('input[placeholder^="Contraseña"]').clear().type('123');
        cy.contains('Entrar').click();

        // Go to Assignments
        cy.contains('Plantillas').click();
    });

    it('should assign a template to a child', () => {
        // 1. Select the template
        cy.contains('Test Template').should('be.visible');

        // Tap on the card to select it. 
        // ParentTaskCard has on press handler for selection in AssignmentTab
        cy.contains('Test Template').click();

        // 2. Click Floating Assign Button
        // "Asignar {count} Tarea(s)"
        cy.contains('Asignar 1 Tarea(s)').click();

        // 3. Assignment Config Modal
        // "Asignar 1 tareas a:"
        cy.contains('Asignar 1 tareas a:').should('be.visible');

        // Select Child
        // Mock data has "Hijo 1"
        cy.contains('Hijo 1').click();

        // Click First Confirmation
        // "Confirmar Asignación"
        cy.contains('Confirmar Asignación').click();


        // 4. Final Confirmation Modal
        // "Confirmar Asignación" -> "Asignar Tarea"
        cy.contains('Asignar Tarea').click({ force: true });
        cy.wait(1000);

        // 5. Success Check
        // Wait for modal to close or toast to appear (if any), or just wait a bit longer to ensure React state flush
        cy.wait(2000); // Increased wait

        // Verify UI first to ensure render cycle complete
        cy.contains('Asignar Tarea').should('not.exist'); // Modal closed

        // Verify DATA persistence
        cy.window().then((win: any) => {
            const tasks = win.testContext.getState().rawTasks;
            // We started with templates, but rawTasks should now include the assigned task.
            // Look for title 'Test Template'
            const assigned = tasks.find((t: any) => t.title === 'Test Template' && t.assignedTo === 'child1');
            expect(assigned).to.exist;
            expect(assigned.status).to.equal('pending');
        });

        // Optional: Manual close/reload if needed for next tests? 
        // Just leaving it is fine as tests are isolated by visit.
    });

    it('should create a new template', () => {
        cy.contains('Crear Plantilla').click();

        cy.get('input[placeholder="Ej. Lavar los platos"]').type('New Cypress Template');
        cy.get('input[placeholder="Ej. 10"]').type('50');

        // Save
        cy.contains('Guardar Tarea').click();

        // Verify creation
        cy.contains('New Cypress Template').should('be.visible');
    });
});

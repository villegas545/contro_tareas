describe('Child Dashboard Actions', () => {
    beforeEach(() => {
        cy.visit('/');
        // Wait for testContext
        cy.window().should('have.property', 'testContext');

        cy.window().then((win: any) => {
            win.testContext.reset();
            // Seed a reward for store test
            win.testContext.setRewards([
                {
                    id: 'reward_1',
                    title: 'Test Reward',
                    cost: 10,
                    icon: '🍭'
                }
            ]);
            // Ensure child has points via history (optional, mock data has some)
            win.testContext.setHistory([
                {
                    id: 'hist_1',
                    taskId: 't1',
                    assignedTo: 'child1',
                    action: 'completed',
                    status: 'verified',
                    timestamp: new Date().toISOString(),
                    points: 50,
                    taskTitle: 'Previous Task'
                }
            ]);
            // Force refresh tasks
            win.testContext.setRawTasks([...win.testContext.getState().rawTasks]);
        });

        // Login via UI
        cy.get('input[placeholder^="Usuario"]').clear().type('hijo1');
        cy.get('input[placeholder^="Contraseña"]').clear().type('123');
        cy.contains('Entrar').click();
        cy.contains('Hola, Hijo 1', { timeout: 10000 }).should('be.visible');
    });

    it('should view and complete a task', () => {
        // Check for task existence (Use Bañarse as it stays valid longer/is visible)
        cy.contains('Bañarse').should('be.visible');

        // Find the task card and complete it
        // Use a more relaxed selector to find the Terminar button anywhere inside the card
        cy.contains('Bañarse')
            .parents('.mb-4')
            .contains('Terminar')
            .click({ force: true });

        // Verify status change (Pending Review / Esperando)
        cy.contains('Bañarse')
            .parents('.mb-4')
            .should('contain.text', 'Esperando');
    });

    it('should redeem a reward', () => {
        // Switch to Store Tab
        cy.contains('Tienda').click();

        // Check for seeded reward
        cy.contains('Test Reward').should('be.visible');

        // Click reward to redeem (TouchableOpacity)
        cy.contains('Test Reward').click({ force: true });

        // Check confirmation toast/alert (handled)
        // Verify visual feedback: Should appear in Pending Requests or similar
        cy.contains('Solicitudes Pendientes').should('be.visible');
        cy.contains('Test Reward').should('be.visible');
    });

    it('should view history', () => {
        // Switch to History Tab
        cy.contains('📊 Historial').click();

        // Should show stats/history
        cy.contains('Total Puntos').should('be.visible');
    });
});

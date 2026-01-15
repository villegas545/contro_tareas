describe('Redemption Approval Flow', () => {
    beforeEach(() => {
        // Login as Parent
        cy.visit('/');

        // Wait for testContext
        cy.window().should('have.property', 'testContext');

        cy.window().then((win: any) => {
            win.testContext.reset();
            // Seed a pending redemption
            win.testContext.setRedemptions([
                {
                    id: 'red_1',
                    childId: 'child1',
                    rewardId: 'rew_1',
                    rewardTitle: 'Test Reward',
                    cost: 100,
                    status: 'pending',
                    requestDate: new Date().toISOString()
                }
            ]);
            // Ensure users exist
            win.testContext.setUsers([
                { id: 'parent1', name: 'Papá', role: 'parent', username: 'papa', password: '123' },
                { id: 'child1', name: 'Hijo 1', role: 'child', username: 'hijo1', password: '123' }
            ]);
        });

        cy.get('input[placeholder^="Usuario"]').clear().type('papa');
        cy.get('input[placeholder^="Contraseña"]').clear().type('123');
        cy.contains('Entrar').click();

        // Go to Rewards
        cy.contains('Premios').click();
    });

    it('should approve a redemption request', () => {
        // Check for pending request
        // "Solicitado por: Hijo 1"
        cy.contains('Solicitado por: Hijo 1').should('be.visible');
        cy.contains('Test Reward').should('be.visible');

        // Click Approve
        // Button "✅ Aprobar" (rewards.approve_btn)
        cy.contains('✅ Aprobar').click();

        // Confirmation Modal
        // "Aprobar Canje"
        cy.contains('Aprobar Canje').should('be.visible');
        cy.contains('Aprobar Canje').should('be.visible');
        // Click the green confirmation button
        cy.get('div[role="dialog"]').contains('Aprobar').click();
    });

    it('should reject a redemption request', () => {
        // Click Reject
        cy.contains('❌ Rechazar').click();

        // No confirmation for rejection? Or yes?
        // RewardsTab.tsx doesn't seem to have a confirmation for rejection in the code I saw (it had delete and approve).
        // Let's re-read RewardsTab.tsx to be sure.
    });
});

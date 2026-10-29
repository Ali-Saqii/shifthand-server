 'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('events', {
      id: { type: Sequelize.UUID, allowNull: false, primaryKey: true },
      organization_id: {
        type: Sequelize.UUID, allowNull: false,
        references: { model: 'organizations', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE'
      },
      title: { type: Sequelize.STRING(200), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      location: { type: Sequelize.STRING(255), allowNull: true },
      starts_at: { type: Sequelize.DATE, allowNull: false },
      ends_at: { type: Sequelize.DATE, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });
    await queryInterface.addIndex('events', ['organization_id', 'starts_at']);
  },
  async down(queryInterface) {
    await queryInterface.dropTable('events');
  }
};